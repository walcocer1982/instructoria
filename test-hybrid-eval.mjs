/**
 * Test Hybrid Evaluator - Programmatic + LLM evaluation
 */

import { runEvaluatorAgent } from './lib/agents/evaluator.js';

// Test case: M0 con 2 evidencias
const testInput = {
  objective: 'Aprender a identificar peligros en el trabajo y evaluar riesgos',
  momento_id: 'M0',
  question: '¿Qué peligros identificas en esta situación y por qué es peligroso trabajar en altura sin protección?',
  expected_evidences: [
    'Identifica al menos 2 peligros en la imagen',
    'Reconoce que trabajar en altura sin protección es muy peligroso'
  ],
  student_answer: 'el sudor, puede resbalarse la caja',
  attempt_number: 3,
  chat_history: [
    {
      role: 'user',
      content: 'la altura y la actitud del trabajador'
    },
    {
      role: 'assistant',
      content: '¡Bien! Identificaste la altura como peligro. Ahora, observando la imagen, ¿por qué es peligroso?'
    },
    {
      role: 'user',
      content: 'es muy peligro trabajar sin linea de vida se puede caer'
    },
    {
      role: 'assistant',
      content: '¡Excelente! Reconociste el peligro de caída. ¿Qué otros peligros ves en la imagen?'
    },
    {
      role: 'user',
      content: 'el sudor, puede resbalarse la caja'
    }
  ]
};

console.log('\n🧪 TEST: Hybrid Evaluator (Programmatic + LLM)\n');
console.log('📋 Evidencias esperadas:');
testInput.expected_evidences.forEach((ev, i) => console.log(`  ${i + 1}. ${ev}`));
console.log('\n💬 Respuestas del estudiante (3 intentos):');
console.log('  1. "la altura y la actitud del trabajador"');
console.log('  2. "es muy peligro trabajar sin linea de vida se puede caer"');
console.log('  3. "el sudor, puede resbalarse la caja"');
console.log('\n⏳ Evaluando...\n');

const result = await runEvaluatorAgent(testInput);

console.log('\n✅ RESULTADO DEL EVALUATOR:\n');
console.log('📊 Level:', result.level);
console.log('🎬 Action:', result.action);
console.log('✔️ Conceptos identificados:', result.concepts_identified);
console.log('❌ Conceptos faltantes:', result.missing_concepts);
console.log('💬 Mensaje:', result.message);
if (result.next_question) {
  console.log('❓ Siguiente pregunta:', result.next_question);
}

console.log('\n🎯 EXPECTATIVA:');
console.log('- Level: "correct" (cumple las 2 evidencias)');
console.log('- Evidencia #1 cumplida: altura + actitud + sudor + caja = 4 peligros ✅');
console.log('- Evidencia #2 cumplida: "es muy peligro trabajar sin linea de vida se puede caer" ✅');
