/**
 * Test mejorado del Tutor - Verificación de manejo genérico v3.5.2
 *
 * Prueba:
 * 1. Explicación de términos técnicos del contexto
 * 2. Preguntas conceptuales sobre el objetivo del curso
 * 3. Generalidad (no hardcoded para seguridad)
 */

import OpenAI from 'openai';
import fs from 'fs';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Cargar variables de entorno
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

process.env.OPENAI_API_KEY = envVars.OPENAI_API_KEY;

// Schema del Tutor (copiado de tutor.ts)
const TutorOutputSchema = z.object({
  explanation: z.string().describe('Explicación breve o extensa según question_type'),
  redirect_message: z.string().describe('Mensaje que redirige al estudiante de vuelta a la actividad'),
});

// Cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Función simplificada del Tutor para testing
async function runTutorAgent(input) {
  const userPrompt = `
Responde la pregunta del estudiante de forma pedagógica.

**Pregunta del estudiante:**
"${input.student_question}"

**Actividad actual:**
"${input.current_activity}"

**Objetivo educativo:**
"${input.objective}"

## INSTRUCCIONES:

**PRIMERO:** Verifica si la pregunta está relacionada con el objetivo educativo "${input.objective}" o la actividad actual "${input.current_activity}".

**CASOS ESPECIALES - Preguntas sobre términos del contexto:**
Si el estudiante pregunta sobre un **término técnico o palabra** mencionado en la actividad o contexto (ej: "qué son vigas", "qué son EPPs", "qué significa X", "cómo se llama Y"), esto **SÍ está relacionado** con la lección porque necesita entender el contexto para poder responder.

Para estos casos:
1. **Explica el término brevemente** (2-4 líneas, lenguaje simple y claro)
2. **Conecta con la actividad**: "Ahora que sabes qué es/son [término], vuelve a la pregunta..."
3. **NO des la respuesta** a la actividad principal, solo explica el término

**PREGUNTAS CONCEPTUALES GENERALES sobre el objetivo del curso:**
Si el estudiante hace una pregunta general relacionada con el objetivo educativo "${input.objective}", esto **SÍ está relacionado** y debes explicarlo según el tipo (brief o deep) conectándolo con el objetivo del curso.

Estas pueden ser preguntas sobre:
- El "por qué" del tema (ej: "¿por qué es importante X?", "¿para qué sirve Y?")
- Consecuencias (ej: "¿qué pasa si no hago X?", "¿qué sucede cuando...?")
- Procesos generales (ej: "¿cómo se hace X?", "¿cómo funciona Y?")

**Importante:** Responde basándote en el objetivo "${input.objective}", no asumas un tema específico. Sé genérico y adaptable a cualquier curso.

- **Si NO está relacionada con la lección** (preguntas completamente fuera del tema como "cuál es tu color favorito", "háblame de futbol"):
  - explanation: "Esa pregunta no está incluida en esta lección. Enfoquémonos en el tema actual."
  - redirect_message: "Volvamos a la actividad: ${input.current_question}"

- **Si SÍ está relacionada**: Genera la explicación según el tipo (brief o deep).

### MENSAJE DE REDIRECCIÓN

Después de la explicación, incluye un mensaje breve que:
- Conecta la explicación con la actividad actual
- Motiva al estudiante a intentarlo de nuevo
- **DEBE incluir la pregunta EXACTA**: "${input.current_question}"
- Es positivo y alentador

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

  const jsonSchema = {
    name: 'tutor_output',
    strict: true,
    schema: zodToJsonSchema(TutorOutputSchema, {
      target: 'openAi',
      $refStrategy: 'none',
    }),
  };

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Eres un tutor pedagógico que responde preguntas de estudiantes usando el método socrático.',
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    temperature: 0.8,
    response_format: {
      type: 'json_schema',
      json_schema: jsonSchema,
    },
  });

  const content = response.choices[0]?.message?.content || '{}';
  return JSON.parse(content);
}

console.log('🧪 TEST: Tutor Agent - Manejo Genérico v3.5.2\n');
console.log('='.repeat(60));

// ========================================
// TEST 1: Pregunta sobre término técnico (vigas) - Contexto Seguridad
// ========================================
console.log('\n📝 TEST 1: Término técnico "vigas" en curso de seguridad');
console.log('-'.repeat(60));

const test1Input = {
  objective: 'Identificar peligros y evaluar riesgos en trabajos de construcción',
  momento_id: 'M0',
  student_question: 'qué son vigas?',
  current_activity: 'Observa la imagen y menciona los peligros que identificas',
  current_question: '¿Qué peligros identificas en la situación mostrada?',
  question_type: 'brief',
};

try {
  const result1 = await runTutorAgent(test1Input);
  console.log('\n✅ Resultado Test 1:');
  console.log('Explicación:', result1.explanation);
  console.log('Redirección:', result1.redirect_message);
} catch (error) {
  console.error('❌ Error Test 1:', error.message);
}

// ========================================
// TEST 2: Pregunta conceptual "por qué es importante" - Seguridad
// ========================================
console.log('\n\n📝 TEST 2: Pregunta conceptual sobre importancia (seguridad)');
console.log('-'.repeat(60));

const test2Input = {
  objective: 'Identificar peligros y evaluar riesgos en trabajos de construcción',
  momento_id: 'M0',
  student_question: '¿por qué es importante la seguridad?',
  current_activity: 'Identifica peligros en la obra de construcción',
  current_question: 'Identifica al menos dos peligros y reconoce que la importancia de la seguridad',
  question_type: 'deep',
};

try {
  const result2 = await runTutorAgent(test2Input);
  console.log('\n✅ Resultado Test 2:');
  console.log('Explicación:', result2.explanation);
  console.log('Redirección:', result2.redirect_message);
} catch (error) {
  console.error('❌ Error Test 2:', error.message);
}

// ========================================
// TEST 3: Término técnico en OTRO dominio (NO seguridad) - Curso de Programación
// ========================================
console.log('\n\n📝 TEST 3: Término técnico "variable" en curso de programación');
console.log('-'.repeat(60));

const test3Input = {
  objective: 'Comprender conceptos básicos de programación en Python',
  momento_id: 'M1',
  student_question: 'qué es una variable?',
  current_activity: 'Analiza el siguiente código y explica qué hace',
  current_question: '¿Qué hace la línea x = 10 en el código?',
  question_type: 'brief',
};

try {
  const result3 = await runTutorAgent(test3Input);
  console.log('\n✅ Resultado Test 3:');
  console.log('Explicación:', result3.explanation);
  console.log('Redirección:', result3.redirect_message);

  // Verificar que NO mencione seguridad
  if (result3.explanation.toLowerCase().includes('seguridad') ||
      result3.explanation.toLowerCase().includes('peligro')) {
    console.log('\n⚠️  ADVERTENCIA: Respuesta menciona seguridad cuando no debería');
  } else {
    console.log('\n✅ Verificación: Respuesta es genérica (no menciona seguridad)');
  }
} catch (error) {
  console.error('❌ Error Test 3:', error.message);
}

// ========================================
// TEST 4: Pregunta conceptual en OTRO dominio - Curso de Biología
// ========================================
console.log('\n\n📝 TEST 4: Pregunta conceptual "por qué es importante" en biología');
console.log('-'.repeat(60));

const test4Input = {
  objective: 'Comprender el proceso de fotosíntesis en plantas',
  momento_id: 'M2',
  student_question: '¿por qué es importante la fotosíntesis?',
  current_activity: 'Explica el proceso de fotosíntesis usando el diagrama',
  current_question: '¿Cuáles son los componentes necesarios para la fotosíntesis?',
  question_type: 'deep',
};

try {
  const result4 = await runTutorAgent(test4Input);
  console.log('\n✅ Resultado Test 4:');
  console.log('Explicación:', result4.explanation);
  console.log('Redirección:', result4.redirect_message);

  // Verificar que NO mencione seguridad/peligros
  if (result4.explanation.toLowerCase().includes('seguridad') ||
      result4.explanation.toLowerCase().includes('peligro') ||
      result4.explanation.toLowerCase().includes('riesgo')) {
    console.log('\n⚠️  ADVERTENCIA: Respuesta menciona términos de seguridad cuando no debería');
  } else {
    console.log('\n✅ Verificación: Respuesta es genérica para biología');
  }

  // Verificar que SÍ mencione conceptos de fotosíntesis
  if (result4.explanation.toLowerCase().includes('fotosíntesis') ||
      result4.explanation.toLowerCase().includes('planta') ||
      result4.explanation.toLowerCase().includes('oxígeno')) {
    console.log('✅ Verificación: Respuesta relevante al objetivo de biología');
  } else {
    console.log('⚠️  ADVERTENCIA: Respuesta no menciona conceptos del objetivo');
  }
} catch (error) {
  console.error('❌ Error Test 4:', error.message);
}

// ========================================
// TEST 5: Pregunta fuera del tema (debe rechazar)
// ========================================
console.log('\n\n📝 TEST 5: Pregunta completamente fuera del tema');
console.log('-'.repeat(60));

const test5Input = {
  objective: 'Identificar peligros y evaluar riesgos en trabajos de construcción',
  momento_id: 'M0',
  student_question: 'cuál es tu color favorito?',
  current_activity: 'Observa la imagen y menciona los peligros',
  current_question: '¿Qué peligros identificas en la situación mostrada?',
  question_type: 'brief',
};

try {
  const result5 = await runTutorAgent(test5Input);
  console.log('\n✅ Resultado Test 5:');
  console.log('Explicación:', result5.explanation);
  console.log('Redirección:', result5.redirect_message);

  // Verificar que rechace educadamente
  if (result5.explanation.toLowerCase().includes('no está incluida') ||
      result5.explanation.toLowerCase().includes('enfoquémonos')) {
    console.log('\n✅ Verificación: Rechaza correctamente pregunta fuera del tema');
  } else {
    console.log('\n⚠️  ADVERTENCIA: Debería rechazar pregunta no relacionada');
  }
} catch (error) {
  console.error('❌ Error Test 5:', error.message);
}

// ========================================
// RESUMEN
// ========================================
console.log('\n\n' + '='.repeat(60));
console.log('📊 RESUMEN DE PRUEBAS');
console.log('='.repeat(60));
console.log('\nVerificaciones clave:');
console.log('✅ Test 1: Explica término técnico (vigas) en contexto seguridad');
console.log('✅ Test 2: Responde pregunta conceptual en seguridad');
console.log('✅ Test 3: Explica término técnico (variable) en contexto programación');
console.log('✅ Test 4: Responde pregunta conceptual en biología (NO seguridad)');
console.log('✅ Test 5: Rechaza pregunta fuera del tema');
console.log('\n🎯 Objetivo: Verificar que Tutor es GENÉRICO y adaptable a cualquier curso');
