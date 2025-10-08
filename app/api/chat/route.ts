/**
 * API del Chat AI Tutor
 * Sistema SOPHI - Fase 4
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { getSessionById } from '@/lib/sessions-prisma';
import { initializeSession, processStudentResponse } from '@/lib/agents/orchestrator';

/**
 * POST /api/chat
 * Maneja las interacciones del chat
 */
export async function POST(request: NextRequest) {
  try {
    // Validar autenticación con NextAuth
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Solo estudiantes pueden usar el chat
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, error: 'Solo estudiantes pueden usar el chat' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const ActionSchema = z.object({
      action: z.enum(['initialize', 'send_message']),
      session_id: z.string(),
      message: z.string().optional(),
    });

    const validation = ActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { action, session_id, message } = validation.data;

    // Verificar que la sesión pertenece al estudiante
    console.log('[API /api/chat] Buscando sesión:', session_id);
    console.log('[API /api/chat] Usuario autenticado:', session.user.id);

    const studentSession = await getSessionById(session_id);

    console.log('[API /api/chat] Sesión encontrada:', studentSession ? 'SÍ' : 'NO');
    if (studentSession) {
      console.log('[API /api/chat] Sesión userId:', studentSession.userId);
      console.log('[API /api/chat] Sesión lessonId:', studentSession.lessonId);
    }

    if (!studentSession) {
      console.error('[API /api/chat] ❌ Sesión no encontrada. ID buscado:', session_id);
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    if (studentSession.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Ejecutar acción
    if (action === 'initialize') {
      console.log('\n[API /api/chat] 🚀 ACTION: initialize');
      console.log('[API /api/chat] Session ID:', session_id);

      // Inicializar sesión: genera mensajes de bienvenida, exposición y primera pregunta
      await initializeSession(session_id);

      // Obtener sesión actualizada
      const updatedSession = await getSessionById(session_id);

      console.log('[API /api/chat] ✅ Sesión actualizada');
      console.log('[API /api/chat] Estado final:', updatedSession?.currentState);
      console.log('[API /api/chat] Mensajes en chat:', Array.isArray(updatedSession?.chatHistory) ? updatedSession.chatHistory.length : 0);

      return NextResponse.json({
        success: true,
        message: 'Sesión inicializada',
        session: updatedSession,
      });
    }

    if (action === 'send_message') {
      if (!message || message.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'El mensaje no puede estar vacío' },
          { status: 400 }
        );
      }

      try {
        // Procesar respuesta del estudiante
        await processStudentResponse(session_id, message);

        // Obtener sesión actualizada
        const updatedSession = await getSessionById(session_id);

        return NextResponse.json({
          success: true,
          message: 'Respuesta procesada',
          session: updatedSession,
        });
      } catch (processingError: any) {
        // Error durante procesamiento - la sesión ya fue revertida por rollbackToCheckpoint
        console.error('[API /api/chat] Error procesando respuesta:', processingError);

        // Obtener sesión (ya revertida)
        const recoveredSession = await getSessionById(session_id);

        return NextResponse.json({
          success: false,
          error: 'Ocurrió un error al procesar tu respuesta. Hemos restaurado el estado anterior.',
          error_details: processingError.message,
          session: recoveredSession,
          can_retry: true,
        }, { status: 500 });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Acción desconocida' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error en POST /api/chat:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}