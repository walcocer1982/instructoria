/**
 * Módulo de Lecciones
 * Sistema SOPHI - Fase 2
 */

import { Lesson } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const LESSONS_DIR = path.join(process.cwd(), 'data', 'lessons');

/**
 * Lee todas las lecciones
 */
export async function getAllLessons(): Promise<Lesson[]> {
  try {
    const files = await fs.readdir(LESSONS_DIR);
    const lessons: Lesson[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(LESSONS_DIR, file), 'utf-8');
        lessons.push(JSON.parse(content));
      }
    }

    // Ordenar por fecha de creación (más reciente primero)
    return lessons.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    return [];
  }
}

/**
 * Busca una lección por ID
 */
export async function getLessonById(id: string): Promise<Lesson | null> {
  try {
    const filePath = path.join(LESSONS_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene lecciones de un profesor
 */
export async function getLessonsByProfesor(profesorId: string): Promise<Lesson[]> {
  const allLessons = await getAllLessons();
  return allLessons.filter(lesson => lesson.profesor_id === profesorId);
}

/**
 * Obtiene lecciones publicadas (para estudiantes)
 */
export async function getPublishedLessons(): Promise<Lesson[]> {
  const allLessons = await getAllLessons();
  return allLessons.filter(lesson => lesson.publicada);
}

/**
 * Crea una nueva lección
 */
export async function createLesson(data: {
  profesor_id: string;
  titulo: string;
  objetivo: string;
  duracion_min: number;
  momentos?: any[];
  imagenes?: any[];
  criterios_evaluacion?: string[];
  agent_outputs?: any;
}): Promise<Lesson> {
  const lesson: Lesson = {
    id: crypto.randomUUID(),
    profesor_id: data.profesor_id,
    titulo: data.titulo,
    objetivo: data.objetivo,
    duracion_min: data.duracion_min,
    momentos: data.momentos || [],
    imagenes: data.imagenes || [],
    criterios_evaluacion: data.criterios_evaluacion || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    publicada: false,
    agent_outputs: data.agent_outputs || {},
  };

  // Guardar en archivo
  const filePath = path.join(LESSONS_DIR, `${lesson.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(lesson, null, 2));

  return lesson;
}

/**
 * Actualiza una lección existente
 */
export async function updateLesson(
  id: string,
  updates: Partial<Omit<Lesson, 'id' | 'profesor_id' | 'created_at'>>
): Promise<Lesson | null> {
  const lesson = await getLessonById(id);

  if (!lesson) {
    return null;
  }

  const updatedLesson: Lesson = {
    ...lesson,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const filePath = path.join(LESSONS_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(updatedLesson, null, 2));

  return updatedLesson;
}

/**
 * Elimina una lección
 */
export async function deleteLesson(id: string): Promise<boolean> {
  try {
    const filePath = path.join(LESSONS_DIR, `${id}.json`);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Publica/despublica una lección
 */
export async function togglePublishLesson(id: string): Promise<Lesson | null> {
  const lesson = await getLessonById(id);

  if (!lesson) {
    return null;
  }

  return updateLesson(id, { publicada: !lesson.publicada });
}