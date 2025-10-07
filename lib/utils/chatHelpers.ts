/**
 * Chat Utilities - Sistema SOPHI v2.3.1
 *
 * Funciones de utilidad para el sistema de chat pedagógico.
 * Estas funciones NO pertenecen al orquestador porque son helpers puros sin lógica de coordinación.
 */

/**
 * Genera un ID único para una pregunta
 *
 * Formato: q_{timestamp}_{random}
 * Ejemplo: q_1706789123456_a7b3c9d
 */
export function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calcula tiempo transcurrido entre dos timestamps en segundos
 *
 * @param startTime - ISO timestamp de inicio
 * @param endTime - ISO timestamp de fin
 * @returns Tiempo transcurrido en segundos (redondeado)
 */
export function calculateTimeSpent(startTime: string, endTime: string): number {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.round((end - start) / 1000);
}

/**
 * Detecta si una respuesta del estudiante es ambigua o demasiado vaga
 *
 * Criterios de detección:
 * - Respuestas muy cortas (< 10 caracteres)
 * - Frases de incertidumbre ("no sé", "tal vez", etc.)
 * - Muletillas sin contenido ("mmm", "ehh", "pues")
 *
 * @param response - Respuesta del estudiante
 * @returns true si la respuesta es ambigua/vaga
 */
export function detectAmbiguousResponse(response: string): boolean {
  const trimmed = response.trim().toLowerCase();

  // Respuestas muy cortas
  if (trimmed.length < 10) {
    return true;
  }

  // Frases ambiguas comunes
  const ambiguousPhrases = [
    'no sé', 'nose', 'no se', 'no lo sé', 'no estoy seguro',
    'no entiendo', 'tal vez', 'quizás', 'puede ser',
    'creo que sí', 'creo que no', 'no me acuerdo',
    'mmm', 'ehh', 'pues', 'este', 'bueno',
  ];

  return ambiguousPhrases.some(phrase =>
    trimmed === phrase || trimmed.startsWith(phrase + ' ')
  );
}
