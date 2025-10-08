/**
 * Agente Evaluator - Motor Pedagógico
 * Sistema SOPHI - v3.0.0 (Arquitectura simplificada)
 *
 * RESPONSABILIDAD: Evaluar respuestas y generar feedback pedagógico
 * - Evalúa respuesta contra evidencias esperadas
 * - Calcula nivel (correct/partial/incorrect)
 * - Genera feedback específico y personalizado
 * - Decide siguiente acción (pista, reformular, elogiar)
 * - Formula nueva pregunta basada en lo que falta
 *
 * Este agente reemplaza la lógica dispersa entre Checker + Tutor feedback
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getLLMClient, mixTextAndImages } from '@/lib/llm';
import { buildSystemMessage } from '@/lib/promptConstants';
import { ImageRef } from '@/types';

/**
 * Schema de Input - v3.0
 */
export const EvaluatorInputSchema = z.object({
  objective: z.string().describe('Objetivo educativo'),
  momento_id: z.string().describe('ID del momento actual (M0, M1, etc.)'),
  question: z.string().describe('Pregunta formulada al estudiante'),
  expected_evidences: z.array(z.string()).min(1).describe('Evidencias esperadas en la respuesta'),
  student_answer: z.string().describe('Respuesta del estudiante'),
  attempt_number: z.number().describe('Número de intento (1, 2, 3...)'),

  // NUEVO v3.2.0: Respuestas esperadas específicas
  expected_answers: z.array(z.string()).optional().describe('Respuestas específicas esperadas basadas en imagen (v3.2)'),

  // Contexto adicional
  chat_history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('Historial reciente (últimos 3-5 mensajes)'),

  images: z.array(z.object({
    url: z.string(),
    descripcion: z.string(),
    tipo: z.enum(['contexto', 'ejemplo', 'evidencia', 'recurso']),
  })).optional().describe('Imágenes de contexto'),

  flexibility_bonus: z.number().optional().describe('Bonus de flexibilidad adaptativa (-20 a +30)'),
});

export type EvaluatorInput = z.infer<typeof EvaluatorInputSchema>;

/**
 * Schema de Output - v3.0
 */
export const EvaluatorOutputSchema = z.object({
  // Evaluación
  level: z.enum(['correct', 'partial', 'incorrect']).describe('Nivel de la respuesta'),
  concepts_identified: z.array(z.string()).describe('Conceptos/evidencias que mencionó correctamente'),
  missing_concepts: z.array(z.string()).describe('Conceptos/evidencias que faltan'),

  // NUEVO: Scores detallados por evidencia
  evidence_scores: z.array(z.object({
    evidence: z.string().describe('Texto de la evidencia evaluada'),
    score: z.number().min(0).max(100).describe('Score de 0-100: cuán bien se cumplió esta evidencia'),
    status: z.enum(['met', 'partial', 'missing']).describe('Estado: met (>80), partial (>60 y <=80), missing (<=60)'),
    reasoning: z.string().describe('Breve explicación de por qué ese score'),
    method: z.enum(['pre-eval', 'embedding', 'llm']).optional().describe('Método usado para calcular score'),
  })).describe('Score detallado por cada evidencia esperada'),

  overall_score: z.number().min(0).max(100).describe('Score general de la respuesta (0-100)'),

  // Feedback pedagógico
  action: z.enum([
    'praise',           // Respuesta correcta → elogiar
    'encourage',        // Respuesta parcial → reconocer lo bueno y motivar
    'guide',            // Respuesta incorrecta → dar orientación
  ]).describe('Tipo de feedback pedagógico'),

  message: z.string().describe('Mensaje de feedback para el estudiante (SIN preguntas - solo reconocimiento/elogio/guía)'),
});

export type EvaluatorOutput = z.infer<typeof EvaluatorOutputSchema>;

/**
 * Normaliza texto para reducir impacto de errores ortográficos en embeddings
 * v3.5.3: Normalización GENÉRICA mejorada (NO hardcoded)
 *
 * Estrategia:
 * 1. Correcciones ortográficas automáticas (errores comunes de escritura)
 * 2. Normalización de formas verbales (conjugaciones)
 * 3. Expansión de relaciones causales (porque → razon, causa)
 *
 * NO incluye vocabulario específico de dominio (seguridad, programación, etc.)
 */
function normalizeTextForEmbedding(text: string): string {
  let normalized = text.toLowerCase().trim();

  // 1. Normalizar espacios múltiples
  normalized = normalized.replace(/\s+/g, ' ');

  // 2. Eliminar puntuación (excepto conectores importantes)
  normalized = normalized.replace(/[.,;!?]+/g, ' ');

  // 3. Normalizar caracteres especiales
  normalized = normalized
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ñ/g, 'n');

  // 4. Corrección ortográfica genérica (errores comunes de escritura rápida)
  normalized = normalized
    .replace(/\baces\b/g, 'haces')
    .replace(/\bq\b/g, 'que')
    .replace(/\btb\b/g, 'tambien')
    .replace(/\bxq\b/g, 'porque')
    .replace(/\bxk\b/g, 'porque')
    .replace(/\bd\b/g, 'de')
    .replace(/\bk\b/g, 'que')
    .replace(/\bn\b/g, 'en');

  // 5. Enriquecer relaciones causales (ayuda a embeddings capturar "razón por la cual")
  // Esto es GENÉRICO: cualquier "porque" implica una razón/causa
  if (normalized.includes('porque')) {
    normalized += ' razon causa motivo';
  }
  if (normalized.includes('ya que')) {
    normalized += ' razon causa motivo';
  }
  if (normalized.includes('debido a')) {
    normalized += ' razon causa motivo';
  }

  // 6. Enriquecer expresiones de consecuencia (genérico)
  if (normalized.includes('puede') || normalized.includes('podria')) {
    normalized += ' consecuencia efecto resultado';
  }
  if (normalized.includes('si ') && (normalized.includes('entonces') || normalized.includes('puedes'))) {
    normalized += ' condicional causa efecto';
  }

  // 7. Normalizar negaciones (importante para semántica)
  normalized = normalized.replace(/\bno\s+/g, 'no_');

  return normalized.trim();
}

/**
 * Obtiene umbrales de score adaptativos según momento pedagógico
 * v3.5.4: THRESHOLD UNIFORME para todos los momentos (45/30)
 *
 * CAMBIO: Mismo threshold en todos los momentos para evitar confusión.
 * El límite de intentos (max 3) ya controla la progresión pedagógica.
 */
function getAdaptiveThresholds(momentId: string): { met: number; partial: number } {
  // THRESHOLD UNIFORME para TODOS los momentos
  // v3.5.9: Sincronizado con Orchestrator (60)
  return {
    met: 60,      // 60+ = evidencia cumplida (alineado con Orchestrator)
    partial: 45   // 45-60 = parcial, <45 = faltante
  };
}

/**
 * Obtiene reglas de flexibilidad según momento pedagógico
 */
function getMomentFlexibilityRules(momentId: string): string {
  const rules: Record<string, string> = {
    M0: `
**M0 (Motivación) - MUY FLEXIBLE:**
- Acepta experiencias personales y observaciones concretas
- Valora identificación específica sobre terminología exacta
- Si menciona al menos 50% de evidencias con sustancia → **partial** (no incorrect)
    `,
    M1: `
**M1 (Activación) - FLEXIBLE:**
- Acepta conocimientos previos aunque no sean exactos
- Valora conexiones con experiencias anteriores
- Errores conceptuales leves son aceptables
    `,
    M2: `
**M2 (Modelado) - MODERADO:**
- Requiere comprensión de conceptos presentados
- Acepta variaciones en expresión si la idea es correcta
    `,
    M3: `
**M3 (Práctica Guiada) - MODERADO-ESTRICTO:**
- Requiere aplicación correcta de conceptos
- Errores procedurales se penalizan más
    `,
    M4: `
**M4 (Práctica Autónoma) - ESTRICTO:**
- Requiere dominio de conceptos y procedimientos
- Errores conceptuales son graves
    `,
    M5: `
**M5 (Evaluación) - MUY ESTRICTO:**
- Requiere respuestas completas y precisas
- Solo "correct" si todos los conceptos están bien explicados
- Errores menores bajan a "partial"
    `,
  };

  return rules[momentId] || rules.M2;
}

/**
 * Calcula similaridad de coseno entre dos vectores
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Calcula score de evidencia usando embeddings (similaridad semántica)
 * Retorna score 0-100 basado en similaridad de coseno
 */
async function calculateEvidenceScoreWithEmbedding(
  evidence: string,
  studentAnswer: string,
  chatHistory?: Array<{ role: string; content: string }>
): Promise<{ score: number; reasoning: string }> {
  const llm = getLLMClient();

  // Combinar respuesta actual con historial del estudiante
  let fullStudentText = studentAnswer;
  if (chatHistory) {
    const userMessages = chatHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ');
    fullStudentText = userMessages + ' ' + studentAnswer;
  }

  // Normalizar texto para reducir impacto de errores ortográficos
  const normalizedEvidence = normalizeTextForEmbedding(evidence);
  const normalizedStudentText = normalizeTextForEmbedding(fullStudentText);

  console.log(`🔧 [NORMALIZATION]`);
  console.log(`   Original: "${fullStudentText.substring(0, 80)}..."`);
  console.log(`   Normalized: "${normalizedStudentText.substring(0, 80)}..."`);

  try {
    // Generar embeddings en paralelo (usando texto normalizado)
    const [evidenceEmbed, answerEmbed] = await Promise.all([
      llm.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: normalizedEvidence,
      }),
      llm.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: normalizedStudentText,
      }),
    ]);

    const vecA = evidenceEmbed.data[0].embedding;
    const vecB = answerEmbed.data[0].embedding;

    // Calcular similaridad de coseno (0 a 1)
    const similarity = cosineSimilarity(vecA, vecB);

    // Convertir a score 0-100
    const score = Math.round(similarity * 100);

    return {
      score,
      reasoning: `Similaridad semántica: ${similarity.toFixed(3)} (${score}/100)`,
    };
  } catch (error) {
    console.error('[EMBEDDING ERROR]', error);
    // Fallback: score bajo si falla
    return {
      score: 50,
      reasoning: 'Error al calcular embedding, usando score por defecto',
    };
  }
}

/**
 * Extrae palabras únicas significativas del texto del estudiante
 * Filtra palabras comunes (stopwords) y muy cortas
 */
function extractUniqueWords(text: string): string[] {
  const stopwords = [
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
    'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
    'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
    'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin',
    'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo',
    'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
    'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella',
    'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa',
    'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte',
    'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar',
    'es', 'son', 'está', 'están', 'fue', 'han', 'hay', 'puede', 'pueden',
    'al', 'del', 'los', 'las', 'una', 'unos', 'unas'
  ];

  const words = text
    .toLowerCase()
    .replace(/[^\wáéíóúñü\s]/g, ' ') // Mantener letras con acentos
    .split(/\s+/)
    .filter(w => w.length >= 3) // Palabras de al menos 3 letras
    .filter(w => !stopwords.includes(w)); // Eliminar stopwords

  // Convertir a array único (compatible con ES target)
  const uniqueSet = new Set(words);
  return Array.from(uniqueSet);
}

/**
 * Pre-evaluación programática GENÉRICA de evidencias cuantitativas
 * Solo evalúa "Identifica al menos X..." contando palabras únicas significativas
 */
function preEvaluateEvidences(
  evidences: string[],
  studentAnswer: string,
  chatHistory?: Array<{ role: string; content: string }>
): {
  identified: string[];
  missing: string[];
  allStudentMentions: string[];
  scores: Array<{ evidence: string; score: number; reasoning: string; method: 'pre-eval'; status: 'met' | 'partial' | 'missing' }>;
} {
  const identified: string[] = [];
  const missing: string[] = [];
  const allStudentMentions: string[] = [];
  const scores: Array<{ evidence: string; score: number; reasoning: string; method: 'pre-eval'; status: 'met' | 'partial' | 'missing' }> = [];

  // Recopilar TODAS las menciones del estudiante en el historial
  if (chatHistory) {
    chatHistory.forEach(msg => {
      if (msg.role === 'user') {
        allStudentMentions.push(msg.content.toLowerCase());
      }
    });
  }
  allStudentMentions.push(studentAnswer.toLowerCase());

  const fullStudentText = allStudentMentions.join(' ');

  // Extraer palabras únicas significativas del texto del estudiante
  const uniqueWords = extractUniqueWords(fullStudentText);

  evidences.forEach(evidence => {
    // SOLO evaluar evidencias cuantitativas: "Identifica al menos X..."
    const quantMatch = evidence.match(/identifica\s+al\s+menos\s+(\d+)\s+(.+)/i);

    if (quantMatch) {
      const requiredCount = parseInt(quantMatch[1]);

      // Contar palabras únicas significativas como proxy de "elementos mencionados"
      const wordCount = uniqueWords.length;

      if (wordCount >= requiredCount) {
        identified.push(evidence);
        scores.push({
          evidence,
          score: 100,
          reasoning: `Pre-evaluación: Identificó ${wordCount} palabras únicas, requería ${requiredCount}`,
          method: 'pre-eval',
          status: 'met',
        });
      } else {
        missing.push(evidence);
        const score = Math.round((wordCount / requiredCount) * 100);
        scores.push({
          evidence,
          score,
          reasoning: `Pre-evaluación: Solo ${wordCount} palabras únicas de ${requiredCount} requeridas`,
          method: 'pre-eval',
          status: score > 60 ? 'partial' : 'missing',
        });
      }

      console.log(`\n🔍 [PRE-EVAL CUANTITATIVA] "${evidence}"`);
      console.log(`   Requeridos: ${requiredCount}, Palabras únicas significativas: ${wordCount}`);
      console.log(`   Ejemplos: ${uniqueWords.slice(0, 10).join(', ')}${uniqueWords.length > 10 ? '...' : ''}`);
      console.log(`   Estado: ${wordCount >= requiredCount ? '✅ CUMPLIDA' : '❌ FALTA'}`);
    } else {
      // Evidencias cualitativas o no cuantitativas → dejar para evaluación con embedding
      console.log(`\n🔍 [PRE-EVAL] "${evidence}" → Dejar para evaluación con embedding (no es cuantitativa)`);
    }
  });

  return { identified, missing, allStudentMentions, scores };
}

/**
 * Agente Evaluator - v3.3.0 (Con Embeddings + Cálculo Matemático)
 *
 * Estrategia híbrida:
 * 1. Pre-eval cuantitativa (para "Identifica al menos X...")
 * 2. Embeddings (para evidencias cualitativas) - SCORE MATEMÁTICO
 * 3. LLM solo para generar message y next_question pedagógicos
 */
export async function runEvaluatorAgentWithEmbeddings(input: EvaluatorInput): Promise<EvaluatorOutput> {
  const validatedInput = EvaluatorInputSchema.parse(input);

  console.log('\n🧠 [EVALUATOR v3.3 - EMBEDDINGS + MATH]');
  console.log(`📋 Total evidencias: ${validatedInput.expected_evidences.length}`);

  // 1️⃣ PRE-EVALUACIÓN CUANTITATIVA
  const preEval = preEvaluateEvidences(
    validatedInput.expected_evidences,
    validatedInput.student_answer,
    validatedInput.chat_history
  );

  console.log('\n✅ [PRE-EVAL] Evidencias cumplidas:', preEval.identified);
  console.log('❌ [PRE-EVAL] Evidencias faltantes:', preEval.missing);
  console.log(`📊 [PRE-EVAL] Scores generados: ${preEval.scores.length}`);

  // 2️⃣ EVALUAR EVIDENCIAS CUALITATIVAS CON EMBEDDINGS
  const qualitativeEvidences = validatedInput.expected_evidences.filter(
    ev => !preEval.identified.includes(ev) && !preEval.missing.includes(ev)
  );

  console.log(`\n🔍 [EMBEDDINGS] Evaluando ${qualitativeEvidences.length} evidencias cualitativas...`);

  // Obtener umbrales adaptativos según momento pedagógico
  const thresholds = getAdaptiveThresholds(validatedInput.momento_id);
  console.log(`📊 [THRESHOLDS] Momento ${validatedInput.momento_id}: met>${thresholds.met}, partial>${thresholds.partial}`);

  const embeddingScores = await Promise.all(
    qualitativeEvidences.map(async (evidence) => {
      const result = await calculateEvidenceScoreWithEmbedding(
        evidence,
        validatedInput.student_answer,
        validatedInput.chat_history
      );

      // Usar umbrales adaptativos
      const status = result.score > thresholds.met ? 'met' as const
        : result.score > thresholds.partial ? 'partial' as const
        : 'missing' as const;

      return {
        evidence,
        score: result.score,
        reasoning: result.reasoning,
        method: 'embedding' as const,
        status,
      };
    })
  );

  // 3️⃣ COMBINAR TODOS LOS SCORES
  const allScores = [...preEval.scores, ...embeddingScores];

  console.log('\n📊 [SCORES FINALES]');
  allScores.forEach(s => {
    const icon = s.score > 80 ? '✅' : s.score > 60 ? '⚠️' : '❌';
    console.log(`  ${icon} [${s.score}/100] ${s.evidence} (${s.method})`);
    console.log(`     → ${s.reasoning}`);
  });

  // 4️⃣ CALCULAR OVERALL SCORE (PROMEDIO MATEMÁTICO)
  const overall_score = Math.round(
    allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length
  );

  console.log(`\n🎯 Overall Score (calculado): ${overall_score}/100`);

  // 5️⃣ CLASIFICAR EVIDENCIAS SEGÚN UMBRALES (usando thresholds adaptativos)
  const concepts_identified: string[] = [];
  const missing_concepts: string[] = [];

  allScores.forEach(s => {
    if (s.score > thresholds.met) {
      concepts_identified.push(s.evidence);
    } else {
      missing_concepts.push(s.evidence);
    }
  });

  console.log(`✅ Conceptos identificados (score >${thresholds.met}): ${concepts_identified.length}`);
  console.log(`❌ Conceptos faltantes (score <=${thresholds.met}): ${missing_concepts.length}`);

  // 6️⃣ DETERMINAR LEVEL BASADO EN CUÁNTAS EVIDENCIAS CUMPLIÓ
  const totalEvidences = validatedInput.expected_evidences.length;
  let level: 'correct' | 'partial' | 'incorrect';

  if (concepts_identified.length === totalEvidences) {
    level = 'correct';
  } else if (concepts_identified.length > 0) {
    level = 'partial';
  } else {
    level = 'incorrect';
  }

  console.log(`📈 Level (calculado): ${level}`);

  // 7️⃣ DETERMINAR ACCIÓN PEDAGÓGICA
  let action: 'praise' | 'encourage' | 'guide';

  if (level === 'correct') {
    action = 'praise';
  } else if (level === 'partial') {
    action = 'encourage';
  } else {
    action = 'guide';
  }

  console.log(`🎬 Action (calculado): ${action}`);

  // 8️⃣ GENERAR SOLO FEEDBACK (NO PREGUNTAS - eso lo hace Orchestrator)
  const llm = getLLMClient();

  // Incluir historial de respuestas del estudiante para contexto completo
  const allStudentResponses = validatedInput.chat_history
    ?.filter(msg => msg.role === 'user')
    .map(msg => msg.content)
    .join(' ') || '';
  const fullStudentContext = allStudentResponses + ' ' + validatedInput.student_answer;

  const feedbackPrompt = `
Eres un tutor pedagógico. Genera SOLO feedback de reconocimiento (SIN preguntas).

**Contexto:**
- Respuestas del estudiante (acumuladas): "${fullStudentContext.substring(0, 500)}"
- Nivel: ${level}
- Acción: ${action}

**Evidencias cumplidas (score >80):**
${concepts_identified.map(ev => `✅ ${ev}`).join('\n') || 'Ninguna'}

**Evidencias faltantes (score <=80):**
${missing_concepts.map(ev => `❌ ${ev}`).join('\n') || 'Ninguna'}

**Tu tarea:**

${action === 'praise' ? `
Genera un ELOGIO específico y breve (1-2 oraciones):
- Reconoce exactamente qué hizo bien (menciona los elementos específicos de su respuesta)
- Usa palabras positivas
` : ''}

${action === 'encourage' ? `
Genera RECONOCIMIENTO de lo bueno + motivación breve (2-3 oraciones):
- Reconoce TODOS los elementos específicos que SÍ mencionó en su respuesta completa
- Si identificó múltiples elementos, menciónalos TODOS (no solo uno)
- Motiva a continuar
- NO menciones lo que falta
- TERMINA CON PUNTO, NO con pregunta
` : ''}

${action === 'guide' ? `
Genera ORIENTACIÓN breve (1-2 oraciones):
- Reconoce el esfuerzo
- Da una pista suave que ayude a reflexionar
` : ''}

**IMPORTANTE:**
- NO generes preguntas
- Solo feedback de 1-2 oraciones
- Termina con punto (.), NO con pregunta (?)

Responde en JSON:
{
  "message": "Tu feedback aquí (sin preguntas)"
}
`;

  const feedbackSchema = z.object({
    message: z.string(),
  });

  const feedbackJsonSchema = {
    name: 'feedback_output',
    schema: zodToJsonSchema(feedbackSchema, { target: 'openAi' }),
    strict: true,
  };

  const feedbackResult = await llm.chatStructured(
    [
      { role: 'system', content: buildSystemMessage('evaluator') },
      { role: 'user', content: feedbackPrompt },
    ],
    feedbackJsonSchema,
    { model: 'gpt-4o-mini', temperature: 0.7 }
  );

  const feedback = feedbackSchema.parse(feedbackResult);

  // 9️⃣ RETORNAR OUTPUT COMPLETO
  const output: EvaluatorOutput = {
    level,
    concepts_identified,
    missing_concepts,
    evidence_scores: allScores,
    overall_score,
    action,
    message: feedback.message,
  };

  console.log('\n✅ [EVALUATOR OUTPUT]');
  console.log('📈 Level:', output.level);
  console.log('📊 Overall Score:', output.overall_score + '/100');
  console.log('🎬 Action:', output.action);

  return output;
}

/**
 * Agente Evaluator - v3.0 (Motor pedagógico completo) - LEGACY CON LLM
 * Mantener para compatibilidad, pero usar runEvaluatorAgentWithEmbeddings() para nueva implementación
 */
export async function runEvaluatorAgent(input: EvaluatorInput): Promise<EvaluatorOutput> {
  const validatedInput = EvaluatorInputSchema.parse(input);
  const llmClient = getLLMClient();

  const totalEvidences = validatedInput.expected_evidences.length;
  const threshold50 = Math.ceil(totalEvidences / 2);

  // PRE-EVALUACIÓN: Revisar TODAS las evidencias programáticamente
  const preEval = preEvaluateEvidences(
    validatedInput.expected_evidences,
    validatedInput.student_answer,
    validatedInput.chat_history
  );

  console.log('\n🔬 [PRE-EVALUACIÓN PROGRAMÁTICA COMPLETA]');
  console.log('✅ Evidencias ya identificadas:', preEval.identified);
  console.log('❌ Evidencias aún faltantes:', preEval.missing);

  // Separar evidencias que quedaron sin evaluar (para LLM)
  const unevaluatedEvidences = validatedInput.expected_evidences.filter(
    ev => !preEval.identified.includes(ev) && !preEval.missing.includes(ev)
  );

  console.log('🔍 Evidencias no evaluadas (para LLM):', unevaluatedEvidences);

  const userPrompt = `
Evalúa la respuesta del estudiante y genera feedback pedagógico completo.

**Pregunta formulada:**
"${validatedInput.question}"

**Evidencias esperadas TOTALES (${totalEvidences}):**
${validatedInput.expected_evidences.map((ev, i) => `${i + 1}. ${ev}`).join('\n')}

## ✅ PRE-EVALUACIÓN PROGRAMÁTICA (ya verificada):

**Evidencias YA CUMPLIDAS (${preEval.identified.length}):**
${preEval.identified.map(ev => `✅ ${ev}`).join('\n') || 'Ninguna'}

**Evidencias AÚN FALTANTES (${preEval.missing.length}):**
${preEval.missing.map(ev => `❌ ${ev}`).join('\n') || 'Ninguna'}

## 🔍 TU TAREA: Evaluar evidencias NO EVALUADAS (${unevaluatedEvidences.length}):

${unevaluatedEvidences.length > 0 ? `
**Evidencias pendientes a evaluar:**
${unevaluatedEvidences.map((ev, i) => `${i + 1}. ${ev}`).join('\n')}

**IMPORTANTE:** Usa evaluación CONCEPTUAL (no literal) para estas evidencias.
` : '**Todas las evidencias ya fueron pre-evaluadas programáticamente.**'}

${validatedInput.expected_answers && validatedInput.expected_answers.length > 0 ? `
**Respuestas específicas esperadas (basadas en imagen - v3.2):**
${validatedInput.expected_answers.map((ans, i) => `${i + 1}. ${ans}`).join('\n')}

**IMPORTANTE:** Usa estas respuestas específicas para:
- Comparar con la respuesta del estudiante (aunque use otras palabras)
- Identificar qué respuestas mencionó y cuáles faltan
- Generar preguntas guía hacia respuestas faltantes específicas
` : ''}

**Respuesta del estudiante:**
"${validatedInput.student_answer}"

**Intento #${validatedInput.attempt_number}**

${validatedInput.chat_history && validatedInput.chat_history.length > 0 ? `
**Contexto de conversación reciente:**
${validatedInput.chat_history.slice(-3).map(msg => `${msg.role === 'assistant' ? 'Tutor' : 'Estudiante'}: "${msg.content}"`).join('\n')}
` : ''}

## PASO 1: EVALUAR LA RESPUESTA

**IMPORTANTE:** La mayoría de las evidencias YA FUERON PRE-EVALUADAS programáticamente.

**Tu tarea:** Evaluar solo las evidencias NO EVALUADAS (${unevaluatedEvidences.length}) usando evaluación conceptual.

**Cálculo del nivel final:**

Ya cumplidas (pre-eval): ${preEval.identified.length}/${totalEvidences}
Aún faltantes (pre-eval): ${preEval.missing.length}/${totalEvidences}
Falta evaluar (tú): ${unevaluatedEvidences.length}/${totalEvidences}

**REGLAS:**
- Si pre-eval + evidencias cumplidas por ti = ${totalEvidences} → **correct**
- Si pre-eval + evidencias cumplidas por ti ≥ ${threshold50} → **partial**
- Si pre-eval + evidencias cumplidas por ti < ${threshold50} → **incorrect**

**Evidencias ya cumplidas que DEBES incluir en concepts_identified:**
${preEval.identified.map(ev => `- "${ev}"`).join('\n') || '(ninguna aún)'}

${unevaluatedEvidences.length > 0 ? `
**Evidencias que debes evaluar tú:**
${unevaluatedEvidences.map(ev => `- "${ev}"`).join('\n')}
` : ''}

## 📊 RÚBRICA DE EVALUACIÓN CONCEPTUAL

**Evalúa cada evidencia pendiente usando esta rúbrica:**

${unevaluatedEvidences.map((ev, idx) => `
**Evidencia ${idx + 1}: "${ev}"**
`).join('\n')}

**CRITERIOS DE EVALUACIÓN:**

✅ **CORRECTA** - La evidencia se cumple si:
- El estudiante transmite la IDEA CENTRAL, aunque use palabras diferentes
- Si la evidencia pide "reconoce que X" y el estudiante menciona CONSECUENCIAS graves → ✅ CORRECTA
- Si la evidencia pide "identificar X cosas" y el estudiante las menciona con sinónimos → ✅ CORRECTA
- Acepta: sinónimos, paráfrasis, ejemplos concretos, consecuencias relacionadas
- Acepta: errores ortográficos o gramaticales
- Acepta: expresiones informales equivalentes

⚠️ **PARCIAL** - La evidencia está incompleta si:
- Menciona el tema pero de forma MUY vaga sin identificar la idea central
- Se nota que entendió algo pero la respuesta es ambigua o confusa

❌ **INCORRECTA** - La evidencia NO se cumple si:
- El estudiante NO menciona nada relacionado con la evidencia
- Dice algo que contradice directamente la evidencia
- Dice "no sé", "no tengo idea", "no entiendo"
- Respuesta en blanco o completamente fuera de tema

${getMomentFlexibilityRules(validatedInput.momento_id)}

${validatedInput.flexibility_bonus ? `
**AJUSTE PERSONALIZADO (Bonus: ${validatedInput.flexibility_bonus > 0 ? '+' : ''}${validatedInput.flexibility_bonus}):**
${validatedInput.flexibility_bonus > 20 ? `- Este estudiante NECESITA MÁS APOYO → Ser MUY FLEXIBLE:
  - Si menciona al menos 1 evidencia relacionada → "partial" (no "incorrect")
  - Valorar el esfuerzo sobre la precisión` : ''}
${validatedInput.flexibility_bonus > 0 && validatedInput.flexibility_bonus <= 20 ? `- Este estudiante necesita apoyo → Ser MÁS FLEXIBLE:
  - Dar beneficio de la duda en casos límite
  - Valorar comprensión práctica sobre terminología exacta` : ''}
${validatedInput.flexibility_bonus < 0 ? `- Este estudiante muestra buen dominio → Ser MÁS EXIGENTE:
  - Requerir mayor precisión
  - "partial" en lugar de "correct" si falta profundidad` : ''}
` : ''}

**OUTPUT que debes generar:**

## 1️⃣ evidence_scores (OBLIGATORIO para TODAS las evidencias):

**IMPORTANTE:** Debes generar un score para CADA UNA de estas ${validatedInput.expected_evidences.length} evidencias:
${validatedInput.expected_evidences.map((ev, idx) => `${idx + 1}. "${ev}"`).join('\n')}

**Instrucciones:**
- Si una evidencia fue marcada como cumplida por pre-eval (${JSON.stringify(preEval.identified)}), asígnale score 100
- Para las demás evidencias (${JSON.stringify(unevaluatedEvidences)}), evalúa conceptualmente y asigna score 0-100

Evalúa CADA evidencia y asigna un score de 0-100:

**Escala de Scores:**
- **100**: Respuesta perfecta, menciona la evidencia claramente
- **90**: Muy buena, usa sinónimos o paráfrasis equivalentes
- **80**: Buena, menciona la idea central con palabras propias
- **70**: Aceptable, menciona consecuencias o ejemplos relacionados
- **60**: Parcial, idea vaga pero relacionada
- **50**: Muy parcial, apenas menciona algo relacionado
- **30**: Incompleta, solo menciona tangencialmente
- **10**: Muy lejos, respuesta no relacionada
- **0**: No menciona nada o contradice la evidencia

**Guía de scoring:**
- Score alto (80-100): Menciona claramente la idea central con vocabulario preciso o equivalente
- Score medio (60-79): Menciona la idea de forma vaga pero relacionada
- Score bajo (0-59): No menciona la evidencia o está fuera de tema

**Status según score:**
- **met**: score > 80 (evidencia cumplida - MÁS de 80, no exacto)
- **partial**: score > 60 y <= 80 (evidencia incompleta)
- **missing**: score <= 60 (evidencia no cumplida)

## 2️⃣ overall_score:

Promedio de todos los evidence_scores.

## 3️⃣ concepts_identified / missing_concepts:

**concepts_identified**: Array combinando:
1. **OBLIGATORIO:** DEBES incluir TODAS estas evidencias ya cumplidas (pre-eval): ${JSON.stringify(preEval.identified)}
2. Agrega las evidencias con score > 80 (status: "met")

**missing_concepts**: Array combinando:
1. **OBLIGATORIO:** DEBES incluir TODAS estas evidencias faltantes (pre-eval): ${JSON.stringify(preEval.missing)}
2. Agrega las evidencias con score <= 80 (status: "partial" o "missing")

**IMPORTANTE:**
- NO inventes conceptos nuevos que no estén en las evidencias esperadas
- En concepts_identified: incluye el texto EXACTO de la evidencia cumplida
- Para missing_concepts, usa el texto EXACTO de la evidencia esperada

**Para generar next_question cuando action = "feedback":**
1. Mira missing_concepts - esas son las evidencias que AÚN faltan
2. Toma la PRIMERA evidencia de missing_concepts
3. Convierte esa evidencia en una pregunta directa que guíe al estudiante hacia esa evidencia específica

## PASO 2: DECIDIR ACCIÓN PEDAGÓGICA

Según el nivel y el intento:

### Si level = "correct":
→ **action: "praise"**
→ **message**: Elogio específico usando Teach Like a Champion:
  - Reconoce EXACTAMENTE qué hizo bien (usa sus palabras del historial)
  - Menciona los elementos específicos que identificó
  - Usa palabras positivas y motivadoras
  - Si cumplió evidencia cuantitativa, menciónala con el número exacto

### Si level = "partial":
→ **action: "feedback"**

→ **message**: SOLO reconocimiento - TERMINA CON PUNTO (.), NO con pregunta (?):

Reconoce LO QUE SÍ MENCIONÓ usando sus palabras exactas.

✅ CORRECTO (termina con punto):
- Reconoce los elementos específicos que mencionó
- Usa lenguaje positivo y motivador
- Termina con punto (.)

❌ INCORRECTO (tiene pregunta):
- No incluir preguntas en el mensaje
- No terminar con signos de interrogación (?)

⚠️ **REGLA ESTRICTA:**
- message debe ser MÁXIMO 2 líneas
- message debe terminar con PUNTO (.)
- message NO debe contener signos de interrogación (?)

→ **next_question**: La pregunta guía va AQUÍ (separada):

**CRÍTICO:** La pregunta debe ser ESPECÍFICA y DIRIGIDA a la evidencia faltante exacta.

**Cómo generar la pregunta:**
1. Identifica QUÉ evidencia específica falta
2. Genera una pregunta que GUÍE al estudiante a expresar ESA evidencia

**Reglas para generar buenas preguntas:**
✅ BUENA pregunta: Pregunta directa que apunta específicamente a la evidencia faltante
✅ BUENA pregunta: Usa términos de la evidencia esperada reformulados como interrogación
❌ MALA pregunta: Pregunta genérica que no guía hacia la evidencia específica
❌ MALA pregunta: "¿Qué más?" o "¿Qué observas?" sin contexto

**REGLA:** Reformula la evidencia faltante como pregunta directa.

### Si level = "incorrect" y attempt = 1 o 2:
→ **action: "hint"**
→ **message**: Pista específica y graduada que reconozca lo ya identificado

**IMPORTANTE para "no sé":**
Si el estudiante dice "no sé" pero YA identificó conceptos antes:
- Reconoce lo que ya mencionó antes
- Da una pista específica hacia lo que falta
- Motiva a continuar

**Intento 1** (pista sutil):
"Ya mencionaste [conceptos previos]. Ahora observa con más atención [aspecto específico]. ¿Qué notas?"

**Intento 2** (pista más directa):
"Has identificado [conceptos previos], lo cual es correcto. Fíjate en [detalle específico]. Recuerda que buscamos [objetivo específico]."

### Si level = "incorrect" y attempt >= 3:
→ **action: "reformulate"**
→ **message**: Reformula la pregunta de forma más simple y directa
→ **next_question**: Nueva pregunta más guiada basada en la evidencia faltante

## PASO 3: GENERAR OUTPUT

Retorna:
- level
- concepts_identified (palabras exactas del estudiante)
- missing_concepts
- action
- message (completo, listo para mostrar)
- next_question (si action = feedback o reformulate)

**RECUERDA:**
- USA las PALABRAS EXACTAS del estudiante en concepts_identified
- USA términos ESPECÍFICOS de la lección (NO uses [PROCESS], [ELEMENT], [CONCEPT])
- SIEMPRE incluye pregunta guía si action = feedback
- Sé ESPECÍFICO, no genérico
`;

  // Preparar contenido del mensaje (texto + imágenes si hay)
  const messageContent = validatedInput.images && validatedInput.images.length > 0
    ? mixTextAndImages(userPrompt, validatedInput.images as ImageRef[])
    : userPrompt;

  // Convertir Zod schema a JSON schema para OpenAI
  const jsonSchema = {
    name: 'evaluator_output',
    strict: true,
    schema: zodToJsonSchema(EvaluatorOutputSchema, {
      target: 'openAi',
      $refStrategy: 'none',
    }),
  };

  // DEBUG: Log input al Evaluator
  console.log('\n📊 [EVALUATOR INPUT]');
  console.log('🎯 Momento:', validatedInput.momento_id);
  console.log('❓ Pregunta:', validatedInput.question);
  console.log('📋 Evidencias esperadas:', validatedInput.expected_evidences);
  console.log('💬 Respuesta estudiante:', validatedInput.student_answer);
  console.log('📚 Historial recibido:', validatedInput.chat_history?.length || 0, 'mensajes');
  if (validatedInput.chat_history && validatedInput.chat_history.length > 0) {
    console.log('📝 Mensajes del historial:');
    validatedInput.chat_history.forEach((msg, idx) => {
      console.log(`  ${idx}: [${msg.role}]: "${msg.content.substring(0, 60)}..."`);
    });
  }

  // Llamar a OpenAI con structured output
  const result = await llmClient.chatStructured<EvaluatorOutput>(
    [
      {
        role: 'system',
        content: buildSystemMessage('evaluator'),
      },
      {
        role: 'user',
        content: messageContent,
      },
    ],
    jsonSchema,
    {
      model: 'gpt-4o-mini',
      temperature: 0.7, // Temperatura moderada para feedback natural pero consistente
    }
  );

  // Validar output con Zod
  const validatedOutput = EvaluatorOutputSchema.parse(result);

  // DEBUG: Log output del Evaluator
  console.log('\n✅ [EVALUATOR OUTPUT]');
  console.log('📈 Level:', validatedOutput.level);
  console.log('📊 Overall Score:', validatedOutput.overall_score + '/100');
  console.log('🎬 Action:', validatedOutput.action);

  // Mostrar scores detallados por evidencia
  console.log('\n📋 Scores por Evidencia:');
  validatedOutput.evidence_scores.forEach((ev, idx) => {
    const icon = ev.status === 'met' ? '✅' : ev.status === 'partial' ? '⚠️' : '❌';
    const method = ev.method ? ` [${ev.method}]` : '';
    console.log(`  ${icon} [${ev.score}/100]${method} ${ev.evidence}`);
    console.log(`     → ${ev.reasoning}`);
  });

  console.log('\n✔️ Conceptos identificados:', validatedOutput.concepts_identified);
  console.log('❌ Conceptos faltantes:', validatedOutput.missing_concepts);
  console.log('💬 Mensaje:', validatedOutput.message.substring(0, 100) + '...');

  return validatedOutput;
}
