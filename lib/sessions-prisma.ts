/**
 * Módulo de Sesiones con Prisma
 * Sistema SOPHI - Fase 2
 */

import { prisma } from './prisma';

/**
 * Obtiene todas las sesiones de un estudiante
 */
export async function getSessionsByStudent(studentId: string) {
  return await prisma.studentSession.findMany({
    where: {
      userId: studentId,
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
      startedAt: 'desc',
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
      userId: studentId,
      lessonId: lessonId,
      completedAt: null, // No completada
    },
    include: {
      lesson: true,
    },
    orderBy: {
      startedAt: 'desc',
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
      userId: data.student_id,
      lessonId: data.lesson_id,
      currentMomento: data.current_moment,
      currentState: data.current_state,
      currentQuestion: null,
      chatHistory: [],
      metadata: {},
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
  // Map snake_case to camelCase for Prisma
  const prismaUpdates: any = {};

  if (updates.current_moment !== undefined) {
    prismaUpdates.currentMomento = updates.current_moment;
  }
  if (updates.current_state !== undefined) {
    prismaUpdates.currentState = updates.current_state;
  }
  if (updates.current_question !== undefined) {
    prismaUpdates.currentQuestion = updates.current_question;
  }
  if (updates.chat_history !== undefined) {
    prismaUpdates.chatHistory = updates.chat_history;
  }
  if (updates.progress !== undefined) {
    prismaUpdates.metadata = updates.progress;
  }
  if (updates.completed !== undefined) {
    prismaUpdates.completedAt = updates.completed ? new Date() : null;
  }

  return await prisma.studentSession.update({
    where: {
      id: sessionId,
    },
    data: prismaUpdates,
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

  const chatHistory = Array.isArray(session.chatHistory)
    ? session.chatHistory
    : [];

  const newMessage = {
    ...message,
    timestamp: new Date().toISOString(),
  };

  (chatHistory as any[]).push(newMessage);

  return await prisma.studentSession.update({
    where: { id: sessionId },
    data: { chatHistory },
    include: { lesson: true },
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

  const metadata = typeof session.metadata === 'object' && session.metadata !== null
    ? session.metadata
    : {};

  (metadata as any)[momentId] = {
    ...(metadata as any)[momentId],
    ...progressData,
    updated_at: new Date().toISOString(),
  };

  return await prisma.studentSession.update({
    where: { id: sessionId },
    data: { metadata },
    include: { lesson: true },
  });
}

/**
 * Marca una sesión como completada
 */
export async function completeSession(sessionId: string, finalScore?: number) {
  return await prisma.studentSession.update({
    where: { id: sessionId },
    data: {
      completedAt: new Date(),
    },
    include: { lesson: true },
  });
}

/**
 * Reinicia una sesión (para volver a empezar)
 */
export async function restartSession(sessionId: string) {
  return await prisma.studentSession.update({
    where: { id: sessionId },
    data: {
      currentMomento: 'M0',
      currentState: 'INTRODUCING',
      currentQuestion: null,
      chatHistory: [],
      metadata: {},
      completedAt: null,
    },
    include: { lesson: true },
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
      lessonId: lessonId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
  });
}
