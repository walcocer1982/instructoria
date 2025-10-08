/**
 * API Route: /api/sessions/restart
 * Permite al instructor reiniciar la sesión desde un momento específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionById, updateSession } from '@/lib/sessions-prisma';

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

    // Obtener metadata
    const metadata = session.metadata && typeof session.metadata === 'object' ? session.metadata : {};
    const momentoProgress = (metadata as any).momento_progress || [];

    // Encontrar el índice del momento target
    const targetIndex = momentoProgress.findIndex(
      (p: any) => p.momento_id === momentoId
    );

    if (targetIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Momento no encontrado en progreso' },
        { status: 404 }
      );
    }

    // Resetear el progreso del momento target
    const targetProgress = momentoProgress[targetIndex];
    targetProgress.attempts = 0;
    targetProgress.hints_used = 0;
    targetProgress.completed_at = undefined;

    // Eliminar progreso de momentos posteriores
    const resetProgress = momentoProgress.slice(0, targetIndex + 1);

    // Encontrar el último mensaje del asistente antes de este momento
    // para conservar el historial hasta ese punto
    const chatHistory = Array.isArray(session.chatHistory) ? session.chatHistory : [];
    const targetMomentStart = targetProgress.started_at;
    const chatHistoryIndex = chatHistory.findIndex(
      (msg: any) => new Date(msg.timestamp) >= new Date(targetMomentStart)
    );

    const resetChatHistory = chatHistoryIndex >= 0
      ? chatHistory.slice(0, chatHistoryIndex)
      : chatHistory;

    // Resetear evidence_attempts relacionados al momento
    const evidenceAttempts = (metadata as any).evidence_attempts || {};
    const resetEvidenceAttempts: any = {};
    if (evidenceAttempts) {
      Object.entries(evidenceAttempts).forEach(([key, value]) => {
        // Solo mantener evidencias de momentos anteriores
        // (asumiendo que las keys no tienen el momento, esto puede necesitar ajuste)
        resetEvidenceAttempts[key] = {
          ...(value as any),
          attempt_count: 0,
          student_responses: [],
          status: 'pending',
        };
      });
    }

    // Actualizar sesión
    await updateSession(sessionId, {
      current_moment: momentoId,
      current_state: 'INTRODUCING',
      chat_history: resetChatHistory,
      progress: {
        ...metadata,
        momento_progress: resetProgress,
        evidence_attempts: resetEvidenceAttempts,
        error_count: 0,
        last_error: undefined,
        is_recovering: false,
      },
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
