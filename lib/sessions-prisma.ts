/**
 * Módulo de Sesiones con Prisma
 * Sistema SOPHI - Fase 2
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtiene todas las sesiones de un estudiante
 */
export async function getSessionsByStudent(studentId: string) {
  return await prisma.studentSession.findMany({
    where: {
      student_id: studentId,
    },
    include: {
      lesson: {
        select: {
          id: true,
          titulo: true,
          objetivo: true,
          duracion_estimada: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Obtiene una sesión por ID
 */
export async function getSessionById(sessionId: string) {
  return await prisma.studentSession.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      lesson: true,
    },
  });
}

/**
 * Busca sesión activa de un estudiante para una lección
 */
export async function findActiveSession(studentId: string, lessonId: string) {
  return await prisma.studentSession.findFirst({
    where: {
      student_id: studentId,
      lesson_id: lessonId,
      completed: false,
    },
    include: {
      lesson: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Crea una nueva sesión
 */
export async function createSession(data: {
  student_id: string;
  lesson_id: string;
  current_moment: string;
  current_state: string;
}) {
  return await prisma.studentSession.create({
    data: {
      student_id: data.student_id,
      lesson_id: data.lesson_id,
      current_moment: data.current_moment,
      current_state: data.current_state,
      current_question: null,
      chat_history: [],
      progress: {},
      completed: false,
      score: null,
    },
    include: {
      lesson: true,
    },
  });
}

/**
 * Actualiza una sesión
 */
export async function updateSession(
  sessionId: string,
  updates: {
    current_moment?: string;
    current_state?: string;
    current_question?: string | null;
    chat_history?: any;
    progress?: any;
    completed?: boolean;
    score?: number | null;
  }
) {
  return await prisma.studentSession.update({
    where: {
      id: sessionId,
    },
    data: updates,
    include: {
      lesson: true,
    },
  });
}

/**
 * Agrega un mensaje al historial de chat
 */
export async function addChatMessage(
  sessionId: string,
  message: {
    role: 'user' | 'assistant';
    content: string;
    message_type?: string;
    metadata?: any;
  }
) {
  const session = await getSessionById(sessionId);

  if (!session) {
    throw new Error('Sesión no encontrada');
  }

  const chatHistory = Array.isArray(session.chat_history)
    ? session.chat_history
    : [];

  const newMessage = {
    ...message,
    timestamp: new Date().toISOString(),
  };

  chatHistory.push(newMessage);

  return await updateSession(sessionId, {
    chat_history: chatHistory,
  });
}

/**
 * Actualiza el progreso de un momento
 */
export async function updateMomentProgress(
  sessionId: string,
  momentId: string,
  progressData: any
) {
  const session = await getSessionById(sessionId);

  if (!session) {
    throw new Error('Sesión no encontrada');
  }

  const progress = typeof session.progress === 'object' && session.progress !== null
    ? session.progress
    : {};

  (progress as any)[momentId] = {
    ...(progress as any)[momentId],
    ...progressData,
    updated_at: new Date().toISOString(),
  };

  return await updateSession(sessionId, { progress });
}

/**
 * Marca una sesión como completada
 */
export async function completeSession(sessionId: string, finalScore?: number) {
  return await updateSession(sessionId, {
    completed: true,
    score: finalScore || null,
  });
}

/**
 * Reinicia una sesión (para volver a empezar)
 */
export async function restartSession(sessionId: string) {
  return await updateSession(sessionId, {
    current_moment: 'M0',
    current_state: 'INTRODUCING',
    current_question: null,
    chat_history: [],
    progress: {},
    completed: false,
    score: null,
  });
}

/**
 * Elimina una sesión
 */
export async function deleteSession(sessionId: string) {
  try {
    await prisma.studentSession.delete({
      where: {
        id: sessionId,
      },
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Obtiene todas las sesiones de una lección (para profesores)
 */
export async function getSessionsByLesson(lessonId: string) {
  return await prisma.studentSession.findMany({
    where: {
      lesson_id: lessonId,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
