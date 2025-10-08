/**
 * Módulo de Lecciones con Prisma
 * Sistema SOPHI - Fase 2
 */

import { prisma } from './prisma';

/**
 * Lee todas las lecciones
 */
export async function getAllLessons() {
  return await prisma.lesson.findMany({
    include: {
      createdBy: {
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

/**
 * Busca una lección por ID
 */
export async function getLessonById(id: string) {
  return await prisma.lesson.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Obtiene lecciones de un profesor
 */
export async function getLessonsByProfesor(profesorId: string) {
  return await prisma.lesson.findMany({
    where: {
      createdById: profesorId,
    },
    include: {
      createdBy: {
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

/**
 * Obtiene lecciones publicadas (para estudiantes)
 */
export async function getPublishedLessons() {
  return await prisma.lesson.findMany({
    where: {
      publicada: true,
    },
    include: {
      createdBy: {
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

/**
 * Crea una nueva lección
 */
export async function createLesson(data: {
  createdById: string;
  titulo: string;
  objetivo: string;
  duracion_estimada: number;
  momentos?: any;
  imagenes?: any;
  criterios_evaluacion?: string[];
}) {
  return await prisma.lesson.create({
    data: {
      titulo: data.titulo,
      objetivo: data.objetivo,
      duracion_estimada: data.duracion_estimada,
      momentos: data.momentos || [],
      imagenes: data.imagenes || [],
      criterios_evaluacion: data.criterios_evaluacion || [],
      publicada: false,
      createdById: data.createdById,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Actualiza una lección existente
 */
export async function updateLesson(
  id: string,
  updates: {
    titulo?: string;
    objetivo?: string;
    duracion_estimada?: number;
    momentos?: any;
    imagenes?: any;
    criterios_evaluacion?: string[];
    publicada?: boolean;
  }
) {
  return await prisma.lesson.update({
    where: { id },
    data: updates,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Elimina una lección
 */
export async function deleteLesson(id: string) {
  try {
    await prisma.lesson.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Publica/despublica una lección
 */
export async function togglePublishLesson(id: string) {
  const lesson = await getLessonById(id);

  if (!lesson) {
    return null;
  }

  return await updateLesson(id, { publicada: !lesson.publicada });
}
