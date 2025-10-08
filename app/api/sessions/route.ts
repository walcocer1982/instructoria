/**
 * API de Sesiones de Estudiante
 * Sistema SOPHI - Fase 3
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSession,
  getSessionById,
  findActiveSession,
  getSessionsByStudent,
  updateSession,
  addChatMessage,
  updateMomentProgress,
  completeSession,
  restartSession,
} from '@/lib/sessions-prisma';
import { auth } from '@/auth';

/**
 * GET /api/sessions
 * - ?id=xxx - Obtener sesión por ID
 * - ?student_id=xxx&lesson_id=yyy - Obtener sesión activa (o crear si no existe)
 * - ?student_id=xxx - Obtener todas las sesiones del estudiante
 */
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación con NextAuth
    const authSession = await auth();

    if (!authSession?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = authSession.user;

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id') || searchParams.get('session_id');
    const studentId = searchParams.get('student_id');
    const lessonId = searchParams.get('lesson_id');
    const action = searchParams.get('action');

    // NUEVO: Listar todas las sesiones (solo profesor)
    if (action === 'list_all') {
      if (user.role !== 'TEACHER') {
        return NextResponse.json(
          { success: false, error: 'Solo profesores pueden listar todas las sesiones' },
          { status: 403 }
        );
      }

      // Importar funciones necesarias
      const { getAllUsers } = await import('@/lib/auth');
      const { getAllLessons } = await import('@/lib/lessons');
      const fs = await import('fs/promises');
      const path = await import('path');

      const sessionsDir = path.join(process.cwd(), 'data', 'sessions');

      try {
        const files = await fs.readdir(sessionsDir);
        const sessionFiles = files.filter(f => f.endsWith('.json'));

        const sessions = await Promise.all(
          sessionFiles.map(async (file) => {
            const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8');
            return JSON.parse(content);
          })
        );

        // Cargar usuarios y lecciones
        const users = await getAllUsers();
        const lessons = await getAllLessons();

        // Crear mapas para lookup rápido
        const userMap = new Map(users.map(u => [u.id, u]));
        const lessonMap = new Map(lessons.map(l => [l.id, l]));

        // Enriquecer sesiones con datos de usuario y lección
        const enrichedSessions = sessions.map(session => {
          const user = userMap.get(session.userId);
          const lesson = lessonMap.get(session.lessonId);

          return {
            ...session,
            student_name: user?.name || 'Desconocido',
            student_email: user?.email || session.userId,
            lesson_title: lesson?.titulo || session.lessonId,
          };
        });

        return NextResponse.json({ success: true, sessions: enrichedSessions });
      } catch (err: any) {
        console.error('Error listando sesiones:', err);
        return NextResponse.json(
          { success: false, error: 'Error al listar sesiones' },
          { status: 500 }
        );
      }
    }

    // Obtener por ID
    if (sessionId) {
      const studentSession = await getSessionById(sessionId);
      if (!studentSession) {
        return NextResponse.json(
          { success: false, error: 'Sesión no encontrada' },
          { status: 404 }
        );
      }

      // Verificar acceso: estudiante solo puede ver sus sesiones, profesor puede ver todas
      if (user.role === 'STUDENT' && studentSession.userId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'No autorizado' },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true, session: studentSession });
    }

    // Obtener sesión activa (o crear)
    if (studentId && lessonId) {
      // Verificar acceso
      if (user.role === 'STUDENT' && studentId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'No autorizado' },
          { status: 403 }
        );
      }

      let studentSession = await findActiveSession(studentId, lessonId);

      // Si no existe, crear nueva sesión
      if (!studentSession) {
        studentSession = await createSession({
          student_id: studentId,
          lesson_id: lessonId,
          current_moment: 'M0',
          current_state: 'INTRODUCING',
        });
      }

      return NextResponse.json({ success: true, session: studentSession });
    }

    // Obtener todas las sesiones del estudiante
    if (studentId) {
      if (user.role === 'STUDENT' && studentId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'No autorizado' },
          { status: 403 }
        );
      }

      const sessions = await getSessionsByStudent(studentId);
      return NextResponse.json({ success: true, sessions });
    }

    return NextResponse.json(
      { success: false, error: 'Parámetros inválidos' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error en GET /api/sessions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}

/**
 * Schema para actualizar sesión
 */
const UpdateSessionSchema = z.object({
  session_id: z.string(),
  action: z.enum([
    'add_message',
    'change_state',
    'advance_momento',
    'add_evaluation',
    'complete_session',
    'update_profile', // NUEVO: Actualizar perfil del estudiante
  ]),
  data: z.any().optional(),
});

/**
 * POST /api/sessions
 * Actualiza una sesión según la acción especificada
 */
export async function POST(request: NextRequest) {
  try {
    // Validar autenticación con NextAuth
    const authSession = await auth();

    if (!authSession?.user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = authSession.user;

    const body = await request.json();
    const validation = UpdateSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { session_id, action, data } = validation.data;

    // Verificar que la sesión existe
    const studentSession = await getSessionById(session_id);
    if (!studentSession) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    // Verificar acceso
    if (user.role === 'STUDENT' && studentSession.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    let updatedSession;

    switch (action) {
      case 'add_message':
        // Agregar mensaje al chat
        const MessageSchema = z.object({
          role: z.enum(['assistant', 'user']),
          content: z.string(),
          message_type: z.enum(['INTRODUCING', 'EXPOSING', 'QUESTIONING', 'HINTING', 'EVALUATING', 'RESPONSE']).optional(),
          images: z.array(z.object({
            url: z.string(),
            descripcion: z.string(),
          })).optional(),
          metadata: z.any().optional(),
        });

        const messageValidation = MessageSchema.safeParse(data);
        if (!messageValidation.success) {
          return NextResponse.json(
            { success: false, error: 'Datos de mensaje inválidos', details: messageValidation.error.errors },
            { status: 400 }
          );
        }

        updatedSession = await addChatMessage(session_id, messageValidation.data);
        break;

      case 'change_state':
        // Cambiar estado del chat
        const StateSchema = z.object({
          current_state: z.enum(['INTRODUCING', 'EXPOSING', 'QUESTIONING', 'EVALUATING', 'HINTING', 'COMPLETED']),
          current_question: z.string().optional(),
        });

        const stateValidation = StateSchema.safeParse(data);
        if (!stateValidation.success) {
          return NextResponse.json(
            { success: false, error: 'Datos de estado inválidos', details: stateValidation.error.errors },
            { status: 400 }
          );
        }

        updatedSession = await updateSession(session_id, stateValidation.data);
        break;

      case 'advance_momento':
        // Avanzar al siguiente momento
        const MomentoSchema = z.object({
          next_momento_id: z.string().regex(/^M[0-5]$/),
        });

        const momentoValidation = MomentoSchema.safeParse(data);
        if (!momentoValidation.success) {
          return NextResponse.json(
            { success: false, error: 'Datos de momento inválidos', details: momentoValidation.error.errors },
            { status: 400 }
          );
        }

        updatedSession = await updateSession(session_id, {
          current_moment: momentoValidation.data.next_momento_id,
          current_state: 'INTRODUCING',
        });
        break;

      case 'add_evaluation':
        // Agregar evaluación (guardar en progress)
        const EvaluationSchema = z.object({
          momento_id: z.string(),
          criterios_met: z.array(z.string()),
          feedback: z.string(),
          score: z.number().min(0).max(100).optional(),
        });

        const evalValidation = EvaluationSchema.safeParse(data);
        if (!evalValidation.success) {
          return NextResponse.json(
            { success: false, error: 'Datos de evaluación inválidos', details: evalValidation.error.errors },
            { status: 400 }
          );
        }

        updatedSession = await updateMomentProgress(
          session_id,
          evalValidation.data.momento_id,
          {
            criterios_met: evalValidation.data.criterios_met,
            feedback: evalValidation.data.feedback,
            score: evalValidation.data.score,
            evaluated_at: new Date().toISOString(),
          }
        );
        break;

      case 'complete_session':
        // Completar sesión
        updatedSession = await completeSession(session_id);
        break;

      case 'update_profile':
        // Actualizar perfil del estudiante (guardado en progress)
        if (user.role !== 'TEACHER') {
          return NextResponse.json(
            { success: false, error: 'Solo profesores pueden actualizar el perfil' },
            { status: 403 }
          );
        }

        const ProfileSchema = z.object({
          nivel_inicial: z.enum(['principiante', 'intermedio', 'avanzado']).optional(),
          necesita_mas_apoyo: z.boolean().optional(),
        });

        const profileValidation = ProfileSchema.safeParse(data);
        if (!profileValidation.success) {
          return NextResponse.json(
            { success: false, error: 'Datos de perfil inválidos', details: profileValidation.error.errors },
            { status: 400 }
          );
        }

        // Guardar perfil en metadata JSON
        const currentProgress = typeof studentSession.metadata === 'object' && studentSession.metadata !== null
          ? studentSession.metadata
          : {};

        updatedSession = await updateSession(session_id, {
          progress: {
            ...currentProgress,
            student_profile: profileValidation.data,
          },
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Acción desconocida' },
          { status: 400 }
        );
    }

    if (!updatedSession) {
      return NextResponse.json(
        { success: false, error: 'Error al actualizar sesión' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error: any) {
    console.error('Error en POST /api/sessions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}