import { anthropic, HAIKU_MODEL } from '@/lib/anthropic'
import { ModerationResult } from '@/types/topic-content'

/**
 * Lista de respuestas comunes que obviamente son seguras
 */
const SAFE_QUICK_RESPONSES = [
  'si', 'sí', 'ok', 'vale', 'entendido', 'claro', 'continuar', 'siguiente',
  'adelante', 'de acuerdo', 'perfecto', 'gracias', 'listo', 'no', 'tal vez'
]

/**
 * Verifica si un mensaje es obviamente seguro (respuesta corta y simple)
 */
function isObviouslySafe(message: string): boolean {
  const normalized = message.toLowerCase().trim()

  // Respuestas muy cortas (<=3 palabras) que son respuestas comunes
  const words = normalized.split(/\s+/)
  if (words.length <= 3 && words.length > 0) {
    // Si todas las palabras son respuestas comunes, es seguro
    const allCommon = words.every(word =>
      SAFE_QUICK_RESPONSES.includes(word) ||
      /^[a-záéíóúñ]+$/.test(word) // Solo letras
    )
    if (allCommon) return true
  }

  // Mensajes muy cortos (<30 caracteres) sin palabras sospechosas
  if (normalized.length < 30 && !containsSuspiciousPatterns(normalized)) {
    return true
  }

  return false
}

/**
 * Detecta patrones sospechosos que requieren moderación
 */
function containsSuspiciousPatterns(message: string): boolean {
  const suspiciousPatterns = [
    /\b(matar|morir|muerte|suicid|violencia)\b/i,
    /\b(droga|cocaína|marihuana|heroína)\b/i,
    /\b(sex|porno|xxx|desnud)\b/i,
    /\b(idiota|estúpid|imbécil|mierda|joder)\b/i,
    /\b(hack|robar|estafar|piratear)\b/i,
    /(https?:\/\/|www\.)/i, // URLs pueden ser spam
  ]

  return suspiciousPatterns.some(pattern => pattern.test(message))
}

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
 * Modera el contenido del mensaje del estudiante
 * para detectar contenido inapropiado
 */
export async function moderateContent(message: string): Promise<ModerationResult> {
  // OPTIMIZACIÓN: Skip moderación para mensajes obviamente seguros
  if (isObviouslySafe(message)) {
    return {
      is_safe: true,
      violations: [],
      severity: 'none',
      requires_intervention: false,
    }
  }

  const moderationPrompt = `Analiza si este mensaje de un estudiante contiene contenido inapropiado para un contexto educativo profesional.

MENSAJE DEL ESTUDIANTE:
"${message}"

Categorías prohibidas:
1. sexual_content: Contenido sexual explícito o insinuaciones
2. violence: Violencia explícita o amenazas
3. illegal_activities: Actividades ilegales
4. personal_attacks: Insultos o ataques personales
5. hate_speech: Discurso de odio
6. spam: Spam o promoción comercial

IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON, sin texto adicional, sin markdown, sin explicaciones.

Formato de respuesta:
{"is_safe": true, "violations": [], "severity": "none", "requires_intervention": false}`

  try {
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL, // Optimización: Haiku es suficiente para moderación
      max_tokens: 300,
      messages: [{ role: 'user', content: moderationPrompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Respuesta inesperada de la API')
    }

    // Extraer JSON del texto de forma robusta
    const jsonText = extractJSON(content.text)
    const result = JSON.parse(jsonText) as ModerationResult
    return result
  } catch (error) {
    console.error('Error en moderación:', error)
    // En caso de error, permitir por defecto (fail-open)
    return {
      is_safe: true,
      violations: [],
      severity: 'none',
      requires_intervention: false,
    }
  }
}
