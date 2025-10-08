/**
 * API de Lecciones
 * GET: Listar lecciones, POST: Crear lección
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getAllLessons,
  getLessonById,
  getLessonsByProfesor,
  getPublishedLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  togglePublishLesson,
} from '@/lib/lessons-prisma';
import { auth } from '@/auth';

// Schema para crear lección
const CreateLessonSchema = z.object({
  titulo: z.string().min(3, 'Título debe tener al menos 3 caracteres'),
  objetivo: z.string().min(10, 'Objetivo debe tener al menos 10 caracteres'),
  duracion_min: z.number().min(5).max(300),
  criterios_evaluacion: z.array(z.string()).optional(),
  imagenes: z.array(z.object({
    url: z.string(),
    descripcion: z.string(),
    tipo: z.enum(['contexto', 'ejemplo', 'evidencia', 'recurso']),
    momento_id: z.string().optional(),
  })).optional(),
});

/**
 * GET /api/lessons
 * Listar lecciones (filtros opcionales)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const profesorId = searchParams.get('profesor_id');
    const published = searchParams.get('published');

    // Obtener una lección específica
    if (id) {
      const lesson = await getLessonById(id);

      if (!lesson) {
        return NextResponse.json({
          success: false,
          error: 'Lección no encontrada',
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        lesson,
      });
    }

    // Lecciones publicadas (para estudiantes)
    if (published === 'true') {
      const lessons = await getPublishedLessons();
      return NextResponse.json({
        success: true,
        lessons,
        count: lessons.length,
      });
    }

    // Lecciones de un profesor específico
    if (profesorId) {
      const lessons = await getLessonsByProfesor(profesorId);
      return NextResponse.json({
        success: true,
        lessons,
        count: lessons.length,
      });
    }

    // Todas las lecciones (admin)
    const lessons = await getAllLessons();
    return NextResponse.json({
      success: true,
      lessons,
      count: lessons.length,
    });

  } catch (error: any) {
    console.error('Error en GET /api/lessons:', error);

    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
    }, { status: 500 });
  }
}

/**
 * POST /api/lessons
 * Crear nueva lección
 */
export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    const authSession = await auth();

    if (!authSession?.user) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado',
      }, { status: 401 });
    }

    // Solo profesores pueden crear lecciones
    if (authSession.user.role !== 'TEACHER') {
      return NextResponse.json({
        success: false,
        error: 'No tienes permisos para crear lecciones',
      }, { status: 403 });
    }

    // Validar body
    const body = await request.json();
    const data = CreateLessonSchema.parse(body);

    // Crear lección
    const lesson = await createLesson({
      titulo: data.titulo,
      objetivo: data.objetivo,
      duracion_estimada: data.duracion_min,
      criterios_evaluacion: data.criterios_evaluacion,
      imagenes: data.imagenes,
      createdById: authSession.user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Lección creada exitosamente',
      lesson,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/lessons:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validación fallida',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
    }, { status: 500 });
  }
}

/**
 * PUT /api/lessons?id=xxx
 * Actualizar lección
 */
export async function PUT(request: NextRequest) {
  try {
    // Validar autenticación
    const authSession = await auth();

    if (!authSession?.user || authSession.user.role !== 'TEACHER') {
      return NextResponse.json({
        success: false,
        error: 'No autorizado',
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID de lección requerido',
      }, { status: 400 });
    }

    // Verificar que la lección pertenece al profesor
    const lesson = await getLessonById(id);

    if (!lesson) {
      return NextResponse.json({
        success: false,
        error: 'Lección no encontrada',
      }, { status: 404 });
    }

    if (lesson.createdById !== authSession.user.id) {
      return NextResponse.json({
        success: false,
        error: 'No puedes editar esta lección',
      }, { status: 403 });
    }

    // Actualizar
    const body = await request.json();
    const updatedLesson = await updateLesson(id, body);

    return NextResponse.json({
      success: true,
      message: 'Lección actualizada exitosamente',
      lesson: updatedLesson,
    });

  } catch (error: any) {
    console.error('Error en PUT /api/lessons:', error);

    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/lessons?id=xxx
 * Eliminar lección
 */
export async function DELETE(request: NextRequest) {
  try {
    // Validar autenticación
    const authSession = await auth();

    if (!authSession?.user || authSession.user.role !== 'TEACHER') {
      return NextResponse.json({
        success: false,
        error: 'No autorizado',
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID de lección requerido',
      }, { status: 400 });
    }

    // Verificar ownership
    const lesson = await getLessonById(id);

    if (!lesson) {
      return NextResponse.json({
        success: false,
        error: 'Lección no encontrada',
      }, { status: 404 });
    }

    if (lesson.createdById !== authSession.user.id) {
      return NextResponse.json({
        success: false,
        error: 'No puedes eliminar esta lección',
      }, { status: 403 });
    }

    // Eliminar
    await deleteLesson(id);

    return NextResponse.json({
      success: true,
      message: 'Lección eliminada exitosamente',
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/lessons:', error);

    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
    }, { status: 500 });
  }
}