/**
 * Test de Performance v3.6.1
 * Verifica la optimización de llamadas LLM combinadas
 */

import { runEvaluatorAgentWithEmbeddings } from './lib/agents/evaluator.ts';

console.log('🚀 TEST: Performance v3.6.1 - Llamadas LLM Combinadas\n');

// Simular evaluación que necesita hints (encourage/guide)
const testInput = {
  student_answer: 'El peligro es la altura de 5 metros',
  expected_evidences: [
    'Identifica 2 peligros específicos (altura + peso de la caja)',
    'Menciona por qué es peligroso (lesiones, consecuencias)',
  ],
  momento_id: 'M0',
  chat_history: [],
  lesson_context: {
    objetivo: 'Identificar peligros en el trabajo',
    momento: {
      id: 'M0',
      nombre: 'Motivación',
      actividad: 'Contar una situación peligrosa',
    },
  },
  student_profile: {
    nivel_educativo: 'secundaria',
    edad_estimada: 25,
    experiencia_laboral: 'operario',
  },
};

console.log('📊 Input:');
console.log(`   Respuesta: "${testInput.student_answer}"`);
console.log(`   Evidencias esperadas: ${testInput.expected_evidences.length}`);
console.log(`   Evidencia 1: "${testInput.expected_evidences[0]}"`);
console.log(`   Evidencia 2: "${testInput.expected_evidences[1]}"`);
console.log('');

console.log('⏱️  Midiendo tiempo de respuesta...\n');

const startTime = Date.now();

try {
  const result = await runEvaluatorAgentWithEmbeddings(testInput);

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  console.log('\n✅ RESULTADO:');
  console.log(`   Tiempo total: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
  console.log(`   Level: ${result.level}`);
  console.log(`   Action: ${result.action}`);
  console.log(`   Overall Score: ${result.overall_score}/100`);
  console.log('');

  console.log('📝 Feedback generado:');
  console.log(`   "${result.message}"`);
  console.log('');

  if (result.missing_evidence_feedback) {
    console.log('💡 Hints graduales:');
    console.log(`   Evidencia: "${result.missing_evidence_feedback.evidence}"`);
    console.log(`   ✅ Lo bueno: "${result.missing_evidence_feedback.what_is_good}"`);
    console.log(`   ❌ Falta: "${result.missing_evidence_feedback.what_is_missing}"`);
    console.log(`   Hint 1: "${result.missing_evidence_feedback.hint_level_1}"`);
    console.log(`   Hint 2: "${result.missing_evidence_feedback.hint_level_2}"`);
    console.log(`   Hint 3: "${result.missing_evidence_feedback.hint_level_3}"`);
    console.log('');
  }

  console.log('🎯 BENCHMARK:');
  console.log(`   Objetivo: < 2500ms`);
  console.log(`   Actual: ${totalTime}ms`);
  if (totalTime < 2500) {
    console.log(`   ✅ OPTIMIZACIÓN EXITOSA (mejora ~${Math.round((1 - totalTime / 3500) * 100)}% vs ~3500ms)`);
  } else {
    console.log(`   ⚠️  Aún por encima del objetivo`);
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
}

console.log('\n✨ Test completado\n');
