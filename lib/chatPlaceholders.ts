/**
 * chatPlaceholders.ts (DEPRECATED - v2.3.0)
 *
 * Este archivo está en proceso de deprecación.
 * - filterImagesByMoment() → Movido a lib/llm.ts
 * - extractKeyElements() → ELIMINADO (regex problemático)
 * - buildContextWithImages() → ELIMINADO (no usado)
 * - replaceConceptPlaceholders() → Mantener temporalmente hasta refactor completo
 *
 * TODO: Mover replaceConceptPlaceholders() a lib/utils/textUtils.ts
 */

/**
 * Extrae conceptos básicos del objetivo de la lección
 * Versión simplificada sin regex complejo
 */
function extractBasicConcepts(lesson: any): {
  process: string;
  mainConcept: string;
  method: string;
  elements: string;
} {
  const objetivo = lesson.objetivo || '';

  // Buscar proceso (ej: "proceso de IPERC")
  const processMatch = objetivo.match(/proceso de ([A-Z]+)/i);
  const process = processMatch ? processMatch[1] : 'IPERC';

  // Concepto principal - primera parte del objetivo
  const mainConceptMatch = objetivo.match(/^([^y]+)/);
  const mainConcept = mainConceptMatch ? mainConceptMatch[1].trim() : 'gestión de riesgos';

  // Método - última parte del objetivo
  const methodMatch = objetivo.match(/en la (.+)$/);
  const method = methodMatch ? methodMatch[1].trim() : 'aplicación práctica';

  // Elementos - extraer de criterios_evaluacion si existen
  let elements = 'los elementos clave del proceso';
  if (lesson.criterios_evaluacion && Array.isArray(lesson.criterios_evaluacion)) {
    const firstCriterio = lesson.criterios_evaluacion[0] || '';
    const elementMatch = firstCriterio.match(/(?:los? |las? )?(\w+(?:\s+\w+)?)/i);
    if (elementMatch && elementMatch[1]) {
      elements = elementMatch[1].toLowerCase();
    }
  }

  return { process, mainConcept, method, elements };
}

/**
 * Reemplaza placeholders genéricos con conceptos específicos de la lección
 *
 * Variables soportadas:
 * - [PROCESS] - Proceso principal (ej: "IPERC")
 * - [MAIN_CONCEPT] - Concepto principal (ej: "gestión de riesgos")
 * - [METHOD] - Método o aplicación (ej: "aplicación práctica")
 * - [ELEMENT] - Elementos clave extraídos de la lección
 *
 * NOTA: Solo usar para welcome messages y planner questions.
 * NO usar para Tutor-generated feedback (ya usa términos específicos).
 *
 * @param text - Texto con placeholders genéricos
 * @param lesson - Objeto de lección con metadatos
 * @returns Texto con placeholders reemplazados
 */
export function replaceConceptPlaceholders(text: string, lesson: any): string {
  const { process, mainConcept, method, elements } = extractBasicConcepts(lesson);

  // Reemplazar placeholders
  let result = text;
  result = result.replace(/\[PROCESS\]/g, process);
  result = result.replace(/\[MAIN_CONCEPT\]/g, mainConcept);
  result = result.replace(/\[METHOD\]/g, method);
  result = result.replace(/\[ELEMENT\]/g, elements);

  return result;
}
