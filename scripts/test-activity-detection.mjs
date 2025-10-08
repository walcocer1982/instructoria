import fs from 'fs';

// Leer lección IPERC
const lesson = JSON.parse(fs.readFileSync('data/lessons/lesson_iperc_001.json', 'utf-8'));

console.log('🧪 TEST: Detección de Tipos de Actividad\n');
console.log(`Lección: ${lesson.titulo}\n`);
console.log('═'.repeat(80));

// Revisar todos los momentos
lesson.momentos.forEach((momento, idx) => {
  console.log(`\n${idx + 1}. ${momento.id} - ${momento.nombre}`);
  console.log(`   Actividad: "${momento.actividad}"`);
  console.log(`   Evidencias: ${momento.evidencias.length} definidas`);

  // Predicción manual del tipo esperado
  const actividad = momento.actividad.toLowerCase();
  let expectedType = 'question'; // default

  if (actividad.startsWith('cuenta') || actividad.startsWith('narra') || actividad.startsWith('presenta un')) {
    expectedType = 'narrative';
  } else if (actividad.startsWith('explica') || actividad.startsWith('define') || actividad.startsWith('enseña')) {
    expectedType = 'explanation';
  } else if (actividad.startsWith('identifica') || actividad.startsWith('analiza') || actividad.startsWith('menciona')) {
    expectedType = 'question';
  }

  const typeIcon = expectedType === 'narrative' ? '📖' : expectedType === 'explanation' ? '🎓' : '❓';
  console.log(`   ${typeIcon} Tipo esperado: ${expectedType.toUpperCase()}`);

  // Sub-momentos (si existen)
  if (momento.sub_momentos && momento.sub_momentos.length > 0) {
    console.log(`   📋 Sub-momentos: ${momento.sub_momentos.length}`);
    momento.sub_momentos.forEach((sub, subIdx) => {
      console.log(`      ${sub.id} - "${sub.actividad}"`);

      const subActividad = sub.actividad.toLowerCase();
      let subExpectedType = 'question';

      if (subActividad.startsWith('cuenta') || subActividad.startsWith('narra')) {
        subExpectedType = 'narrative';
      } else if (subActividad.startsWith('explica') || subActividad.startsWith('define')) {
        subExpectedType = 'explanation';
      } else if (subActividad.startsWith('identifica') || subActividad.startsWith('analiza')) {
        subExpectedType = 'question';
      }

      const subIcon = subExpectedType === 'narrative' ? '📖' : subExpectedType === 'explanation' ? '🎓' : '❓';
      console.log(`      ${subIcon} Tipo esperado: ${subExpectedType.toUpperCase()}`);
    });
  }
});

console.log('\n' + '═'.repeat(80));
console.log('\n✅ El LLM detectará automáticamente estos tipos al iniciar cada momento/sub-momento');
console.log('📝 Revisa los logs del servidor cuando el estudiante avance de momento\n');
