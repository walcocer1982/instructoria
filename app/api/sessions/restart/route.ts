/**
 * API Route: /api/sessions/restart
 * Permite al instructor reiniciar la sesión desde un momento específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionById, updateSession } from '@/lib/sessions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, momentoId } = body;

    if (!sessionId || !momentoId) {
      return NextResponse.json(
        { success: false, error: 'sessionId y momentoId son requeridos' },
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

    // Encontrar el índice del momento target
    const targetIndex = session.momento_progress.findIndex(
      p => p.momento_id === momentoId
    );

    if (targetIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Momento no encontrado en progreso' },
        { status: 404 }
      );
    }

    // Resetear el progreso del momento target
    const targetProgress = session.momento_progress[targetIndex];
    targetProgress.attempts = 0;
    targetProgress.hints_used = 0;
    targetProgress.completed_at = undefined;

    // Eliminar progreso de momentos posteriores
    const resetProgress = session.momento_progress.slice(0, targetIndex + 1);

    // Encontrar el último mensaje del asistente antes de este momento
    // para conservar el historial hasta ese punto
    const targetMomentStart = targetProgress.started_at;
    const chatHistoryIndex = session.chat_history.findIndex(
      msg => new Date(msg.timestamp) >= new Date(targetMomentStart)
    );

    const resetChatHistory = chatHistoryIndex >= 0
      ? session.chat_history.slice(0, chatHistoryIndex)
      : session.chat_history;

    // Resetear evidence_attempts relacionados al momento
    const resetEvidenceAttempts: typeof session.evidence_attempts = {};
    if (session.evidence_attempts) {
      Object.entries(session.evidence_attempts).forEach(([key, value]) => {
        // Solo mantener evidencias de momentos anteriores
        // (asumiendo que las keys no tienen el momento, esto puede necesitar ajuste)
        resetEvidenceAttempts[key] = {
          ...value,
          attempt_count: 0,
          student_responses: [],
          status: 'pending',
        };
      });
    }

    // Actualizar sesión
    await updateSession(sessionId, {
      current_momento: momentoId,
      current_state: 'INTRODUCING',
      momento_progress: resetProgress,
      chat_history: resetChatHistory,
      evidence_attempts: resetEvidenceAttempts,
      error_count: 0,
      last_error: undefined,
      is_recovering: false,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Sesión reiniciada desde ${momentoId}`,
        resetTo: momentoId,
      },
    });
  } catch (error: any) {
    console.error('Error restarting session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al reiniciar sesión' },
      { status: 500 }
    );
  }
}
