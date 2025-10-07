/**
 * Agente Checker - Clasificador y Redireccionador
 * Sistema SOPHI - v3.1.0 (Mejora: responde off-topic)
 *
 * RESPONSABILIDAD: Clasificar el tipo de mensaje del estudiante
 * - ¿Es una respuesta a la pregunta?
 * - ¿Es una pregunta general?
 * - ¿Es "no sé"?
 * - ¿Es off-topic? → Si sí, genera mensaje de redirección
 *
 * NO evalúa conceptos (eso lo hace Evaluator)
 * NO genera feedback pedagógico (eso lo hace Evaluator)
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getLLMClient } from '@/lib/llm';
import { buildSystemMessage } from '@/lib/promptConstants';

/**
 * Schema de Input para Checker - v3.0 (Simplificado)
 * Solo necesita la pregunta y la respuesta para clasificar
 */
export const CheckerInputSchema = z.object({
  question: z.string().describe('Pregunta realizada al estudiante'),
  student_message: z.string().describe('Mensaje/respuesta del estudiante'),
  objective: z.string().describe('Objetivo educativo (para detectar off-topic)'),
});

export type CheckerInput = z.infer<typeof CheckerInputSchema>;

/**
 * Schema de Output para Checker - v3.1 (Clasificación + Redirección)
 */
export const CheckerOutputSchema = z.object({
  message_type: z.enum([
    'answer',                   // Respuesta a la pregunta → enviar a Evaluator
    'question_brief',           // Pregunta breve: "¿qué es X?" → enviar a Tutor
    'question_deep',            // Pide profundizar: "explícame más sobre X" → enviar a Tutor
    'no_se',                    // No sabe: "no sé" → scaffold
    'off_topic',                // Fuera de tema educativo → usa redirect_message
  ]).describe('Tipo de mensaje del estudiante'),

  detected_question: z.string().nullable().optional().describe('Si es pregunta, extraer la pregunta específica (para Tutor)'),

  redirect_message: z.string().nullable().optional().describe('Si es off_topic, mensaje pedagógico de redirección al tema'),
});

export type CheckerOutput = z.infer<typeof CheckerOutputSchema>;

// Funciones auxiliares eliminadas - ya no necesarias

/**
 * Agente Checker - v3.0 (Clasificador simple)
 * Solo clasifica el tipo de mensaje, NO evalúa conceptos
 */
export async function runCheckerAgent(input: CheckerInput): Promise<CheckerOutput> {
  const validatedInput = CheckerInputSchema.parse(input);
  const llmClient = getLLMClient();

  const userPrompt = `
Clasifica el tipo de mensaje del estudiante.

**Pregunta formulada al estudiante:**
"${validatedInput.question}"

**Mensaje del estudiante:**
"${validatedInput.student_message}"

**Objetivo educativo (para detectar off-topic):**
"${validatedInput.objective}"

## INSTRUCCIONES:

Clasifica el mensaje en UNA de estas categorías (en orden de prioridad):

### 1. OFF-TOPIC
**SOLO clasifica como off-topic si el mensaje es COMPLETAMENTE ajeno al contexto educativo:**

✅ **SÍ es off-topic:**
- Inapropiado (sexual, ofensivo, insultos)
- Temas no educativos (clima, deportes, entretenimiento, vida personal)
- Preguntas personales al asistente sobre características o vida privada

❌ **NO es off-topic (son preguntas educativas válidas):**
- Preguntas sobre términos, conceptos o metodologías relacionadas con el objetivo educativo
- Preguntas sobre "qué es X" o "cómo se hace Y" donde X o Y están relacionados con el objetivo
- Preguntas sobre procesos, métodos o herramientas del tema del curso

**Regla simple:** Si la pregunta puede responderse en base al objetivo educativo "${validatedInput.objective}", NO es off-topic.

→ **message_type: "off_topic"**
→ **redirect_message**: Genera mensaje pedagógico (2-3 líneas) que:
  1. Reconoce amablemente la inquietud del estudiante
  2. Explica brevemente por qué no está relacionado con el objetivo
  3. Redirige al tema actual con esta pregunta EXACTA: "${validatedInput.question}"

**IMPORTANTE:**
- Usa la pregunta EXACTA: "${validatedInput.question}"
- Usa el objetivo EXACTO: "${validatedInput.objective}"

**Estructura del mensaje:**
"Entiendo [reconocimiento]. Sin embargo, ahora estamos enfocados en ${validatedInput.objective}. Volvamos a la actividad: ${validatedInput.question}"

### 2. NO SÉ (no_se)
Si dice que no sabe, aunque pida explicación después:
- "no sé", "no tengo idea", "no me acuerdo"
- "no lo sé, me explicas"
- "no entiendo nada"

→ **message_type: "no_se"**

### 3. PREGUNTA PROFUNDA (question_deep)
Si pide explicación extensa:
- "explícame más sobre..."
- "dame más detalles de..."
- "profundiza en..."
- "cuáles son todos los..."

→ **message_type: "question_deep"**
→ **detected_question**: Extrae la pregunta específica

### 4. PREGUNTA BREVE (question_brief)
Si hace pregunta simple o pide definición:
- "¿Qué es X?"
- "qué significa..."
- "no comprendo el término X"

→ **message_type: "question_brief"**
→ **detected_question**: Extrae la pregunta específica

### 5. RESPUESTA (answer)
Si parece estar respondiendo la pregunta formulada:
- Cualquier intento de responder
- Aunque esté incompleta o incorrecta

→ **message_type: "answer"**

**IMPORTANTE:**
- NO evalúes si la respuesta es correcta o incorrecta (eso lo hace Evaluator)
- Solo determina SI está intentando responder la pregunta

Retorna la clasificación.
`;

  // Convertir Zod schema a JSON schema para OpenAI
  const jsonSchema = {
    name: 'checker_output',
    strict: true,
    schema: zodToJsonSchema(CheckerOutputSchema, {
      target: 'openAi',
      $refStrategy: 'none',
    }),
  };

  // Llamar a OpenAI con structured output
  const result = await llmClient.chatStructured<CheckerOutput>(
    [
      {
        role: 'system',
        content: buildSystemMessage('checker'),
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    jsonSchema,
    {
      model: 'gpt-4o-mini',
      temperature: 0.2, // Temperatura muy baja para clasificación consistente
    }
  );

  // Validar output con Zod
  const validatedOutput = CheckerOutputSchema.parse(result);

  return validatedOutput;
}