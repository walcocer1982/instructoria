import { anthropic, DEFAULT_MODEL } from '@/lib/anthropic'
import { Activity, VerificationResult } from '@/types/topic-content'
import { Message } from '@prisma/client'
import { debugLog, debugError } from '@/lib/debug-utils'

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
  const minCompleteness = activity.verification.success_criteria?.min_completeness || 60
  const requiredLevel = activity.verification.success_criteria?.understanding_level || 'applied'
  const mustInclude = activity.verification.success_criteria?.must_include || []

  debugLog('VERIFICATION', '🎯 Criterios de éxito', {
    activityId: activity.id,
    minCompleteness,
    requiredLevel,
    mustIncludeCount: mustInclude.length
  })

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

REGLAS CRÍTICAS PARA EVALUACIÓN FLEXIBLE:
- ready_to_advance es true si completeness_percentage >= ${minCompleteness}
- SÉ FLEXIBLE: Evalúa COMPRENSIÓN DEL CONCEPTO, NO palabras exactas ni formato perfecto
- Si el estudiante demuestra que ENTENDIÓ LA IDEA CENTRAL, marca como correcto
- Acepta sinónimos, paráfrasis y diferentes formas de expresar el mismo concepto
- Solo marca como incorrecto si claramente NO ENTENDIÓ o dio información TOTALMENTE ERRÓNEA
- Si mencionó la idea principal aunque falten detalles menores, considera ready_to_advance=true

IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON, sin texto adicional, sin markdown, sin explicaciones.

Formato de respuesta:
{"criteria_met": [0], "criteria_missing": [1], "completeness_percentage": 80, "understanding_level": "applied", "needs_reprompt": false, "suggested_reprompt_type": "correct", "key_insights": ["concepto1"], "ready_to_advance": true}`

  let rawResponse = ''

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL, // Haiku 3.5 v2 (20250110)
      max_tokens: 500,
      messages: [{ role: 'user', content: analysisPrompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Respuesta inesperada de la API')
    }

    rawResponse = content.text // Guardar para logging en caso de error

    // Extraer JSON del texto de forma robusta
    const jsonText = extractJSON(content.text)

    // 🔍 DEBUG: Log del JSON antes de parsear
    debugLog('VERIFICATION', '🔍 JSON extraído', jsonText.substring(0, 200))

    const result = JSON.parse(jsonText) as VerificationResult

    // 🔍 DEBUG: Log del resultado parseado
    debugLog('VERIFICATION', '✅ Resultado parseado', {
      ready_to_advance: result.ready_to_advance,
      completeness_percentage: result.completeness_percentage,
      understanding_level: result.understanding_level
    })

    return result
  } catch (error) {
    debugError('VERIFICATION', 'Error en verificación', error)
    if (rawResponse) {
      debugError('VERIFICATION', 'Respuesta cruda de Claude', rawResponse.substring(0, 500))
    }
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
