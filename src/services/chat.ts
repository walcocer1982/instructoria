import { anthropic, DEFAULT_MODEL } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'
import { parseTopicContent, parseEvidenceData, createEvidenceData } from '@/lib/type-helpers'
import { Activity, IntentClassification, Moment, TopicContent, VerificationResult } from '@/types/topic-content'
import { moderateContent } from './moderation'
import { classifyIntent } from './intent-classification'
import { analyzeStudentResponse } from './verification'
import { buildSystemPrompt } from './prompt-builder'
import { getCachedTopicContext, setCachedTopicContext } from '@/lib/session-cache'

interface ChatResponse {
  message: string
  type: 'guardrail' | 'verification_response' | 'question_response' | 'normal'
  verification?: VerificationResult
  intent?: IntentClassification
  canAdvance?: boolean
  allowContinue: boolean
}

/**
 * Procesa el mensaje del estudiante y genera respuesta del instructor IA
 */
export async function processStudentMessage(
  studentMessage: string,
  sessionId: string
): Promise<ChatResponse> {
  const startTime = Date.now()

  // 1. Cargar contexto completo
  const t1 = Date.now()
  const session = await prisma.learningSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: {
        orderBy: { timestamp: 'desc' },
        take: 20
      },
      topicEnrollment: {
        include: {
          topic: {
            include: {
              instructor: true
            }
          },
          activities: {
            where: { status: 'COMPLETED' },
            select: { activityId: true }
          }
        }
      },
      user: true
    }
  })

  if (!session) {
    throw new Error('Sesión no encontrada')
  }

  // OPTIMIZACIÓN: Intentar obtener del cache primero
  let topic = session.topicEnrollment.topic
  let content: TopicContent
  let topicImages: any[]

  const cachedContext = getCachedTopicContext(topic.id)
  if (cachedContext) {
    console.log(`[PERF] ✅ Cache HIT para topic ${topic.id}`)
    content = cachedContext.content
    topicImages = cachedContext.images
    topic = { ...topic, instructor: cachedContext.instructor }
  } else {
    console.log(`[PERF] ❌ Cache MISS para topic ${topic.id} - cargando...`)
    content = parseTopicContent(topic.contentJson)
    topicImages = (topic.images as any[]) || []

    // Guardar en cache para futuras requests
    setCachedTopicContext(
      topic.id,
      topic,
      content,
      topicImages,
      topic.instructor
    )
  }

  // Obtener actividad actual
  const { currentMoment, currentActivity } = getCurrentActivity(
    content,
    session.currentClassId,
    session.currentMomentId,
    session.currentActivityId
  )
  console.log(`[PERF] Cargar contexto: ${Date.now() - t1}ms`)

  // 2. MODERACIÓN + CLASIFICACIÓN EN PARALELO (optimización de velocidad)
  const t2 = Date.now()
  const [moderation, intent] = await Promise.all([
    moderateContent(studentMessage),
    classifyIntent(studentMessage, currentActivity, {
      currentTopic: topic.title,
      currentMoment: currentMoment.title,
      currentActivity: currentActivity.teaching.agent_instruction,
      lastInstructorQuestion: session.messages[0]?.content
    })
  ])

  // Verificar moderación primero
  if (!moderation.is_safe) {
    // Registrar incidente
    await prisma.securityIncident.create({
      data: {
        sessionId,
        userId: session.userId,
        incidentType: 'content_violation',
        details: {
          message: studentMessage,
          violations: moderation.violations,
          severity: moderation.severity
        },
        severity: moderation.severity
      }
    })

    const guardrailResponse = currentActivity.guardrails?.response_on_violation.template
      .replace('{especialidad}', topic.instructor.specialty)
      .replace('{tema_actual}', currentMoment.title) ||
      'No puedo continuar con ese tema. Mantengamos la conversación profesional.'

    return {
      message: guardrailResponse,
      type: 'guardrail',
      allowContinue: false
    }
  }
  console.log(`[PERF] Moderación + Clasificación: ${Date.now() - t2}ms`)

  // 4. CONSTRUIR SYSTEM PROMPT CON PROMPT CACHING
  const t3 = Date.now()
  const { staticBlocks, dynamicPrompt } = buildSystemPrompt({
    topic,
    session,
    currentMoment,
    currentActivity,
    conversationHistory: session.messages.reverse(),
    completedActivities: session.topicEnrollment.activities.map(a => a.activityId),
    images: topicImages
  })

  // Agregar instrucciones específicas según intención al bloque dinámico
  let finalDynamicPrompt = dynamicPrompt
  if (intent.intent === 'ask_question' && !intent.is_on_topic) {
    finalDynamicPrompt += `\n\n⚠️ IMPORTANTE: El estudiante preguntó sobre "${intent.topic_mentioned}" que está fuera del alcance actual. Usa la estrategia: ${intent.suggested_response_strategy}`
  }

  // 5. PREPARAR MENSAJES PARA CLAUDE
  const messages = [
    ...session.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })),
    { role: 'user' as const, content: studentMessage }
  ]
  console.log(`[PERF] Construir prompt: ${Date.now() - t3}ms`)

  // 6. LLAMADA A CLAUDE CON PROMPT CACHING
  // Los bloques estáticos se cachean automáticamente (90% de ahorro en tokens)
  // El bloque dinámico cambia en cada request (historial, progreso)
  const t4 = Date.now()
  const response = await anthropic.messages.create({
    model: topic.instructor.modelId || DEFAULT_MODEL,
    max_tokens: topic.instructor.maxTokens || 2048,
    temperature: topic.instructor.temperature || 0.7,
    system: [
      ...staticBlocks,
      {
        type: 'text',
        text: finalDynamicPrompt
      }
    ],
    messages
  })

  const instructorMessage = response.content[0].type === 'text'
    ? response.content[0].text
    : 'Error al generar respuesta'

  console.log(`[PERF] Llamada Claude: ${Date.now() - t4}ms`)
  console.log(`[PERF] Tokens - Input: ${response.usage.input_tokens}, Output: ${response.usage.output_tokens}`)

  // 7. GUARDAR MENSAJES Y ANÁLISIS (SI APLICA) EN PARALELO
  const t5 = Date.now()
  let verification: VerificationResult | undefined
  let canAdvance = false

  // Si es respuesta a verificación, analizar en paralelo mientras guardamos mensajes
  const verificationPromise = intent.intent === 'answer_verification'
    ? analyzeStudentResponse(currentActivity, studentMessage, session.messages)
    : Promise.resolve(undefined)

  // Ejecutar guardado de mensajes y análisis en paralelo
  const [, verificationResult] = await Promise.all([
    // Guardar mensajes
    prisma.message.createMany({
      data: [
        {
          sessionId,
          role: 'user',
          content: studentMessage,
          activityId: currentActivity.id,
          momentId: currentMoment.id,
          classId: session.currentClassId,
        },
        {
          sessionId,
          role: 'assistant',
          content: instructorMessage,
          activityId: currentActivity.id,
          momentId: currentMoment.id,
          classId: session.currentClassId,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        }
      ]
    }),
    // Análisis de verificación (si aplica)
    verificationPromise
  ])

  verification = verificationResult
  canAdvance = verification?.ready_to_advance || false

  // Actualizar progreso si hubo verificación (secuencial porque depende del resultado)
  if (verification) {
    const activityProgress = await prisma.activityProgress.findUnique({
      where: {
        topicEnrollmentId_activityId: {
          topicEnrollmentId: session.topicEnrollmentId,
          activityId: currentActivity.id
        }
      }
    })

    const existingEvidence = parseEvidenceData(activityProgress?.evidenceData || null)

    await Promise.all([
      // Actualizar progreso de actividad
      prisma.activityProgress.upsert({
        where: {
          topicEnrollmentId_activityId: {
            topicEnrollmentId: session.topicEnrollmentId,
            activityId: currentActivity.id
          }
        },
        create: {
          topicEnrollmentId: session.topicEnrollmentId,
          classId: session.currentClassId || '',
          momentId: currentMoment.id,
          activityId: currentActivity.id,
          status: verification.ready_to_advance ? 'COMPLETED' : 'IN_PROGRESS',
          startedAt: new Date(),
          completedAt: verification.ready_to_advance ? new Date() : null,
          attempts: 1,
          evidenceData: createEvidenceData({
            attempts: [{
              studentResponse: studentMessage,
              analysis: verification,
              timestamp: new Date()
            }]
          }),
          passedCriteria: verification.ready_to_advance,
          verifiedBy: 'ai'
        },
        update: {
          attempts: { increment: 1 },
          status: verification.ready_to_advance ? 'COMPLETED' : 'IN_PROGRESS',
          completedAt: verification.ready_to_advance ? new Date() : null,
          evidenceData: createEvidenceData({
            ...existingEvidence,
            attempts: [
              ...(existingEvidence.attempts || []),
              {
                studentResponse: studentMessage,
                analysis: verification,
                timestamp: new Date()
              }
            ]
          }),
          passedCriteria: verification.ready_to_advance
        }
      }),
      // Actualizar última actividad
      prisma.learningSession.update({
        where: { id: sessionId },
        data: { lastActivityAt: new Date() }
      })
    ])
  } else {
    // Solo actualizar última actividad si no hay verificación
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() }
    })
  }
  console.log(`[PERF] Guardar DB: ${Date.now() - t5}ms`)
  console.log(`[PERF] TOTAL: ${Date.now() - startTime}ms`)

  return {
    message: instructorMessage,
    type: intent.intent === 'answer_verification' ? 'verification_response' :
          intent.intent === 'ask_question' ? 'question_response' : 'normal',
    verification,
    intent,
    canAdvance,
    allowContinue: true
  }
}

/**
 * Obtiene la actividad actual basándose en los IDs de la sesión
 */
export function getCurrentActivity(
  content: TopicContent,
  classId: string | null,
  momentId: string | null,
  activityId: string | null
): { currentMoment: Moment; currentActivity: Activity } {
  // Si el tema tiene clases
  if (content.topic.classes && content.topic.classes.length > 0) {
    const currentClass = classId
      ? content.topic.classes.find(c => c.id === classId)
      : content.topic.classes[0]

    if (!currentClass) throw new Error('Clase no encontrada')

    const currentMoment = momentId
      ? currentClass.moments.find(m => m.id === momentId)
      : currentClass.moments[0]

    if (!currentMoment) throw new Error('Momento no encontrado')

    const currentActivity = activityId
      ? currentMoment.activities.find(a => a.id === activityId)
      : currentMoment.activities[0]

    if (!currentActivity) throw new Error('Actividad no encontrada')

    return { currentMoment, currentActivity }
  }
  // Si el tema tiene momentos directamente
  else if (content.topic.moments && content.topic.moments.length > 0) {
    const currentMoment = momentId
      ? content.topic.moments.find(m => m.id === momentId)
      : content.topic.moments[0]

    if (!currentMoment) throw new Error('Momento no encontrado')

    const currentActivity = activityId
      ? currentMoment.activities.find(a => a.id === activityId)
      : currentMoment.activities[0]

    if (!currentActivity) throw new Error('Actividad no encontrada')

    return { currentMoment, currentActivity }
  }

  throw new Error('Estructura de contenido inválida')
}
