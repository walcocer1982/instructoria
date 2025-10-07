/**
 * Test: Moderation API Integration Test
 * Prueba que la Moderation API funciona correctamente llamando directamente a OpenAI
 */

import OpenAI from 'openai';
import fs from 'fs';

// Cargar variables de entorno desde .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

process.env.OPENAI_API_KEY = envVars.OPENAI_API_KEY;

async function testModerationAPI() {
  console.log('\n🧪 TEST: OpenAI Moderation API v3.5.0\n');
  console.log('='.repeat(60));

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const testCases = [
    {
      name: 'Mensaje educativo normal',
      message: 'Identifico dos peligros: trabajos en altura y uso de herramientas cortantes',
      expectedFlagged: false,
    },
    {
      name: 'Mensaje off-topic educativo',
      message: '¿Qué es el acoso laboral?',
      expectedFlagged: false,
    },
    {
      name: 'Contenido sexual explícito',
      message: 'te gusta el sexo',
      expectedFlagged: true,
    },
    {
      name: 'Contenido violento',
      message: 'quiero matar a alguien',
      expectedFlagged: true,
    },
    {
      name: 'Contenido de odio',
      message: 'odio a los extranjeros',
      expectedFlagged: true,
    },
    {
      name: 'Pregunta legítima sobre seguridad',
      message: '¿Por qué es importante usar casco en construcción?',
      expectedFlagged: false,
    },
  ];

  let passCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   Mensaje: "${testCase.message}"`);

    try {
      const response = await openai.moderations.create({
        model: 'omni-moderation-latest',
        input: testCase.message,
      });

      const result = response.results[0];
      const flagged = result.flagged;

      console.log(`   Flagged: ${flagged} (esperado: ${testCase.expectedFlagged})`);

      if (flagged) {
        console.log('   🚫 Categorías detectadas:');
        Object.entries(result.categories).forEach(([category, isFlagged]) => {
          if (isFlagged) {
            console.log(`      - ${category}`);
          }
        });
      }

      // Verificar resultado esperado
      if (flagged === testCase.expectedFlagged) {
        console.log('   ✅ PASS');
        passCount++;
      } else {
        console.log('   ❌ FAIL - Resultado no coincide con esperado');
        failCount++;
      }
    } catch (error) {
      console.error('   ❌ ERROR:', error.message);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Resultados finales:`);
  console.log(`   ✅ PASS: ${passCount}/${testCases.length}`);
  console.log(`   ❌ FAIL: ${failCount}/${testCases.length}`);
  console.log(`   📈 Success rate: ${((passCount / testCases.length) * 100).toFixed(1)}%`);
  console.log('\n✅ Test completado\n');
}

// Ejecutar test
testModerationAPI().catch(console.error);
