/**
 * API Route: /api/sessions/report
 * Permite a estudiantes reportar problemas al instructor
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionById, updateSession } from '@/lib/sessions';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, problemDescription } = body;

    if (!sessionId || !problemDescription) {
      return NextResponse.json(
        { success: false, error: 'sessionId y problemDescription son requeridos' },
        { status: 400 }
      );
    }

    const session = await getSessionById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    // Obtener último mensaje del asistente (última pregunta)
    const lastAssistantMessage = session.chat_history
      .filter(m => m.role === 'assistant')
      .pop();

    const lastQuestion = lastAssistantMessage?.content || 'Sin pregunta previa';

    // Obtener progreso actual
    const currentProgress = session.momento_progress.find(
      p => p.momento_id === session.current_momento
    );

    // Crear reporte
    const report = {
      id: `report_${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      momento_id: session.current_momento,
      student_message: problemDescription,
      context: {
        last_question: lastQuestion,
        chat_history_length: session.chat_history.length,
        error_count: session.error_count || 0,
        attempts: currentProgress?.attempts || 0,
      },
      status: 'pending' as const,
    };

    // Agregar reporte a la sesión
    const student_reports = session.student_reports || [];
    student_reports.push(report);

    await updateSession(sessionId, { student_reports });

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        message: 'Reporte enviado al instructor correctamente',
      },
    });
  } catch (error: any) {
    console.error('Error creating student report:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear reporte' },
      { status: 500 }
    );
  }
}
