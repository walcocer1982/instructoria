import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/audit/page-exit
 *
 * Registra cuando un estudiante sale de la página durante una verificación
 * Utiliza la tabla SecurityIncident con tipo 'page_exit' y severidad 'low'
 *
 * Body:
 * {
 *   sessionId: string
 *   timeAway: number (segundos)
 *   totalTimeAway: number (segundos acumulados)
 *   exitCount: number (veces que ha salido)
 *   timestamp: string (ISO)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { sessionId, timeAway, totalTimeAway, exitCount, timestamp } = await req.json()

    // Validar datos
    if (!sessionId || typeof timeAway !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Obtener la sesión para el userId
    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, id: true }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Registrar en SecurityIncident
    await prisma.securityIncident.create({
      data: {
        sessionId: session.id,
        userId: session.userId,
        incidentType: 'page_exit',
        severity: 'low', // Severidad baja - solo informativo
        details: {
          timeAway,
          totalTimeAway,
          exitCount,
          timestamp,
          action: 'page_visibility_change'
        }
      }
    })

    console.log(
      `[PAGE_EXIT] Usuario salió de la página - ` +
      `Session: ${sessionId}, ` +
      `Tiempo fuera: ${timeAway}s, ` +
      `Total acumulado: ${totalTimeAway}s, ` +
      `Salidas: ${exitCount}`
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PAGE_EXIT] Error registrando salida:', error)
    return NextResponse.json(
      { error: 'Failed to log page exit' },
      { status: 500 }
    )
  }
}
