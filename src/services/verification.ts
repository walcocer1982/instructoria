import { anthropic, HAIKU_MODEL } from '@/lib/anthropic'
import { Activity, VerificationResult } from '@/types/topic-content'
import { Message } from '@prisma/client'

/**
 * Extrae JSON de texto que puede contener explicaciones adicionales
 */
function extractJSON(text: string): string {
  // Buscar JSON entre llaves, manejando casos donde hay texto antes o después
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }

  // Si no encuentra llaves, intentar limpiar código markdown
  const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const jsonMatch2 = cleanText.match(/\{[\s\S]*\}/)
  if (jsonMatch2) {
    return jsonMatch2[0]
  }

  return text
}

/**
 * Analiza si la respuesta del estudiante cumple los criterios de éxito
 */
export async function analyzeStudentResponse(
  activity: Activity,
  studentMessage: string,
  conversationHistory: Message[]
): Promise<VerificationResult> {
  // Valores por defecto si no existen success_criteria (JSON simplificado)
  const minCompleteness = activity.verification.success_criteria?.min_completeness || 70
  const requiredLevel = activity.verification.success_criteria?.understanding_level || 'applied'
  const mustInclude = activity.verification.success_criteria?.must_include || []

  const analysisPrompt = `Analiza si la respuesta del estudiante cumple los criterios de éxito de esta actividad.

PREGUNTA DE VERIFICACIÓN:
${activity.verification.question || activity.verification.initial_question}

${mustInclude.length > 0 ? `CRITERIOS REQUERIDOS:
${mustInclude.map((c, i) => `${i}. ${c}`).join('\n')}` : ''}

Nivel de comprensión requerido: ${requiredLevel}
Completitud mínima: ${minCompleteness}%

RESPUESTA DEL ESTUDIANTE:
"${studentMessage}"

HISTORIAL PREVIO (últimos 3 mensajes):
${conversationHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

REGLAS:
- ready_to_advance es true solo si completeness_percentage >= ${minCompleteness}
- Si solo memorizó pero el nivel requerido es "applied", ready_to_advance debe ser false

IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON, sin texto adicional, sin markdown, sin explicaciones.

Formato de respuesta:
{"criteria_met": [0], "criteria_missing": [1], "completeness_percentage": 80, "understanding_level": "applied", "needs_reprompt": false, "suggested_reprompt_type": "correct", "key_insights": ["concepto1"], "ready_to_advance": true}`

  try {
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL, // Optimización: Haiku es suficiente para verificación
      max_tokens: 500,
      messages: [{ role: 'user', content: analysisPrompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Respuesta inesperada de la API')
    }

    // Extraer JSON del texto de forma robusta
    const jsonText = extractJSON(content.text)
    const result = JSON.parse(jsonText) as VerificationResult
    return result
  } catch (error) {
    console.error('Error en verificación:', error)
    // Valor por defecto conservador
    const mustInclude = activity.verification.success_criteria?.must_include || []
    return {
      criteria_met: [],
      criteria_missing: mustInclude.map((_, i) => i),
      completeness_percentage: 0,
      understanding_level: 'memorized',
      needs_reprompt: true,
      suggested_reprompt_type: 'incomplete',
      key_insights: [],
      ready_to_advance: false,
    }
  }
}
