import { anthropic, HAIKU_BASIC_MODEL } from '@/lib/anthropic'
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

⚠️ REGLAS CRÍTICAS (aplicables a CUALQUIER curso educativo):

1. RESPUESTA A VERIFICACIÓN:
   - Si el instructor hizo una pregunta recientemente Y el estudiante responde con contenido técnico/educativo
   → intent = "answer_verification" (incluso si es parcial, informal, o con errores)

2. ON-TOPIC (SÉ GENEROSO):
   - Relacionado al tema = is_on_topic: true, relevance_score >= 70
   - Solo marca off-topic si es completamente ajeno al curso

3. EJEMPLOS:
   - "A, c, a, c, a, c La 1 la 3..." (intentando clasificar) → answer_verification, on-topic, relevance 75+
   - "que hice mal" (pregunta sobre su respuesta) → ask_question, on-topic, relevance 90+
   - "cuéntame un chiste" → small_talk, off-topic, relevance 0

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

  let rawResponse: any = null
  try {
    const response = await anthropic.messages.create({
      model: HAIKU_BASIC_MODEL, // Haiku 3.5 para tarea básica
      max_tokens: 400,
      messages: [{ role: 'user', content: classificationPrompt }],
    })

    const content = response.content[0]
    rawResponse = content // Guardar para debug en caso de error

    if (content.type !== 'text') {
      throw new Error('Respuesta inesperada de la API')
    }

    // Extraer JSON del texto (puede venir con markdown o texto adicional)
    let jsonText = content.text.trim()

    // Eliminar bloques de código markdown si existen
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')

    // Buscar el JSON dentro del texto (entre { y })
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    const result = JSON.parse(jsonText) as IntentClassification
    return result
  } catch (error) {
    console.error('Error en clasificación de intención:', error)
    if (rawResponse && rawResponse.type === 'text') {
      console.error('Texto recibido:', rawResponse.text)
    }
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
