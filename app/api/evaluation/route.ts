/**
 * API de Evaluación
 * Sistema SOPHI - Fase 5
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateToken } from '@/lib/auth';
import { getSessionById, updateSession } from '@/lib/sessions-prisma';
import { getLessonById } from '@/lib/lessons-prisma';
// import { runEvaluatorAgent, EvaluatorInput } from '@/lib/agents/evaluator'; // TODO v3.0: Crear evaluación final separada

/**
 * POST /api/evaluation
 * Evalúa el desempeño del estudiante en una lección
 */
export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await validateToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // Solo estudiantes pueden solicitar evaluación
    if (user.rol !== 'estudiante') {
      return NextResponse.json(
        { success: false, error: 'Solo estudiantes pueden solicitar evaluación' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const EvaluationRequestSchema = z.object({
      session_id: z.string(),
      submitted_work: z.string().optional(),
    });

    const validation = EvaluationRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { session_id, submitted_work } = validation.data;

    // Obtener sesión
    const session = await getSessionById(session_id);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la sesión pertenece al estudiante
    if (session.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener lección
    const lesson = await getLessonById(session.lessonId);
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    // Preparar evidencias del estudiante
    const chatHistory = Array.isArray(session.chatHistory) ? session.chatHistory : [];
    const responses = chatHistory
      .filter((msg: any) => msg.role === 'user')
      .map((userMsg: any, index: number) => {
        const questionMsg = chatHistory
          .slice(0, chatHistory.indexOf(userMsg))
          .reverse()
          .find((msg: any) => msg.message_type === 'QUESTIONING');

        const evaluationMsg = chatHistory
          .slice(chatHistory.indexOf(userMsg) + 1)
          .find((msg: any) => msg.message_type === 'EVALUATING' && (msg as any).metadata?.evaluation);

        // Extraer el nivel de evaluación de forma segura
        let evaluationLevel: 'correct' | 'partial' | 'incorrect' = 'incorrect';
        if (evaluationMsg && (evaluationMsg as any).metadata?.evaluation) {
          const evalMetadata = (evaluationMsg as any).metadata.evaluation;
          if (typeof evalMetadata === 'object' && 'level' in evalMetadata) {
            evaluationLevel = (evalMetadata as any).level;
          } else if (typeof evalMetadata === 'string') {
            evaluationLevel = evalMetadata as 'correct' | 'partial' | 'incorrect';
          }
        }

        return {
          question: (questionMsg as any)?.content || 'Sin pregunta',
          answer: (userMsg as any).content,
          evaluation: evaluationLevel,
        };
      });

    const correctAnswers = responses.filter(r => r.evaluation === 'correct').length;
    const partialAnswers = responses.filter(r => r.evaluation === 'partial').length;
    const incorrectAnswers = responses.filter(r => r.evaluation === 'incorrect').length;

    const metadata = session.metadata && typeof session.metadata === 'object' ? session.metadata : {};
    const momentoProgress = (metadata as any).momento_progress || [];
    const hintsUsed = momentoProgress.reduce((total: number, mp: any) => total + (mp.hints_used || 0), 0);

    const timeSpentMinutes = session.startedAt && session.lastActivity
      ? Math.round((new Date(session.lastActivity).getTime() - new Date(session.startedAt).getTime()) / 60000)
      : undefined;

    // TODO v3.0: Implementar evaluación final separada
    // Por ahora, calcular score simple basado en respuestas
    const totalResponses = responses.length;
    const score = totalResponses > 0
      ? Math.round(((correctAnswers * 80) + (partialAnswers * 50)) / totalResponses)
      : 0;
    const passed = score >= 60;
    const feedback = passed
      ? `Has completado la lección con éxito. Respondiste ${correctAnswers} de ${totalResponses} preguntas correctamente.`
      : `Necesitas más práctica. Respondiste ${correctAnswers} de ${totalResponses} preguntas correctamente. Intenta repasar los conceptos.`;

    // Guardar evaluación en la sesión
    const newEvaluation = {
      id: `eval_${Date.now()}`,
      timestamp: new Date().toISOString(),
      score,
      feedback,
      passed,
      submitted_work,
    };

    await updateSession(session_id, {
      evaluations: [...(session.evaluations || []), newEvaluation],
    });

    return NextResponse.json({
      success: true,
      evaluation: newEvaluation,
    });
  } catch (error: any) {
    console.error('Error en POST /api/evaluation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}