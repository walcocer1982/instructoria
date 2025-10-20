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
 * NOTA: En contextos educativos de SSO, términos como "riesgo", "peligro", "lesión" son NORMALES
 */
function containsSuspiciousPatterns(message: string): boolean {
  // Términos educativos de SSO que NO son sospechosos
  const ssoEducationalTerms = /\b(riesgo|peligro|lesión|accidente|incidente|hallazgo|crítico|mayor|menor|emergencia|evacuación|EPP|control|inspección|clasificación|severidad)\b/i

  // Si contiene términos educativos de SSO, NO es sospechoso
  if (ssoEducationalTerms.test(message)) {
    return false
  }

  // Patrones genuinamente sospechosos (contexto NO educativo)
  const suspiciousPatterns = [
    /\b(suicid|asesinat)\b/i, // Específicos, no incluir "muerte" genérico
    /\b(cocaína|heroína|metanfetamina)\b/i, // Drogas ilegales específicas
    /\b(porno|xxx|desnud|sexual)\b/i,
    /\b(idiota|estúpid|imbécil|mierda|carajo|joder)\b/i,
    /\b(robar|estafar|piratear|hackear)\b/i,
    /(https?:\/\/|www\.)/i, // URLs pueden ser spam
  ]

  return suspiciousPatterns.some(pattern => pattern.test(message))
}

/**
 * Construye nota de contexto dinámicamente según el tema
 */
function buildContextNote(context?: { topicTitle?: string; careerName?: string }): string {
  if (!context?.topicTitle) {
    return '⚠️ CONTEXTO: Curso educativo general. Evalúa el mensaje en contexto académico.'
  }

  const topicLower = context.topicTitle.toLowerCase()
  const careerLower = context.careerName?.toLowerCase() || ''

  // Detectar temas de SSO (Seguridad y Salud Ocupacional)
  if (
    topicLower.includes('seguridad') ||
    topicLower.includes('riesgo') ||
    topicLower.includes('iperc') ||
    topicLower.includes('inspeccion') ||
    careerLower.includes('sso') ||
    careerLower.includes('seguridad')
  ) {
    return `⚠️ CONTEXTO IMPORTANTE: Este es un curso de SEGURIDAD Y SALUD OCUPACIONAL.
Es NORMAL y APROPIADO que los estudiantes mencionen:
- Riesgos, peligros, accidentes, lesiones, muerte laboral
- Clasificaciones de severidad: CRÍTICO, MAYOR, MENOR
- Inspecciones, hallazgos, condiciones peligrosas
- EPP, controles, emergencias, evacuaciones
- Describir accidentes laborales para aprender prevención`
  }

  // Detectar temas de salud/medicina
  if (
    topicLower.includes('salud') ||
    topicLower.includes('enfermería') ||
    topicLower.includes('medicina') ||
    topicLower.includes('primeros auxilios')
  ) {
    return `⚠️ CONTEXTO IMPORTANTE: Este es un curso de SALUD/MEDICINA.
Es NORMAL y APROPIADO que los estudiantes mencionen:
- Síntomas, enfermedades, lesiones, procedimientos médicos
- Partes del cuerpo humano, anatomía
- Tratamientos, medicamentos, intervenciones médicas
- Casos clínicos para aprendizaje`
  }

  // Otros cursos
  return `⚠️ CONTEXTO: Curso de "${context.topicTitle}". Evalúa el mensaje en contexto educativo del tema.`
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
 *
 * @param message - Mensaje del estudiante
 * @param context - Contexto opcional del tema actual
 */
export async function moderateContent(
  message: string,
  context?: { topicTitle?: string; careerName?: string }
): Promise<ModerationResult> {
  // OPTIMIZACIÓN: Skip moderación para mensajes obviamente seguros
  if (isObviouslySafe(message)) {
    return {
      is_safe: true,
      violations: [],
      severity: 'none',
      requires_intervention: false,
    }
  }

  // Construir contexto dinámico basándose en el tema
  const contextNote = buildContextNote(context)

  const moderationPrompt = `Analiza si este mensaje de un estudiante contiene contenido inapropiado para un contexto educativo profesional.

${contextNote}

MENSAJE DEL ESTUDIANTE:
"${message}"

Categorías REALMENTE prohibidas:
1. sexual_content: Contenido sexual explícito o insinuaciones
2. violence: Violencia personal explícita o amenazas (distinguir de contenido educativo según contexto)
3. illegal_activities: Actividades ilegales
4. personal_attacks: Insultos o ataques personales al instructor
5. hate_speech: Discurso de odio
6. spam: Spam o promoción comercial

⚠️ IMPORTANTE: Evalúa el mensaje en el CONTEXTO EDUCATIVO del curso.
Términos que pueden parecer inapropiados en conversación normal pueden ser apropiados en contexto educativo.

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
