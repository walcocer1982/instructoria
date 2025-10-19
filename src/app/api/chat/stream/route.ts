/**
 * POST /api/chat/stream
 * Streaming endpoint para respuestas del instructor en tiempo real
 */

import { NextRequest } from 'next/server'
import { anthropic, DEFAULT_MODEL } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'
import { parseTopicContent, parseEvidenceData, createEvidenceData } from '@/lib/type-helpers'
import { moderateContent } from '@/services/moderation'
import { classifyIntent } from '@/services/intent-classification'
import { analyzeStudentResponse } from '@/services/verification'
import { buildSystemPrompt } from '@/services/prompt-builder'
import { getCachedTopicContext, setCachedTopicContext } from '@/lib/session-cache'
import { getCurrentActivity } from '@/services/chat'
import { updateTopicProgress } from '@/services/progress'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const { sessionId, message: studentMessage } = await request.json()

  if (!sessionId || !studentMessage) {
    return new Response('Missing sessionId or message', { status: 400 })
  }

  const startTime = Date.now()

  // Crear ReadableStream para SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const t1 = Date.now()

        // 1. Cargar contexto
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Sesión no encontrada' })}\n\n`))
          controller.close()
          return
        }

        // Intentar cache
        let topic = session.topicEnrollment.topic
        let content, topicImages

        const cachedContext = getCachedTopicContext(topic.id)
        if (cachedContext) {
          content = cachedContext.content
          topicImages = cachedContext.images
          topic = { ...topic, instructor: cachedContext.instructor }
        } else {
          content = parseTopicContent(topic.contentJson)
          topicImages = (topic.images as any[]) || []
          setCachedTopicContext(topic.id, topic, content, topicImages, topic.instructor)
        }

        const { currentMoment, currentActivity } = getCurrentActivity(
          content,
          session.currentClassId,
          session.currentMomentId,
          session.currentActivityId
        )

        console.log(`[STREAM] Cargar contexto: ${Date.now() - t1}ms`)

        // 2. Moderación + Clasificación en paralelo
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

        console.log(`[STREAM] Moderación + Clasificación: ${Date.now() - t2}ms`)

        // Verificar moderación
        if (!moderation.is_safe) {
          const guardrailResponse = currentActivity.guardrails?.response_on_violation.template
            .replace('{especialidad}', topic.instructor.specialty)
            .replace('{tema_actual}', currentMoment.title) ||
            'No puedo continuar con ese tema.'

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'guardrail',
            content: guardrailResponse,
            done: true
          })}\n\n`))
          controller.close()
          return
        }

        // 3. Construir prompt
        const t3 = Date.now()

        // Detectar si es la última actividad del tema (reusar content ya parseado arriba)
        const nextActivity = findNextActivity(content, currentMoment.id, currentActivity.id)
        const isLastActivity = nextActivity === null

        const { staticBlocks, dynamicPrompt } = buildSystemPrompt({
          topic,
          session,
          currentMoment,
          currentActivity,
          conversationHistory: session.messages.reverse(),
          completedActivities: session.topicEnrollment.activities.map(a => a.activityId),
          images: topicImages,
          isLastActivity
        })

        let finalDynamicPrompt = dynamicPrompt
        if (intent.intent === 'ask_question' && !intent.is_on_topic) {
          finalDynamicPrompt += `\n\n⚠️ IMPORTANTE: El estudiante preguntó sobre "${intent.topic_mentioned}" que está fuera del alcance actual. Usa la estrategia: ${intent.suggested_response_strategy}`
        }

        const messages = [
          ...session.messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          })),
          { role: 'user' as const, content: studentMessage }
        ]

        console.log(`[STREAM] Construir prompt: ${Date.now() - t3}ms`)

        // 4. Calcular maxTokens según complejidad de la actividad
        // Añadimos margen de seguridad (~20%) para que pueda completar frases
        const COMPLEXITY_TOKENS = {
          simple: 600,     // Target: 150-300 palabras (~300-400 tokens) + margen
          moderate: 850,   // Target: 300-450 palabras (~450-600 tokens) + margen
          complex: 1100    // Target: 450-600 palabras (~650-800 tokens) + margen
        }

        const maxTokens = currentActivity.complexity
          ? COMPLEXITY_TOKENS[currentActivity.complexity]
          : (topic.instructor.maxTokens || 850)  // Default: moderate

        console.log(`[STREAM] Using maxTokens: ${maxTokens} (complexity: ${currentActivity.complexity || 'default'}) - Target: ${currentActivity.teaching?.target_length || 'N/A'}`)

        // 5. STREAMING de Claude
        const t4 = Date.now()
        const claudeStream = await anthropic.messages.stream({
          model: topic.instructor.modelId || DEFAULT_MODEL,
          max_tokens: maxTokens,
          temperature: topic.instructor.temperature || 0.6,
          system: [
            ...staticBlocks,
            {
              type: 'text',
              text: finalDynamicPrompt
            }
          ],
          messages
        })

        let fullMessage = ''
        let inputTokens = 0
        let outputTokens = 0

        // Enviar chunks al cliente
        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const chunk = event.delta.text
            fullMessage += chunk

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'chunk',
              content: chunk
            })}\n\n`))
          }

          if (event.type === 'message_start' && event.message.usage) {
            inputTokens = event.message.usage.input_tokens
          }

          if (event.type === 'message_delta' && event.usage) {
            outputTokens = event.usage.output_tokens
          }
        }

        console.log(`[STREAM] Claude streaming: ${Date.now() - t4}ms`)
        console.log(`[STREAM] Tokens - Input: ${inputTokens}, Output: ${outputTokens}`)

        // Enviar evento de finalización
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'done',
          tokens: { input: inputTokens, output: outputTokens },
          time: Date.now() - startTime
        })}\n\n`))

        controller.close()

        // 5. GUARDAR EN BD EN BACKGROUND (fire-and-forget)
        saveToDatabase(
          sessionId,
          studentMessage,
          fullMessage,
          inputTokens,
          outputTokens,
          currentActivity,
          currentMoment,
          session,
          intent
        ).catch(error => {
          console.error('[STREAM] Error guardando en BD:', error)
        })

      } catch (error) {
        console.error('[STREAM] Error:', error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: 'Error procesando mensaje'
        })}\n\n`))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

/**
 * Encuentra la siguiente actividad en el tema
 */
function findNextActivity(content: any, currentMomentId: string, currentActivityId: string): {
  momentId: string
  activityId: string
} | null {
  const topicData = content.topic || content

  if (topicData.moments) {
    // Encontrar el índice del momento actual
    const currentMomentIndex = topicData.moments.findIndex((m: any) => m.id === currentMomentId)

    if (currentMomentIndex === -1) return null

    const currentMoment = topicData.moments[currentMomentIndex]

    // Encontrar el índice de la actividad actual
    const currentActivityIndex = currentMoment.activities?.findIndex((a: any) => a.id === currentActivityId) ?? -1

    // Si hay más actividades en el mismo momento
    if (currentActivityIndex !== -1 && currentMoment.activities && currentActivityIndex + 1 < currentMoment.activities.length) {
      return {
        momentId: currentMomentId,
        activityId: currentMoment.activities[currentActivityIndex + 1].id
      }
    }

    // Si no hay más actividades en este momento, ir al siguiente momento
    if (currentMomentIndex + 1 < topicData.moments.length) {
      const nextMoment = topicData.moments[currentMomentIndex + 1]
      if (nextMoment.activities && nextMoment.activities.length > 0) {
        return {
          momentId: nextMoment.id,
          activityId: nextMoment.activities[0].id
        }
      }
    }
  }

  return null // No hay más actividades
}

/**
 * Guardar mensajes y progreso en background
 */
async function saveToDatabase(
  sessionId: string,
  studentMessage: string,
  instructorMessage: string,
  inputTokens: number,
  outputTokens: number,
  currentActivity: any,
  currentMoment: any,
  session: any,
  intent: any
) {
  const t5 = Date.now()

  // Guardar mensajes secuencialmente para garantizar orden correcto por timestamp
  const userTimestamp = new Date()
  const assistantTimestamp = new Date(userTimestamp.getTime() + 1) // +1ms garantiza orden

  await prisma.message.createMany({
    data: [
      {
        sessionId,
        role: 'user',
        content: studentMessage,
        activityId: currentActivity.id,
        momentId: currentMoment.id,
        classId: session.currentClassId,
        timestamp: userTimestamp
      },
      {
        sessionId,
        role: 'assistant',
        content: instructorMessage,
        activityId: currentActivity.id,
        momentId: currentMoment.id,
        classId: session.currentClassId,
        inputTokens,
        outputTokens,
        timestamp: assistantTimestamp
      }
    ]
  })

  console.log(`[STREAM] Intent detected: ${intent.intent}`)

  // Si es respuesta de verificación, analizar
  if (intent.intent === 'answer_verification') {
    console.log(`[STREAM] Analyzing student response for verification...`)
    const verification = await analyzeStudentResponse(
      currentActivity,
      studentMessage,
      session.messages
    )
    console.log(`[STREAM] Verification result - ready_to_advance: ${verification.ready_to_advance}`)

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
      prisma.learningSession.update({
        where: { id: sessionId },
        data: { lastActivityAt: new Date() }
      })
    ])

    // Actualizar progreso del tema si se completó una actividad
    if (verification.ready_to_advance) {
      console.log(`[STREAM] ✅ Activity completed! Updating topic progress...`)
      const newProgress = await updateTopicProgress(session.topicEnrollmentId)
      console.log(`[STREAM] 📊 Topic progress updated to ${newProgress}%`)

      // Avanzar a la siguiente actividad
      const content = parseTopicContent(session.topicEnrollment.topic.contentJson)
      const nextActivity = findNextActivity(content, currentMoment.id, currentActivity.id)

      if (nextActivity) {
        await prisma.learningSession.update({
          where: { id: sessionId },
          data: {
            currentMomentId: nextActivity.momentId,
            currentActivityId: nextActivity.activityId
          }
        })
        console.log(`[STREAM] 🎯 Advanced to next activity: ${nextActivity.activityId} in moment ${nextActivity.momentId}`)
      } else {
        console.log(`[STREAM] 🏁 All activities completed!`)
      }
    }
  } else {
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() }
    })
  }

  console.log(`[STREAM] Guardar DB (background): ${Date.now() - t5}ms`)
}
