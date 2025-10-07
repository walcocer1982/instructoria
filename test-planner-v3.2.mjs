/**
 * Test: Planner v3.2.0 - Contextual Enrichment
 *
 * Verifica que el Planner genera correctamente:
 * - pregunta_guia: Pregunta específica basada en imagen
 * - context_narrative: Narrativa contextual
 * - expected_answers: Respuestas esperadas concretas
 */

const PLANNER_URL = 'http://localhost:3001/api/agents/planner';

console.log('🧪 TEST: Planner v3.2.0 - Campos Enriquecidos Contextuales\n');
console.log('='.repeat(80));

const testInput = {
  objective: 'Aprender a identificar peligros en el trabajo y evaluar riesgos para trabajar de forma segura',

  // Imágenes con descripciones detalladas (el Planner las analiza textualmente)
  images: [
    {
      url: 'https://www.bigformacion.es/wp-content/uploads/2022/03/ADGN094PO-scaled.jpeg',
      descripcion: 'Trabajador en almacén sacando caja de 20 kg a 5 metros de altura sin línea de vida',
      tipo: 'contexto'
    },
    {
      url: 'https://prevenblog.com/wp-content/uploads/2018/11/peligros-riesgos-laborales.jpg',
      descripcion: 'Ejemplos de peligros comunes: caídas, objetos pesados, electricidad, químicos',
      tipo: 'recurso'
    },
    {
      url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRME5x8KqL8wZVvBp2h-qvZ8yXMfT_6jcfOA&s',
      descripcion: 'Matriz de riesgos simple con colores: Verde (bajo), Amarillo (medio), Naranja (alto), Rojo (crítico)',
      tipo: 'recurso'
    },
    {
      url: 'https://www.seipro.es/wp-content/uploads/jerarquia-de-controles.jpg',
      descripcion: 'Pirámide de controles: lo mejor es eliminar el peligro, lo último es usar EPP',
      tipo: 'recurso'
    }
  ],

  constraints: [
    'Usar lenguaje simple para trabajadores operativos',
    'Incluir ejemplos prácticos del día a día'
  ]
};

console.log('\n📝 INPUT DEL TEST:');
console.log('Objetivo:', testInput.objective);
console.log('Imágenes:', testInput.images.length);
testInput.images.forEach((img, i) => {
  console.log(`  ${i + 1}. [${img.tipo}] ${img.descripcion}`);
});

console.log('\n⏳ Generando plan con Planner v3.2.0...\n');

try {
  const response = await fetch(PLANNER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testInput),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  const apiResponse = await response.json();

  // El API devuelve { success: true, data: {...}, timestamp: ... }
  const result = apiResponse.data || apiResponse;

  console.log('✅ PLAN GENERADO EXITOSAMENTE\n');
  console.log('='.repeat(80));

  // Análisis general
  console.log('\n📊 ANÁLISIS GENERAL:');
  console.log(`- Momentos generados: ${result.momentos?.length || 0}`);
  console.log(`- Nivel de complejidad: ${result.nivel_complejidad}`);
  console.log(`- Criterios de evaluación: ${result.criterios_evaluacion?.length || 0}`);

  // Análisis de campos enriquecidos
  console.log('\n🔍 CAMPOS ENRIQUECIDOS POR MOMENTO:');
  console.log('='.repeat(80));

  result.momentos.forEach((momento) => {
    console.log(`\n📌 ${momento.id} - ${momento.nombre} (${momento.min} min)`);
    console.log('-'.repeat(80));

    // Actividad básica
    console.log(`\n📝 Actividad básica:`);
    console.log(`   ${momento.actividad}`);

    // CAMPOS ENRIQUECIDOS (v3.2.0)
    if (momento.pregunta_guia) {
      console.log(`\n❓ Pregunta Guía (NUEVO v3.2):`);
      console.log(`   "${momento.pregunta_guia}"`);
    } else {
      console.log(`\n❓ Pregunta Guía: [NO GENERADA]`);
    }

    if (momento.context_narrative) {
      console.log(`\n📖 Narrativa Contextual (NUEVO v3.2):`);
      console.log(`   ${momento.context_narrative}`);
    } else {
      console.log(`\n📖 Narrativa Contextual: [NO GENERADA]`);
    }

    if (momento.expected_answers?.length > 0) {
      console.log(`\n✅ Respuestas Esperadas (NUEVO v3.2): ${momento.expected_answers.length} items`);
      momento.expected_answers.forEach((ans, i) => {
        console.log(`   ${i + 1}. ${ans}`);
      });
    } else {
      console.log(`\n✅ Respuestas Esperadas: [NO GENERADAS]`);
    }

    // Evidencias esperadas (campo original)
    if (momento.evidencias?.length > 0) {
      console.log(`\n📋 Evidencias esperadas (${momento.evidencias.length}):`);
      momento.evidencias.forEach((ev, i) => {
        console.log(`   ${i + 1}. ${ev}`);
      });
    }

    // Actividad detallada (si existe)
    if (momento.actividad_detallada) {
      console.log(`\n🎯 Actividad Detallada:`);
      console.log(`   Tipo: ${momento.actividad_detallada.tipo}`);
      console.log(`   Título: ${momento.actividad_detallada.titulo}`);
      console.log(`   Descripción: ${momento.actividad_detallada.descripcion}`);

        if (momento.actividad_detallada.instrucciones?.length > 0) {
        console.log(`   Instrucciones (${momento.actividad_detallada.instrucciones.length}):`);
        momento.actividad_detallada.instrucciones.forEach((inst, i) => {
          console.log(`     ${i + 1}. ${inst}`);
        });
      }
    }

    // Sub-momentos (si existen)
    if (momento.sub_momentos?.length > 0) {
      console.log(`\n🔸 Sub-momentos: ${momento.sub_momentos.length}`);
      momento.sub_momentos.forEach((sub) => {
        console.log(`\n   ${sub.id} - ${sub.nombre} (${sub.min} min)`);
        console.log(`   Actividad: ${sub.actividad}`);
        if (sub.pregunta_guia) {
          console.log(`   Pregunta: "${sub.pregunta_guia}"`);
        }
      });
    }
  });

  // Verificación de calidad
  console.log('\n\n🧪 VERIFICACIÓN DE CALIDAD:');
  console.log('='.repeat(80));

  let enrichedCount = 0;
  let totalMoments = result.momentos.length;

  result.momentos.forEach((momento) => {
    if (momento.pregunta_guia || momento.context_narrative || momento.expected_answers) {
      enrichedCount++;
    }
  });

  console.log(`\n✅ Momentos con campos enriquecidos: ${enrichedCount}/${totalMoments}`);

  // Validación específica para M0 (debe tener enriquecimiento por imagen de contexto)
  const m0 = result.momentos.find(m => m.id === 'M0');
  if (m0) {
    console.log('\n🎯 VALIDACIÓN M0 (Motivación):');
    const hasEnrichment = !!(m0.pregunta_guia && m0.context_narrative && m0.expected_answers);
    console.log(`   Tiene enriquecimiento: ${hasEnrichment ? '✅ SÍ' : '❌ NO'}`);

    if (hasEnrichment) {
      // Verificar que expected_answers NO tenga variables genéricas
      const hasGenericVars = m0.expected_answers.some(ans =>
        ans.includes('[ELEMENT]') ||
        ans.includes('[MAIN_CONCEPT]') ||
        ans.includes('[PROCESS]')
      );

      console.log(`   Sin variables genéricas: ${!hasGenericVars ? '✅ SÍ' : '❌ NO (ERROR)'}`);

      // Verificar que expected_answers tenga datos específicos de la imagen
      const hasSpecificData = m0.expected_answers.some(ans =>
        ans.includes('20 kg') ||
        ans.includes('5 metros') ||
        ans.includes('línea de vida') ||
        ans.includes('altura')
      );

      console.log(`   Con datos específicos de imagen: ${hasSpecificData ? '✅ SÍ' : '❌ NO (ADVERTENCIA)'}`);
    }
  }

  // Variantes de contexto (Anti-plagiarism)
  if (result.variantes_contexto?.length > 0) {
    console.log(`\n🔄 Variantes de contexto: ${result.variantes_contexto.length}`);
    result.variantes_contexto.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v}`);
    });
  }

  // Notas de implementación
  if (result.notas_implementacion?.length > 0) {
    console.log(`\n📝 Notas de implementación: ${result.notas_implementacion.length}`);
    result.notas_implementacion.forEach((n, i) => {
      console.log(`   ${i + 1}. ${n}`);
    });
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('✅ TEST COMPLETADO');
  console.log('='.repeat(80));

  // Guardar resultado completo en JSON para inspección
  const fs = await import('fs');
  const outputPath = './test-output-planner-v3.2.json';
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n💾 Resultado completo guardado en: ${outputPath}`);

} catch (error) {
  console.error('\n❌ ERROR EN EL TEST:');
  console.error(error.message);

  if (error.cause) {
    console.error('\nCausa:');
    console.error(error.cause);
  }

  process.exit(1);
}
