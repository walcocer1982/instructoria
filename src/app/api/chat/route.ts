import { NextRequest, NextResponse } from 'next/server'
import { processStudentMessage } from '@/services/chat'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json()

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'sessionId y message son requeridos' },
        { status: 400 }
      )
    }

    const response = await processStudentMessage(message, sessionId)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en /api/chat:', error)
    return NextResponse.json(
      { error: 'Error procesando mensaje' },
      { status: 500 }
    )
  }
}
