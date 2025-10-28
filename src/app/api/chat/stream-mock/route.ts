/**
 * POST /api/chat/stream-mock
 *
 * Endpoint MOCK para simular streaming de respuestas sin consumir tokens de Claude.
 * Útil para desarrollo y testing de UX (skeleton, throttle, auto-focus, etc.)
 *
 * Activación: NEXT_PUBLIC_STREAM_MOCK_TEST=true
 *
 * IMPORTANTE: Este endpoint NO guarda nada en la base de datos.
 */

import { NextRequest } from 'next/server'
import { STREAMING_DEFAULTS } from '@/lib/streaming-utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Delays configurables (en ms)
const MOCK_INITIAL_DELAY = 3000 // Delay inicial para simular "pensamiento" del modelo
const MOCK_CHUNK_DELAY = STREAMING_DEFAULTS.THROTTLE_DELAY_MS  // Usar valor centralizado
const MOCK_CHUNK_SIZE = STREAMING_DEFAULTS.CHUNK_SIZE          // Usar valor centralizado

// Contenido mock de ~100 palabras con estructura educativa
const MOCK_CONTENT = `🎭 **MOCK MODE ACTIVADO** - Este es un texto de prueba para testing.

Te explico el concepto de manera detallada para que comprendas bien. Este párrafo inicial establece el contexto y la importancia del tema que estamos discutiendo. Es fundamental entender estos conceptos básicos antes de avanzar.

---

- **Primera idea clave:** Los conceptos fundamentales deben ser claros
- **Segunda observación:** La práctica refuerza el aprendizaje teórico
- **Tercera consideración:** La retroalimentación mejora el proceso educativo

Para finalizar, estos elementos son cruciales en cualquier proceso de aprendizaje efectivo. Recuerda que la constancia y la práctica son tus mejores aliados para dominar cualquier tema nuevo.

✅ **Fin del contenido mock** - Total: ~100 palabras`

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { sessionId, message } = await request.json()

    console.log(`[MOCK] Simulando respuesta para sessionId: ${sessionId}, mensaje: "${message}"`)

    // Crear ReadableStream para SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Delay inicial para simular "pensamiento" del modelo
          console.log(`[MOCK] Simulando tiempo de pensamiento (${MOCK_INITIAL_DELAY/1000}s)...`)
          await new Promise(resolve => setTimeout(resolve, MOCK_INITIAL_DELAY))

          // Enviar chunks simulando streaming real
          for (let i = 0; i < MOCK_CONTENT.length; i += MOCK_CHUNK_SIZE) {
            const chunk = MOCK_CONTENT.slice(i, Math.min(i + MOCK_CHUNK_SIZE, MOCK_CONTENT.length))

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'chunk',
                content: chunk
              })}\n\n`)
            )

            // Delay configurable para simular latencia
            await new Promise(resolve => setTimeout(resolve, MOCK_CHUNK_DELAY))
          }

          // Evento de finalización
          const totalTime = Date.now() - startTime
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'done',
              tokens: { input: 50, output: 100 }, // Tokens simulados
              time: totalTime
            })}\n\n`)
          )

          console.log(`[MOCK] Stream completado en ${totalTime}ms`)
          controller.close()

        } catch (error) {
          console.error('[MOCK] Error en streaming:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: 'Error en mock streaming'
            })}\n\n`)
          )
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('[MOCK] Error procesando request:', error)
    return new Response(
      JSON.stringify({ error: 'Error en mock endpoint' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
