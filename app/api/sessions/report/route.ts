/**
 * API Route: /api/sessions/report
 * Permite a estudiantes reportar problemas al instructor
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionById, updateSession } from '@/lib/sessions-prisma';
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
    const chatHistory = Array.isArray(session.chatHistory) ? session.chatHistory : [];
    const lastAssistantMessage = chatHistory
      .filter((m: any) => m.role === 'assistant')
      .pop();

    const lastQuestion = (lastAssistantMessage as any)?.content || 'Sin pregunta previa';

    // Obtener progreso actual
    const metadata = session.metadata && typeof session.metadata === 'object' ? session.metadata : {};
    const momentoProgress = (metadata as any).momento_progress || [];
    const currentProgress = momentoProgress.find(
      (p: any) => p.momento_id === session.currentMomento
    );

    // Crear reporte
    const report = {
      id: `report_${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      momento_id: session.currentMomento,
      student_message: problemDescription,
      context: {
        last_question: lastQuestion,
        chat_history_length: chatHistory.length,
        error_count: (metadata as any).error_count || 0,
        attempts: currentProgress?.attempts || 0,
      },
      status: 'pending' as const,
    };

    // Agregar reporte a la sesión (student_reports está en metadata.studentReports en Prisma)
    const studentReports = Array.isArray(session.studentReports) ? session.studentReports : [];
    studentReports.push(report);

    await updateSession(sessionId, {
      progress: {
        ...metadata,
        studentReports,
      },
    });

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
