import { anthropic, HAIKU_MODEL } from '@/lib/anthropic'
import { Activity, IntentClassification } from '@/types/topic-content'

export interface ConversationContext {
  currentTopic: string
  currentMoment: string
  currentActivity: string
  lastInstructorQuestion?: string
}

/**
 * Patrones para clasificación rápida
 */
const CONTINUATION_PATTERNS = [
  /^(si|sí|ok|vale|entendido|claro|continuar|siguiente|adelante|de acuerdo|perfecto|listo)$/i,
  /^(si|sí|ok|vale)\s+(por\s+favor|porfavor)$/i,
]

const QUESTION_PATTERNS = [
  /^(qué|que|cual|cuál|como|cómo|por\s*qué|porque|cuándo|cuando|dónde|donde)\s+/i,
  /\?\s*$/,
  /^(explica|explícame|podrías\s+explicar)/i,
  /^(puedes|podrias|podrías)\s+/i,
]

const CLARIFICATION_PATTERNS = [
  /^(no\s+entiendo|no\s+entendí|no\s+comprendo)/i,
  /^(repite|repíteme|otra\s+vez)/i,
  /^(podrías\s+aclarar|aclárame|aclara)/i,
]

/**
 * Clasificación rápida basada en patrones (no requiere API)
 */
function quickClassify(message: string): IntentClassification | null {
  const normalized = message.toLowerCase().trim()

  // Respuestas de continuación (muy comunes)
  if (CONTINUATION_PATTERNS.some(p => p.test(normalized))) {
    return {
      intent: 'answer_verification',
      question_type: null,
      is_on_topic: true,
      relevance_score: 100,
      topic_mentioned: null,
      needs_redirect: false,
      suggested_response_strategy: 'acknowledge_answer',
    }
  }

  // Solicitudes de aclaración claras
  if (CLARIFICATION_PATTERNS.some(p => p.test(normalized))) {
    return {
      intent: 'request_clarification',
      question_type: 'clarification',
      is_on_topic: true,
      relevance_score: 95,
      topic_mentioned: null,
      needs_redirect: false,
      suggested_response_strategy: 'full_answer',
    }
  }

  // Preguntas obvias
  if (QUESTION_PATTERNS.some(p => p.test(normalized))) {
    return {
      intent: 'ask_question',
      question_type: 'clarification', // Asumimos clarificación por defecto
      is_on_topic: true, // Asumimos on-topic, Claude validará si es necesario
      relevance_score: 80,
      topic_mentioned: null,
      needs_redirect: false,
      suggested_response_strategy: 'full_answer',
    }
  }

  // No se puede clasificar rápidamente
  return null
}

/**
 * Clasifica la intención del mensaje del estudiante
 */
export async function classifyIntent(
  message: string,
  activity: Activity,
  context: ConversationContext
): Promise<IntentClassification> {
  // OPTIMIZACIÓN: Intentar clasificación rápida primero
  const quickResult = quickClassify(message)
  if (quickResult) {
    return quickResult
  }
  const classificationPrompt = `
Clasifica la intención de este mensaje del estudiante.

CONTEXTO:
- Tema actual: ${context.currentTopic}
- Momento actual: ${context.currentMoment}
- Actividad: ${context.currentActivity}
- Última pregunta del instructor: ${context.lastInstructorQuestion || 'N/A'}

MENSAJE DEL ESTUDIANTE:
"${message}"

Alcance permitido:
${JSON.stringify(activity.student_questions?.scope || {}, null, 2)}

Responde SOLO con un objeto JSON válido (sin markdown, sin \`\`\`json):
{
  "intent": "answer_verification" | "ask_question" | "request_clarification" | "off_topic" | "small_talk",
  "question_type": "clarification" | "example_request" | "application" | "why_question" | "comparison" | "procedure" | null,
  "is_on_topic": true o false,
  "relevance_score": número entre 0-100,
  "topic_mentioned": "string o null",
  "needs_redirect": true o false,
  "suggested_response_strategy": "full_answer" | "brief_redirect" | "firm_redirect" | "acknowledge_answer"
}
`

  try {
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL, // Optimización: Haiku es suficiente para clasificación
      max_tokens: 400,
      messages: [{ role: 'user', content: classificationPrompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Respuesta inesperada de la API')
    }

    const result = JSON.parse(content.text) as IntentClassification
    return result
  } catch (error) {
    console.error('Error en clasificación de intención:', error)
    // Valor por defecto en caso de error
    return {
      intent: 'answer_verification',
      question_type: null,
      is_on_topic: true,
      relevance_score: 50,
      topic_mentioned: null,
      needs_redirect: false,
      suggested_response_strategy: 'acknowledge_answer',
    }
  }
}
