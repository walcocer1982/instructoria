/**
 * Agente Planner - Planificación Pedagógica
 * Sistema SOPHI - Fase 0.4
 *
 * Genera estructura de lección basada en Gradual Release Model
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getLLMClient, mixTextAndImages } from '@/lib/llm';
import { buildSystemMessage } from '@/lib/promptConstants';
import { ImageRef } from '@/types';
import type { Lesson } from '@prisma/client';
import { LessonMomentPlan, MomentState } from '@/types/lessonPlan';
import { loadMoment, initializeMomentState } from './planUtils';

/**
 * Schema de Input para Planner
 */
export const PlannerInputSchema = z.object({
  objective: z.string().min(3).describe('Objetivo educativo de la lección'),
  images: z.array(z.object({
    url: z.string(),
    descripcion: z.string(),
    tipo: z.enum(['contexto', 'ejemplo', 'evidencia', 'recurso']),
  })).optional().describe('Imágenes de contexto'),
  constraints: z.array(z.string()).optional().describe('Restricciones adicionales'),
});

export type PlannerInput = z.infer<typeof PlannerInputSchema>;

/**
 * Schema de Output para Planner (Versión 2.0 - Extendido)
 * Incluye funcionalidad de Activities, Resources y AntiPlagiarism
 */
export const PlannerOutputSchema = z.object({
  momentos: z.array(z.object({
    id: z.string().describe('ID del momento: M0, M1, M2, M3, M4, M5'),
    nombre: z.string().describe('Nombre del momento pedagógico'),
    min: z.number().describe('Duración estimada en minutos'),
    actividad: z.string().describe('Descripción de qué debe hacer el estudiante en este momento'),
    evidencias: z.array(z.string()).describe('Evidencias concretas que debe demostrar el estudiante (2-4 items)'),
    pregunta_guia: z.string().describe('Pregunta Socrática principal para guiar el momento'),

    // NUEVO v4.0: Narrativa contextual rica (si hay imagen con descripción)
    contexto: z.string().optional().describe('Narrativa contextual rica de 2-4 oraciones que presenta la situación de forma vívida y motivadora (SOLO si hay imagen asociada)'),
  })).length(6).describe('Debe generar exactamente 6 momentos: M0 a M5'),

  criterios_evaluacion: z.array(z.string()).describe('Criterios generales para evaluar el logro del objetivo (3-5 items)'),
  nivel_complejidad: z.enum(['básico', 'intermedio', 'avanzado']).describe('Nivel de complejidad de la lección'),
});

export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;

/**
 * Agente Planner
 * Genera estructura de lección con 6 momentos pedagógicos
 */
export async function runPlannerAgent(input: PlannerInput): Promise<PlannerOutput> {
  // Validar input
  const validatedInput = PlannerInputSchema.parse(input);

  // Preparar cliente LLM
  const llmClient = getLLMClient();

  // Construir prompt SIMPLIFICADO v4.0
  const userPrompt = `
Genera una estructura de lección SIMPLE Y CLARA para el siguiente objetivo:

**Objetivo:** ${validatedInput.objective}

${validatedInput.constraints && validatedInput.constraints.length > 0 ? `
**Restricciones:**
${validatedInput.constraints.map(c => `- ${c}`).join('\n')}
` : ''}

## ESTRUCTURA GENERAL
Debes generar EXACTAMENTE 6 momentos siguiendo el modelo **Gradual Release**:
1. **M0 - Motivación** (5 min): Experiencias concretas, conexión con la realidad
2. **M1 - Saberes Previos** (5 min): Activar conocimientos previos
3. **M2 - Modelado** (10 min): Enseñanza explícita de conceptos
4. **M3 - Práctica Guiada** (10 min): Práctica con apoyo del tutor
5. **M4 - Práctica Independiente** (10 min): Trabajo autónomo
6. **M5 - Evaluación** (5 min): Verificación de aprendizaje

## PARA CADA MOMENTO GENERA:

1. **id**: M0, M1, M2, M3, M4, M5
2. **nombre**: Nombre del momento pedagógico
3. **min**: Duración estimada en minutos
4. **actividad**: Descripción de lo que el DOCENTE/FACILITADOR va a hacer o facilitar en este momento (1-2 oraciones)
5. **evidencias**: Qué evidencias concretas debe demostrar el estudiante (2-4 items específicos y observables)
6. **pregunta_guia**: Pregunta Socrática generada basándose en la pregunta guía base Y las evidencias esperadas
7. **contexto** (cuando hay imagen O evidencias complejas): Narrativa contextual RICA de 2-4 oraciones

**CÓMO GENERAR "actividad" (lo que hace el docente):**

La actividad describe la ACCIÓN DEL FACILITADOR, no del estudiante:

❌ MAL (describe acción del estudiante):
"El estudiante identifica peligros en la imagen"

✅ BIEN (describe acción del facilitador):
"Presentar una situación real de peligro en el trabajo para motivar la reflexión sobre seguridad laboral"
"Facilitar una discusión guiada sobre experiencias personales con peligros en el entorno laboral"
"Guiar la práctica de identificación y evaluación de riesgos usando la matriz de riesgos"

**CÓMO GENERAR "contexto" (narrativa rica):**

El contexto se genera basado en:
- **Si hay descripción de imagen**: Crear narrativa vívida basada en los detalles de la imagen
- **Si NO hay imagen**: Crear narrativa basada en las evidencias y el objetivo del momento

Características de un buen contexto:
- Presenta la situación de forma **VÍVIDA** (como si el estudiante estuviera ahí)
- Genera **CURIOSIDAD** por analizar la situación
- Usa detalles **ESPECÍFICOS** (números, medidas, condiciones concretas)
- Conecta con el objetivo de aprendizaje
- Motiva la reflexión crítica

**Ejemplos basados en imagen:**

❌ MAL (solo repite la descripción):
"Observa esta situación: trabajador en almacén sacando caja de 20 kg a 5 metros sin línea de vida."

✅ BIEN (M0 - narrativa vívida y motivadora):
"Imagina que llegas al turno de la mañana y ves a tu compañero Juan subido en una plataforma a 5 metros de altura, estirándose para alcanzar una caja de 20 kg. Notas que no lleva arnés de seguridad y la plataforma parece inestable. Esta situación real ocurre todos los días en almacenes como el tuyo."

**Ejemplos basados en evidencias (sin imagen):**

✅ BIEN (M1 - basado en evidencias esperadas):
"En tu experiencia diaria, has visto diferentes tipos de peligros: caídas, objetos pesados, electricidad, químicos. Cada uno tiene características únicas que debemos aprender a identificar y clasificar para trabajar de forma segura."

**CÓMO GENERAR "pregunta_guia" (basada en pregunta base + evidencias):**

La pregunta guía debe generarse considerando:
1. La pregunta guía base proporcionada en el lesson plan
2. Las evidencias específicas que el estudiante debe demostrar
3. El nivel de complejidad del momento pedagógico

❌ MAL (solo copia la pregunta base):
"¿Qué peligros identificas?"

✅ BIEN (enriquecida con evidencias esperadas):
"Observando esta situación, ¿qué peligros específicos identificas y por qué son peligrosos?"
"¿Qué harías para evitar que esta situación peligrosa ocurra en tu lugar de trabajo?"

## AL FINAL GENERA:

- **criterios_evaluacion**: 3-5 criterios generales para evaluar la lección completa
- **nivel_complejidad**: básico | intermedio | avanzado

================================================================================

Genera el JSON completo.
`;

  // Preparar contenido del mensaje (solo texto + descripciones, NO imágenes visuales)
  // v3.2.0: El Planner analiza descripciones textuales, no imágenes visuales
  let messageContent = userPrompt;

  if (validatedInput.images && validatedInput.images.length > 0) {
    const imageDescriptions = validatedInput.images
      .map((img, i) => `\n${i + 1}. [${img.tipo}] ${img.descripcion}`)
      .join('');

    messageContent = `${userPrompt}\n\n**Descripciones de Imágenes Disponibles:**${imageDescriptions}`;
  }

  // Convertir Zod schema a JSON schema para OpenAI
  const jsonSchema = {
    name: 'planner_output',
    strict: false, // false permite null en campos opcionales
    schema: zodToJsonSchema(PlannerOutputSchema, {
      target: 'openAi',
      $refStrategy: 'none',
    }),
  };

  // Llamar a OpenAI con structured output
  // Usamos gpt-4o (no mini) porque el output es mucho más complejo
  const result = await llmClient.chatStructured<PlannerOutput>(
    [
      {
        role: 'system',
        content: buildSystemMessage('planner'),
      },
      {
        role: 'user',
        content: messageContent,
      },
    ],
    jsonSchema,
    {
      model: 'gpt-4o',
      temperature: 0.7,
    }
  );

  // Validar output con Zod
  const validatedOutput = PlannerOutputSchema.parse(result);

  return validatedOutput;
}

export function getMomentPlan(lesson: Lesson, momentId: string): LessonMomentPlan {
  return loadMoment(lesson, momentId);
}

export function getAllMomentPlans(lesson: Lesson): LessonMomentPlan[] {
  const momentos = Array.isArray(lesson.momentos) ? lesson.momentos : [];
  return momentos.map((moment: any) => loadMoment(lesson, moment.id));
}

export function createMomentState(momentId: string, maxAttempts?: number): MomentState {
  return initializeMomentState(momentId, maxAttempts);
}
