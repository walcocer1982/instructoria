/**
 * Message Formatter - Sistema SOPHI v2.3.1
 *
 * Funciones de formateo de mensajes para presentación al estudiante.
 * Separado del orquestador porque es responsabilidad de capa de presentación.
 */

/**
 * Formatea el mensaje de evaluación final en markdown
 *
 * Estructura del mensaje:
 * - Puntuación general y estado (aprobado/no aprobado)
 * - Desglose por criterios de evaluación
 * - Retroalimentación general
 * - Fortalezas identificadas
 * - Recomendaciones de mejora
 *
 * @param evaluation - Objeto de evaluación del Evaluator Agent
 * @returns Mensaje formateado en markdown
 */
export function formatEvaluationMessage(evaluation: any): string {
  const passed = evaluation.passed;

  let message = `## 📊 Evaluación Final\n\n`;
  message += `**Puntuación General:** ${evaluation.overall_score}% ${passed ? '✅ ¡Aprobado!' : '❌ No aprobado'}\n\n`;

  // Desglose por criterios
  if (evaluation.rubric_scores && evaluation.rubric_scores.length > 0) {
    message += `### Por Criterio:\n`;
    evaluation.rubric_scores.forEach((rs: any) => {
      message += `- **${rs.criterion}**: ${rs.score}% (${rs.level})\n`;
    });
    message += `\n`;
  }

  // Retroalimentación general
  message += `### 💬 Retroalimentación:\n${evaluation.general_feedback}\n\n`;

  // Fortalezas
  if (evaluation.strengths && evaluation.strengths.length > 0) {
    message += `### ✨ Fortalezas:\n`;
    evaluation.strengths.forEach((str: string) => {
      message += `- ${str}\n`;
    });
    message += `\n`;
  }

  // Recomendaciones
  if (evaluation.recommendations && evaluation.recommendations.length > 0) {
    message += `### 📝 Recomendaciones:\n`;
    evaluation.recommendations.forEach((rec: string) => {
      message += `- ${rec}\n`;
    });
  }

  return message;
}
