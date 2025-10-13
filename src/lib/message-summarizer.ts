/**
 * Sistema de resumen inteligente de mensajes del instructor
 * Reduce tokens manteniendo información clave
 */

/**
 * Resume un mensaje largo del instructor a su esencia
 */
export function summarizeInstructorMessage(content: string): string {
  // Si es corto (< 100 chars), mantenerlo completo
  if (content.length < 100) {
    return content
  }

  // Detectar tipo de mensaje y resumir según el caso

  // 1. Guardrails
  if (content.includes('No puedo ayudarte con ese tema') ||
      content.includes('está fuera del alcance')) {
    return '[Redirigió al tema del curso]'
  }

  // 2. Felicitaciones / Completó actividad
  if (content.includes('completado esta actividad') ||
      content.includes('Excelente trabajo') ||
      content.includes('✅')) {
    return '[Estudiante completó actividad correctamente]'
  }

  // 3. Repreguntas / Pistas
  if (content.includes('Déjame hacerte una pregunta') ||
      content.includes('Pista:') ||
      content.includes('Intenta')) {
    return '[Hizo repregunta para verificar comprensión]'
  }

  // 4. Explicaciones largas
  if (content.includes('Déjame darte') ||
      content.includes('ejemplo') ||
      content.includes('Imagina')) {

    // Extraer tema principal
    const lines = content.split('\n').filter(l => l.trim())
    const firstMeaningfulLine = lines.find(l =>
      l.length > 20 &&
      !l.startsWith('¡') &&
      !l.startsWith('---')
    ) || lines[0]

    return `[Explicó: ${firstMeaningfulLine.slice(0, 80)}...]`
  }

  // 5. Por defecto: primeras 80 caracteres
  return `[${content.slice(0, 80)}...]`
}

/**
 * Filtra y optimiza el historial conversacional
 * Solo mantiene lo esencial para el contexto
 */
export function buildOptimizedContext(messages: Array<{ role: string; content: string }>): string {
  // Mantener solo últimos 5 mensajes (antes era 10)
  const recentMessages = messages.slice(-5)

  return recentMessages.map((m, index) => {
    if (m.role === 'user') {
      // Mensajes del estudiante: siempre completos
      return `[Estudiante]: ${m.content}`
    } else {
      // Mensajes del instructor: resumidos
      const summary = summarizeInstructorMessage(m.content)
      return `[Instructor]: ${summary}`
    }
  }).join('\n')
}

/**
 * Calcula tokens aproximados de un texto
 * (1 token ≈ 4 caracteres en español)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Muestra estadísticas de optimización
 */
export function getOptimizationStats(
  originalMessages: Array<{ role: string; content: string }>,
  optimizedContext: string
): {
  originalTokens: number
  optimizedTokens: number
  savings: number
  savingsPercent: number
} {
  const originalText = originalMessages.map(m => m.content).join('\n')
  const originalTokens = estimateTokens(originalText)
  const optimizedTokens = estimateTokens(optimizedContext)
  const savings = originalTokens - optimizedTokens
  const savingsPercent = Math.round((savings / originalTokens) * 100)

  return {
    originalTokens,
    optimizedTokens,
    savings,
    savingsPercent
  }
}
