/**
 * Agente Tutor - Explicador de Conceptos
 * Sistema SOPHI - v3.0.0 (Arquitectura simplificada)
 *
 * RESPONSABILIDAD: Responder preguntas generales del estudiante
 * - Cuando estudiante pregunta: "¿qué es X?"
 * - Explicaciones breves sin revelar respuestas
 * - Redirige al estudiante de vuelta a la actividad
 *
 * NO evalúa respuestas (eso lo hace Evaluator)
 * NO genera feedback pedagógico (eso lo hace Evaluator)
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getLLMClient, mixTextAndImages } from '@/lib/llm';
import { buildSystemMessage } from '@/lib/promptConstants';
import { ImageRef } from '@/types';

/**
 * Schema de Input para Tutor - v3.0
 */
export const TutorInputSchema = z.object({
  objective: z.string().describe('Objetivo educativo de la lección'),
  momento_id: z.string().describe('ID del momento actual: M0, M1, etc.'),
  student_question: z.string().describe('Pregunta del estudiante'),
  current_activity: z.string().describe('Actividad actual en la que está trabajando'),
  current_question: z.string().describe('Pregunta actual que debe responder el estudiante'),

  question_type: z.enum(['brief', 'deep']).describe('Tipo de pregunta: brief (definición simple) o deep (explicación extensa)'),

  chat_history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('Historial reciente de conversación'),

  images: z.array(z.object({
    url: z.string(),
    descripcion: z.string(),
    tipo: z.enum(['contexto', 'ejemplo', 'evidencia', 'recurso']),
  })).optional().describe('Imágenes de contexto'),
});

export type TutorInput = z.infer<typeof TutorInputSchema>;

/**
 * Schema de Output para Tutor - v3.0
 */
export const TutorOutputSchema = z.object({
  explanation: z.string().describe('Explicación breve o extensa según question_type'),
  redirect_message: z.string().describe('Mensaje que redirige al estudiante de vuelta a la actividad'),
});

export type TutorOutput = z.infer<typeof TutorOutputSchema>;

/**
 * Agente Tutor - v3.0 (Solo explicaciones)
 */
export async function runTutorAgent(input: TutorInput): Promise<TutorOutput> {
  const validatedInput = TutorInputSchema.parse(input);
  const llmClient = getLLMClient();

  const userPrompt = `
Responde la pregunta del estudiante de forma pedagógica.

**Pregunta del estudiante:**
"${validatedInput.student_question}"

**Actividad actual:**
"${validatedInput.current_activity}"

**Objetivo educativo:**
"${validatedInput.objective}"

${validatedInput.chat_history && validatedInput.chat_history.length > 0 ? `
**Contexto de conversación:**
${validatedInput.chat_history.slice(-3).map(msg => `${msg.role === 'assistant' ? 'Tutor' : 'Estudiante'}: "${msg.content}"`).join('\n')}
` : ''}

## INSTRUCCIONES:

**PRIMERO:** Verifica si la pregunta está relacionada con el objetivo educativo "${validatedInput.objective}" o la actividad actual "${validatedInput.current_activity}".

**CASOS ESPECIALES - Preguntas sobre términos del contexto:**
Si el estudiante pregunta sobre un **término técnico o palabra** mencionado en la actividad o contexto (ej: "qué son vigas", "qué son EPPs", "qué significa X", "cómo se llama Y"), esto **SÍ está relacionado** con la lección porque necesita entender el contexto para poder responder.

Para estos casos:
1. **Explica el término brevemente** (2-4 líneas, lenguaje simple y claro)
2. **Conecta con la actividad**: "Ahora que sabes qué es/son [término], vuelve a la pregunta..."
3. **NO des la respuesta** a la actividad principal, solo explica el término

Ejemplo:
- Pregunta estudiante: "qué son vigas?"
- explanation: "Las vigas son estructuras largas y pesadas de metal o madera que se usan para sostener edificios y techos. En construcción, pueden pesar cientos de kilos y son peligrosas si se manejan sin el equipo de protección adecuado."
- redirect_message: "Ahora que sabes qué son las vigas, ¿qué peligros identificas en la situación cuando los trabajadores las levantan sin protección?"

Otro ejemplo:
- Pregunta estudiante: "que son epps?"
- explanation: "Los EPPs son Equipos de Protección Personal: cascos, guantes, lentes de seguridad, arneses, botas con punta de acero, etc. Son elementos que usa el trabajador para protegerse de peligros como golpes, caídas, cortes o exposición a sustancias peligrosas."
- redirect_message: "Ahora que sabes qué son los EPPs, vuelve a la pregunta: ${validatedInput.current_question}"

**PREGUNTAS CONCEPTUALES GENERALES sobre el objetivo del curso:**
Si el estudiante hace una pregunta general relacionada con el objetivo educativo "${validatedInput.objective}", esto **SÍ está relacionado** y debes explicarlo según el tipo (brief o deep) conectándolo con el objetivo del curso.

Estas pueden ser preguntas sobre:
- El "por qué" del tema (ej: "¿por qué es importante X?", "¿para qué sirve Y?")
- Consecuencias (ej: "¿qué pasa si no hago X?", "¿qué sucede cuando...?")
- Procesos generales (ej: "¿cómo se hace X?", "¿cómo funciona Y?")

**Importante:** Responde basándote en el objetivo "${validatedInput.objective}", no asumas un tema específico. Sé genérico y adaptable a cualquier curso.

- **Si NO está relacionada con la lección** (preguntas completamente fuera del tema como "cuál es tu color favorito", "háblame de futbol"):
  - explanation: "Esa pregunta no está incluida en esta lección. Enfoquémonos en el tema actual."
  - redirect_message: "Volvamos a la actividad: ${validatedInput.current_question}"

- **Si SÍ está relacionada (pregunta conceptual sobre el tema)**: Genera la explicación según el tipo:

${validatedInput.question_type === 'brief' ? `
### EXPLICACIÓN BREVE (4-6 líneas)

Genera una explicación corta y clara que:
1. Define el concepto con palabras simples
2. Da un ejemplo concreto
3. **NO revela la respuesta completa** a la actividad
4. Deja espacio para que el estudiante piense

Ejemplo:
"Un peligro es algo que puede causar daño a las personas. Por ejemplo, una escalera en mal estado o trabajar en altura sin protección. Ahora que sabes esto, vuelve a mirar la imagen de la actividad..."

` : `
### EXPLICACIÓN EXTENSA (8-12 líneas)

Genera una explicación más detallada que:
1. Define el concepto con precisión
2. Explica sus componentes o características principales
3. Da 2-3 ejemplos concretos
4. Relaciona con el objetivo educativo
5. **NO revela la respuesta completa** a la actividad
6. Guía al estudiante a aplicar lo aprendido

Ejemplo:
"El IPERC (Identificación de Peligros, Evaluación y Control de Riesgos) es un proceso de 3 pasos:

1. **Identificar peligros**: Buscar cosas que pueden causar daño (altura, máquinas, químicos)
2. **Evaluar el riesgo**: Determinar qué tan grave es el peligro (probabilidad × severidad)
3. **Controlar**: Poner medidas de seguridad (eliminar peligro, protección, capacitación)

Por ejemplo, si ves a alguien trabajando en altura sin arnés:
- Peligro: La altura
- Riesgo: Alto (puede caerse y morir)
- Control: Usar arnés + línea de vida + capacitación

Ahora que comprendes el proceso, vuelve a la actividad y aplica estos pasos..."
`}

### MENSAJE DE REDIRECCIÓN

Después de la explicación, incluye un mensaje breve que:
- Conecta la explicación con la actividad actual
- Motiva al estudiante a intentarlo de nuevo
- **DEBE incluir la pregunta EXACTA**: "${validatedInput.current_question}"
- Es positivo y alentador

Ejemplos:
- "Ahora que comprendes esto, intenta de nuevo: ${validatedInput.current_question}"
- "Con esta información, ${validatedInput.current_question}"
- "Aplica lo que acabas de aprender. ${validatedInput.current_question}"

## OUTPUT:

Genera:
- **explanation**: La explicación completa (breve o extensa según tipo)
- **redirect_message**: El mensaje de redirección a la actividad

**IMPORTANTE:**
- NO uses variables genéricas ([PROCESS], [ELEMENT])
- USA términos ESPECÍFICOS de la lección
- NO des la respuesta directa a la actividad
- Mantén tono motivador y positivo
`;

  // Preparar contenido del mensaje (texto + imágenes si hay)
  const messageContent = validatedInput.images && validatedInput.images.length > 0
    ? mixTextAndImages(userPrompt, validatedInput.images as ImageRef[])
    : userPrompt;

  // Convertir Zod schema a JSON schema para OpenAI
  const jsonSchema = {
    name: 'tutor_output',
    strict: true,
    schema: zodToJsonSchema(TutorOutputSchema, {
      target: 'openAi',
      $refStrategy: 'none',
    }),
  };

  // Llamar a OpenAI con structured output
  const result = await llmClient.chatStructured<TutorOutput>(
    [
      {
        role: 'system',
        content: buildSystemMessage('tutor'),
      },
      {
        role: 'user',
        content: messageContent,
      },
    ],
    jsonSchema,
    {
      model: 'gpt-4o-mini',
      temperature: 0.8, // Temperatura alta para explicaciones naturales y variadas
    }
  );

  // Validar output con Zod
  const validatedOutput = TutorOutputSchema.parse(result);

  return validatedOutput;
}
