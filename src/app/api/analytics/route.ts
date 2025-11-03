/**
 * GET /api/analytics
 *
 * Retorna todas las métricas del dashboard de analytics
 * Ejecuta las 10 queries en paralelo para máxima eficiencia
 */

import { NextResponse } from 'next/server'
import { getAllAnalytics } from '@/lib/analytics-queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('[ANALYTICS] Iniciando obtención de métricas...')

    const data = await getAllAnalytics()

    console.log('[ANALYTICS] ✅ Métricas obtenidas exitosamente')
    console.log(`[ANALYTICS] Total estudiantes: ${data.metadata.total_students}`)

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('[ANALYTICS] ❌ Error obteniendo métricas:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
