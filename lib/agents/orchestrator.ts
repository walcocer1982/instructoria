import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { runTutorAgent } from './tutor';
import { runCheckerAgent } from './checker';
import { runEvaluatorAgentWithEmbeddings } from './evaluator';

/**
 * Genera la siguiente pregunta basándose en las evidencias faltantes
 * v3.5.1: Ayuda gradual según número de intento
 *
 * @param missingConcepts - Evidencias que aún faltan
 * @param currentQuestion - Pregunta original
 * @param attemptNumber - Número de intento (1, 2, 3...)
 * @returns Pregunta con ayuda gradual
 */
function generateNextQuestionFromMissingEvidence(
  missingConcepts: string[],
  currentQuestion: string,
  attemptNumber: number = 1
): string | undefined {
  if (missingConcepts.length === 0) {
    return undefined;
  }

  // Tomar la primera evidencia faltante
  const firstMissing = missingConcepts[0];

  // Niveles de ayuda gradual
  const hints = {
    1: '', // Intento 1: Sin ayuda adicional
    2: ' Piensa en las consecuencias que podrían ocurrir.', // Intento 2: Pista general
    3: ' Considera qué medidas preventivas serían necesarias para evitar accidentes.', // Intento 3: Pista más específica
  };

  const hint = hints[attemptNumber as keyof typeof hints] || hints[3];

  // Detectar el tipo de evidencia y generar pregunta específica
  if (firstMissing.match(/identifica\s+al\s+menos\s+(\d+)/i)) {
    const match = firstMissing.match(/identifica\s+al\s+menos\s+(\d+)\s+(.+)/i);
    if (match) {
      const count = match[1];
      const what = match[2];
      return `¿Qué ${what} identificas? (Necesitas mencionar ${count})${hint}`;
    }
  }

  if (firstMissing.match(/reconoce/i)) {
    const topic = firstMissing.replace(/reconoce\s+(que\s+)?/i, '');

    // Ayuda específica para "importancia de la seguridad"
    if (topic.match(/importancia.*seguridad/i)) {
      const specificHints = {
        1: '',
        2: ' ¿Qué podría pasar si no se toman medidas de seguridad?',
        3: ' Piensa en cómo los controles de seguridad protegen a los trabajadores de accidentes graves o fatales.',
      };
      return `¿Por qué es importante la seguridad ante los peligros?${specificHints[attemptNumber as keyof typeof specificHints] || specificHints[3]}`;
    }

    return `¿Por qué ${topic.toLowerCase()}?${hint}`;
  }

  if (firstMissing.match(/explica/i)) {
    const topic = firstMissing.replace(/explica\s+/i, '');
    return `¿Podrías explicar ${topic.toLowerCase()}?${hint}`;
  }

  if (firstMissing.match(/menciona/i)) {
    const topic = firstMissing.replace(/menciona\s+/i, '');
    return `¿Cuál es ${topic.toLowerCase()}?${hint}`;
  }

  // Pregunta genérica basada en la evidencia
  return `¿Podrías decirme más sobre: ${firstMissing.toLowerCase()}?${hint}`;
}
import { getSessionById, addChatMessage, updateSession } from '../sessions-prisma';
import type { StudentSession as PrismaStudentSession, Lesson } from '@prisma/client';

// Type for session with lesson included
type StudentSession = PrismaStudentSession & {
  lesson: Lesson;
};

// TODO: calculateFlexibilityBonus needs to be migrated or removed
const calculateFlexibilityBonus = () => 0; // Temporary placeholder
import { getLessonById } from '../lessons-prisma';
import { filterImagesByMoment } from '../llm';
import { replaceConceptPlaceholders } from '../chatPlaceholders';
import { getNextMoment } from '../chatStateMachine';
import { generateQuestionId } from '../utils/chatHelpers';
import { formatEvaluationMessage } from '../formatters/messageFormatter';
import { getMomentPlan } from './planner';
import { loadSubMoment } from './planUtils';
import type { LessonMomentPlan } from '@/types/lessonPlan';
import type { Evaluation as OrchestratorEvaluation, EvaluationCategory, EvaluationNextAction } from '@/types/evaluator';
import { getLLMClient, checkModeration } from '@/lib/llm';
import { buildSystemMessage } from '@/lib/promptConstants';

// ============================================================================
// ORCHESTRATOR V4.0 - ULTRA-SIMPLE
// Usa Checker + Tutor simplificados, sin runOrchestratorAgent
// ============================================================================

// ============================================================================
// NUEVO v4.0: SISTEMA DE RECUPERACIÓN DE ERRORES
// ============================================================================

/**
 * Guarda un checkpoint del estado actual de la sesión
 * Se llama ANTES de procesar la respuesta del estudiante
 */
async function saveCheckpoint(session: StudentSession): Promise<void> {
  const chatHistory = Array.isArray(session.chatHistory) ? session.chatHistory : [];
  const metadata = session.metadata && typeof session.metadata === 'object' ? session.metadata : {};

  const checkpoint = {
    state: session.currentState,
    momento_id: session.currentMomento,
    timestamp: new Date().toISOString(),
    chat_history_length: chatHistory.length,
    momento_progress: JSON.parse(JSON.stringify((metadata as any).momento_progress || [])),
    evidence_attempts: (metadata as any).evidence_attempts ? JSON.parse(JSON.stringify((metadata as any).evidence_attempts)) : undefined,
  };

  await updateSession(session.id, {
    progress: {
      ...(metadata as any),
      last_known_good_state: checkpoint,
    },
  });

  console.log(`\n💾 [CHECKPOINT] Estado guardado - State: ${checkpoint.state}, Momento: ${checkpoint.momento_id}`);
}

/**
 * Revierte la sesión al último checkpoint guardado
 * Se llama cuando ocurre un error durante el procesamiento
 */
async function rollbackToCheckpoint(sessionId: string, errorMessage: string, errorType: 'agent_failure' | 'llm_timeout' | 'invalid_state' | 'unknown' = 'unknown'): Promise<void> {
  const session = await getSessionById(sessionId);
  if (!session) {
    console.error(`[ROLLBACK] Sesión ${sessionId} no encontrada`);
    return;
  }

  const metadata = session.metadata && typeof session.metadata === 'object' ? session.metadata : {};
  const checkpoint = (metadata as any).last_known_good_state;

  if (!checkpoint) {
    console.error(`[ROLLBACK] No hay checkpoint guardado para sesión ${sessionId}`);
    return;
  }

  console.log(`\n⏮️ [ROLLBACK] Revirtiendo a checkpoint - State: ${checkpoint.state}, Momento: ${checkpoint.momento_id}`);

  const chatHistory = Array.isArray(session.chatHistory) ? session.chatHistory : [];

  // Restaurar estado desde checkpoint
  await updateSession(sessionId, {
    current_state: checkpoint.state,
    current_moment: checkpoint.momento_id,
    chat_history: chatHistory.slice(0, checkpoint.chat_history_length),
    progress: {
      ...metadata,
      momento_progress: checkpoint.momento_progress,
      evidence_attempts: checkpoint.evidence_attempts,
      error_count: ((metadata as any).error_count || 0) + 1,
      is_recovering: false,
      last_error: {
        timestamp: new Date().toISOString(),
        message: errorMessage,
        type: errorType,
      },
    },
  });

  console.log(`✅ [ROLLBACK] Estado restaurado. Error count: ${((metadata as any).error_count || 0) + 1}`);
}

/**
 * Resetea el contador de errores cuando el estudiante logra avanzar correctamente
 */
async function resetErrorCount(sessionId: string): Promise<void> {
  const session = await getSessionById(sessionId);
  if (!session) return;

  const metadata = session.metadata && typeof session.metadata === 'object' ? session.metadata : {};

  await updateSession(sessionId, {
    progress: {
      ...metadata,
      error_count: 0,
      is_recovering: false,
    },
  });
}

// ============================================================================
// FIN SISTEMA DE RECUPERACIÓN
// ============================================================================

function validateLessonPlanStructure(lesson: any) {
  const issues: string[] = [];

  const momentos = Array.isArray(lesson.momentos) ? lesson.momentos : [];
  const criterios = Array.isArray(lesson.criterios_evaluacion) ? lesson.criterios_evaluacion : [];

  if (!momentos || momentos.length !== 6) {
    issues.push(`Debe tener exactamente 6 momentos (tiene ${momentos.length})`);
  }

  momentos.forEach((moment: any, index: number) => {
    if (!moment?.actividad_detallada) {
      issues.push(`Momento ${index + 1} usa formato sin actividad_detallada (modo legado)`);
    }
  });

  if (!criterios || criterios.length === 0) {
    issues.push('No tiene criterios de evaluacion definidos');
  }

  if (!lesson.objetivo || lesson.objetivo.trim().length < 10) {
    issues.push('Objetivo de la leccion demasiado corto o no definido');
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Helper: Extrae momento base y sub-índice de un momentId
 * NUEVO v2.4.0
 *
 * Ejemplos:
 * - "M2" → { baseMoment: "M2", subIndex: null }
 * - "M2.1" → { baseMoment: "M2", subIndex: 0 }
 * - "M2.2" → { baseMoment: "M2", subIndex: 1 }
 */
function parseMomentId(momentId: string): { baseMoment: string; subIndex: number | null } {
  const match = momentId.match(/^(M\d+)\.(\d+)$/);
  if (match) {
    return {
      baseMoment: match[1],
      subIndex: parseInt(match[2], 10) - 1,  // M2.1 → index 0
    };
  }
  return { baseMoment: momentId, subIndex: null };
}

function ensureMomentProgress(session: StudentSession, momentId: string) {
  const metadata = session.metadata && typeof session.metadata === 'object' ? session.metadata : {};

  if (!(metadata as any).momento_progress) {
    (metadata as any).momento_progress = [];
  }

  let progress = (metadata as any).momento_progress.find((entry: any) => entry.momento_id === momentId);

  if (!progress) {
    const { baseMoment, subIndex } = parseMomentId(momentId);

    progress = {
      momento_id: momentId,
      started_at: new Date().toISOString(),
      attempts: 0,
      hints_used: 0,
      max_attempts: 3,
      parent_momento_id: subIndex !== null ? baseMoment : undefined,
      sub_momento_index: subIndex !== null ? subIndex : undefined,
    };
    (metadata as any).momento_progress.push(progress);
  } else {
    progress.max_attempts = progress.max_attempts ?? 3;
    progress.attempts = progress.attempts ?? 0;
    progress.hints_used = progress.hints_used ?? 0;
  }

  return progress;
}

// Removed: mapCheckerEvaluationToAgent - Checker v4.0 returns direct level
// Removed: buildHistoryForAgent - No longer needed with simplified agents

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
// Removed: runOrchestratorAgent - Logic is now direct using Checker + Tutor v4.0

async function sendGuidingQuestion(
  session: StudentSession,
  lesson: any,
  plan: LessonMomentPlan,
  questionText: string,
  metadataSource: string,
  attemptCount: number
) {
  const normalizedQuestion = questionText.endsWith('?') ? questionText : `${questionText}?`;
  const questionId = generateQuestionId();

  await addChatMessage(session.id, {
    role: 'assistant',
    content: normalizedQuestion,
    message_type: 'QUESTIONING',
    metadata: {
      question_id: questionId,
      attempt_count: attemptCount,
      expected_concepts: plan.evidences,
      source: metadataSource,
      momento_id: plan.momentId,
    },
  });

  await updateSession(session.id, {
    current_state: 'WAITING_RESPONSE',
    current_question: questionId,
  });
}

/**
 * Genera mensaje de bienvenida M0 vía LLM (Tutor agent)
 * Incluye: Saludo, Objetivo, Criterios de evaluación
 */
async function generateWelcomeMessageViaLLM(
  session: StudentSession,
  lesson: any
) {
  const criterios = Array.isArray(lesson.criterios_evaluacion) ? lesson.criterios_evaluacion : [];
  const criteriosText = criterios.length > 0
    ? `\n\n**¿Qué vamos a evaluar?**\n${criterios.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}`
    : '';

  const welcomeText = `¡Hola! 👋 Bienvenido a esta lección interactiva.

**Objetivo:** ${lesson.objetivo}${criteriosText}

¡Comencemos!`;

  await addChatMessage(session.id, {
    role: 'assistant',
    content: welcomeText,
    message_type: 'INTRODUCING',
    metadata: {
      source: 'welcome_m0',
      momento_id: 'M0',
    },
  });
}

/**
 * v4.0: Genera contexto + pregunta dinámicamente usando LLM
 * Basado en: actividad + descripción de imagen + evidencias + pregunta_guia
 */
async function generateContextoYPregunta(
  actividad: string,
  imageDescription: string | undefined,
  evidencias: string[],
  preguntaGuia: string
): Promise<{ contexto: string; pregunta: string }> {
  const llm = getLLMClient();

  const ContextoPreguntaSchema = z.object({
    contexto: z.string().describe('Narrativa contextual rica de 2-4 oraciones que presenta la situación de forma vívida'),
    pregunta: z.string().describe('Pregunta Socrática enriquecida basada en la pregunta guía y las evidencias esperadas'),
  });

  const prompt = `Eres un experto en pedagogía que crea experiencias de aprendizaje vívidas y motivadoras.

INFORMACIÓN DISPONIBLE:
- **Actividad del docente**: ${actividad}
- **Descripción de imagen**: ${imageDescription || 'No hay imagen'}
- **Evidencias esperadas del estudiante**: ${evidencias.join(', ')}
- **Pregunta guía base**: ${preguntaGuia}

TAREA:
Genera DOS elementos:

1. **contexto**: Narrativa contextual RICA de 2-4 oraciones que:
   - Si hay imagen: Presenta la situación de forma VÍVIDA basada en los detalles de la imagen
   - Si NO hay imagen: Crea narrativa basada en las evidencias y la actividad
   - Genera CURIOSIDAD por analizar la situación
   - Usa detalles ESPECÍFICOS (números, medidas, condiciones, nombres de personas)
   - Conecta con el objetivo de aprendizaje
   - Motiva la reflexión crítica

2. **pregunta**: Pregunta Socrática enriquecida que:
   - Se basa en la pregunta guía proporcionada
   - **CRÍTICO: Debe amarrar TODAS las evidencias esperadas en una sola pregunta**
   - Si hay múltiples evidencias, la pregunta debe pedir TODAS ellas explícitamente
   - Usa "Y" para conectar múltiples evidencias en la pregunta
   - Es específica y motiva análisis profundo
   - Conecta con la narrativa contextual

**REGLA IMPORTANTE**:
Si las evidencias incluyen conceptos como:
- "Identifica X" + "Reconoce que Y es peligroso"
La pregunta DEBE pedir AMBAS cosas:
- "¿Qué X identificas Y por qué es peligroso?"

EJEMPLOS:

❌ MAL contexto (solo describe):
"Observa esta situación: trabajador en almacén sacando caja de 20 kg a 5 metros sin línea de vida."

✅ BIEN contexto (narrativa vívida):
"Visualiza un día cualquiera en el almacén: Carlos, un trabajador experimentado, se encuentra a 5 metros de altura, intentando alcanzar una pesada caja de 20 kg que se ha quedado atascada en una estantería. Sin darse cuenta del peligro, se estira peligrosamente, sin una línea de vida que lo sujete, mientras el sudor le corre por la frente. La tensión en el aire es palpable; un pequeño error podría llevar a una caída devastadora."

❌ MAL pregunta (solo pide evidencia #1):
"¿Qué riesgos están presentes?"

❌ MAL pregunta (genérica):
"¿Qué observas?"

✅ BIEN pregunta (amarra TODAS las evidencias):
Evidencias: ["Identifica 2 peligros", "Reconoce que altura sin protección es peligroso"]
Pregunta: "¿Qué peligros identificas en esta situación Y por qué es peligroso trabajar en altura sin protección?"

Genera el JSON con ambos campos:`;

  const jsonSchema = {
    name: 'contexto_pregunta_output',
    strict: true,
    schema: zodToJsonSchema(ContextoPreguntaSchema, {
      target: 'openAi',
      $refStrategy: 'none'
    })
  };

  const response = await llm.chatStructured<z.infer<typeof ContextoPreguntaSchema>>(
    [{ role: 'user', content: prompt }],
    jsonSchema,
    { model: 'gpt-4o-mini', temperature: 0.7 }
  );

  return ContextoPreguntaSchema.parse(response);
}

/**
 * Envía contexto del escenario + pregunta guía del Planner
 * Incluye la imagen del momento
 */
async function sendContextAndQuestion(
  session: StudentSession,
  lesson: any,
  plan: LessonMomentPlan
) {
  let contexto = '';
  let question = '';

  // v4.0: Generar contexto + pregunta dinámicamente
  if (!plan.contexto && plan.imageDescription) {
    // Si NO hay contexto en el plan Y hay imagen, generar ambos con LLM
    const generated = await generateContextoYPregunta(
      plan.activity,
      plan.imageDescription,
      plan.evidences,
      plan.originalGuidingQuestion || plan.guidingQuestion
    );
    contexto = generated.contexto;
    question = generated.pregunta;
  } else {
    // Usar contexto del plan (si existe) y pregunta original
    contexto = plan.contexto || '';
    question = replaceConceptPlaceholders(plan.guidingQuestion || plan.activity, lesson);
  }

  // Construir mensaje: Contexto primero (si existe), luego pregunta
  const messageContent = contexto
    ? `${contexto}\n\n${question}`
    : question;

  // Obtener imagen del momento
  // Prioridad: moment.imagen_url (Planner v3.0) > lesson.imagenes[] filtrado por momento_id (legacy)
  const momentos = Array.isArray(lesson.momentos) ? lesson.momentos : [];
  const currentMomento = momentos.find((m: any) => m.id === plan.momentId);
  let imageUrl = currentMomento?.imagen_url;
  let imageDescripcion = plan.imageDescription || plan.contexto || 'Imagen del escenario';

  // Fallback: buscar en lesson.imagenes[] (compatibilidad con lecciones viejas)
  const imagenes = Array.isArray(lesson.imagenes) ? lesson.imagenes : [];
  if (!imageUrl && imagenes.length > 0) {
    const momentImage = imagenes.find((img: any) => img.momento_id === plan.momentId);
    if (momentImage) {
      imageUrl = momentImage.url;
      imageDescripcion = momentImage.descripcion || imageDescripcion;
    }
  }

  const questionId = generateQuestionId();

  // Preparar mensaje base
  const messageData: any = {
    role: 'assistant',
    content: messageContent,
    message_type: 'QUESTIONING',
    metadata: {
      question_id: questionId,
      attempt_count: 0,
      expected_concepts: plan.evidences,
      source: 'planner_context_question',
      momento_id: plan.momentId,
    },
  };

  // Agregar imagen solo si existe
  if (imageUrl) {
    messageData.images = [{
      url: imageUrl,
      descripcion: imageDescripcion
    }];
  }

  await addChatMessage(session.id, messageData);

  await updateSession(session.id, {
    current_state: 'WAITING_RESPONSE',
    current_question: questionId,
  });
}

// Removed: applyOrchestratorDecision - Logic moved to processStudentResponse directly

// Removed: generateIntroducingMessage - Not used (introduce action removed)
// Removed: generateExposingMessage - Not used (expose action removed)
// Removed: generateQuestion - Duplicates sendGuidingQuestion logic

/**
 * Transiciona al siguiente momento o sub-momento
 * ACTUALIZADO v2.4.0: Soporta sub-momentos (M2.1, M2.2, etc.)
 */
async function transitionToNextMoment(session: StudentSession, lesson: any) {
  const { baseMoment, subIndex } = parseMomentId(session.currentMomento);
  const now = new Date().toISOString();

  // Obtener plan del momento base actual
  const currentBasePlan = getMomentPlan(lesson, baseMoment);

  // Verificar si hay sub-momentos pendientes
  if (currentBasePlan.subMoments && currentBasePlan.subMoments.length > 0) {
    const nextSubIndex = subIndex !== null ? subIndex + 1 : 0;

    // Si hay más sub-momentos, avanzar al siguiente
    if (nextSubIndex < currentBasePlan.subMoments.length) {
      const nextSubMoment = currentBasePlan.subMoments[nextSubIndex];
      const nextSubPlan = loadSubMoment(currentBasePlan, nextSubIndex);

      if (!nextSubPlan) {
        throw new Error(`No se pudo cargar sub-momento ${baseMoment}.${nextSubIndex + 1}`);
      }

      // Marcar sub-momento actual como completado
      ensureMomentProgress(session, session.currentMomento);
      const currentProgress = (session.metadata as any)?.momento_progress?.find((p: any) => p.momento_id === session.currentMomento);
      if (currentProgress && !currentProgress.completed_at) {
        currentProgress.completed_at = now;
      }

      // Iniciar siguiente sub-momento
      const nextProgress = ensureMomentProgress(session, nextSubMoment.id);
      nextProgress.started_at = nextProgress.started_at || now;

      await addChatMessage(session.id, {
        role: 'assistant',
        content: `Muy bien. Continuemos con: ${nextSubMoment.nombre}`,
        message_type: 'TRANSITIONING',
      });

      const metadata = session.metadata && typeof session.metadata === 'object' ? session.metadata : {};

      await updateSession(session.id, {
        current_moment: nextSubMoment.id,
        current_state: 'INTRODUCING',
        progress: {
          ...metadata,
          momento_progress: (metadata as any).momento_progress,
        },
      });

      const refreshedSession = await getSessionById(session.id);
      if (!refreshedSession) return;

      // Enviar contexto y pregunta del sub-momento
      await sendContextAndQuestion(refreshedSession, lesson, nextSubPlan);
      return;
    }
  }

  // No hay más sub-momentos, avanzar al siguiente momento base
  const nextMomentId = getNextMoment(baseMoment);
  const lessonMomentos = Array.isArray(lesson.momentos) ? lesson.momentos : [];
  const nextMoment = nextMomentId ? lessonMomentos.find((m: any) => m.id === nextMomentId) : null;

  if (!nextMoment) {
    await runFinalEvaluation(session, lesson);
    return;
  }

  // Marcar momento base actual como completado
  ensureMomentProgress(session, baseMoment);
  const currentProgress = (session.metadata as any)?.momento_progress?.find((p: any) => p.momento_id === baseMoment);
  if (currentProgress && !currentProgress.completed_at) {
    currentProgress.completed_at = now;
  }

  const nextMomentName =
    nextMoment.nombre ||
    nextMoment.titulo ||
    nextMoment.name ||
    nextMoment.actividad ||
    nextMoment.actividad_detallada?.titulo ||
    nextMoment.id;

  const nextProgress = ensureMomentProgress(session, nextMoment.id);

  if (!nextProgress) {
    throw new Error('No se pudo crear el progreso del siguiente momento');
  }

  nextProgress.started_at = nextProgress.started_at || now;

  await addChatMessage(session.id, {
    role: 'assistant',
    content: `Excelente trabajo. Avancemos al siguiente momento: ${nextMomentName}`,
    message_type: 'TRANSITIONING',
  });

  const metadata = session.metadata && typeof session.metadata === 'object' ? session.metadata : {};

  await updateSession(session.id, {
    current_moment: nextMoment.id,
    current_state: 'INTRODUCING',
    progress: {
      ...metadata,
      momento_progress: (metadata as any).momento_progress,
    },
  });

  const refreshedSession = await getSessionById(session.id);
  if (!refreshedSession) return;

  const plan = getMomentPlan(lesson, nextMoment.id);

  // Si el nuevo momento tiene sub-momentos, iniciar con el primero
  if (plan.subMoments && plan.subMoments.length > 0) {
    const firstSubPlan = loadSubMoment(plan, 0);
    if (firstSubPlan) {
      const firstSubProgress = ensureMomentProgress(refreshedSession, firstSubPlan.momentId);
      firstSubProgress.started_at = now;

      const refreshedMetadata = refreshedSession.metadata && typeof refreshedSession.metadata === 'object' ? refreshedSession.metadata : {};

      await updateSession(refreshedSession.id, {
        current_moment: firstSubPlan.momentId,
        progress: {
          ...refreshedMetadata,
          momento_progress: (refreshedMetadata as any).momento_progress,
        },
      });

      const updatedSession = await getSessionById(refreshedSession.id);
      if (updatedSession) {
        await sendContextAndQuestion(updatedSession, lesson, firstSubPlan);
      }
      return;
    }
  }

  // Enviar contexto y pregunta del siguiente momento (sin sub-momentos)
  await sendContextAndQuestion(refreshedSession, lesson, plan);
}

async function runFinalEvaluation(session: StudentSession, lesson: any) {
  // TODO v3.0: Implementar evaluación final con nuevo sistema
  const completionMessage = `¡Felicitaciones! Has completado la lección sobre "${lesson.objetivo}". 🎉

Revisaremos tus respuestas y recibirás feedback detallado pronto.`;

  await addChatMessage(session.id, {
    role: 'assistant',
    content: completionMessage,
    message_type: 'EVALUATING',
  });

  await updateSession(session.id, {
    current_state: 'COMPLETED',
    completed_at: new Date().toISOString(),
  });
}

export async function initializeSession(sessionId: string): Promise<void> {
  const session = await getSessionById(sessionId);
  if (!session) throw new Error('Sesion no encontrada');

  const lesson = await getLessonById(session.lessonId);
  if (!lesson) throw new Error('Leccion no encontrada');

  const validation = validateLessonPlanStructure(lesson);
  if (!validation.valid) {
    console.warn('[initializeSession] Lesson plan issues:', validation.issues);
  }

  const plan = getMomentPlan(lesson, session.currentMomento);

  // M0: Dos mensajes separados
  if (session.currentMomento === 'M0') {
    // 1. Mensaje de bienvenida vía LLM
    await generateWelcomeMessageViaLLM(session, lesson);

    // 2. Contexto + Pregunta del Planner
    const sessionAfterWelcome = await getSessionById(sessionId);
    if (sessionAfterWelcome) {
      await sendContextAndQuestion(sessionAfterWelcome, lesson, plan);
    }
    return;
  }

  // M1-M5: Enviar contexto y pregunta
  await sendContextAndQuestion(session, lesson, plan);
}

/**
 * V4.0 - SIMPLIFICADO
 * Lógica directa: Checker → Tutor → Decision (sin runOrchestratorAgent)
 */
/**
 * processStudentResponse - v3.0.0 (Nueva Arquitectura Simplificada)
 *
 * Flujo:
 * 1. Checker clasifica tipo de mensaje
 * 2. Rutea a Evaluator (respuestas) o Tutor (preguntas)
 * 3. Muestra resultado al estudiante
 */
export async function processStudentResponse(
  sessionId: string,
  studentResponse: string
): Promise<void> {
  let session = await getSessionById(sessionId);
  if (!session) throw new Error('Sesion no encontrada');

  if (session.currentState !== 'WAITING_RESPONSE') {
    throw new Error('No se esperaba una respuesta en este momento');
  }

  const lesson = await getLessonById(session.lessonId);
  if (!lesson) throw new Error('Leccion no encontrada');

  // 💾 NUEVO v4.0: Guardar checkpoint ANTES de procesar
  await saveCheckpoint(session);

  try {
    // 1. Guardar mensaje del estudiante
    await addChatMessage(session.id, {
      role: 'user',
      content: studentResponse,
      message_type: 'RESPONSE',
    });

    const plan = getMomentPlan(lesson, session.currentMomento);
    const progress = ensureMomentProgress(session, plan.momentId);

    if (!progress) {
      throw new Error('No se pudo obtener el progreso del momento');
    }

      const chatHistory = Array.isArray(session.chatHistory) ? session.chatHistory : [];
      const lastQuestion = chatHistory
        .slice()
        .reverse()
        .find((msg: any) => msg.message_type === 'QUESTIONING');
    
      const currentQuestion = (lastQuestion as any)?.content || plan.guidingQuestion || plan.activity;
    
      // 2. MODERATION API v3.5.0 - Filtro de contenido severo (gratis, rápido)
      const moderationCheck = await checkModeration(studentResponse);
    
      if (moderationCheck.flagged) {
        console.log('[Orchestrator] 🚫 Contenido inapropiado detectado:', moderationCheck.categories);
    
        await addChatMessage(session.id, {
          role: 'assistant',
          content: 'No puedo ayudarte con ese tipo de contenido. Por favor, enfoquémonos en la lección.',
          message_type: 'CORRECTING',
          metadata: {
            momento_id: plan.momentId,
            source: 'moderation_api_blocked',
            categories: moderationCheck.categories,
          },
        });
    
        await updateSession(session.id, {
          current_state: 'WAITING_RESPONSE',
        });
    
        return; // Detener procesamiento
      }
    
      // 3. CHECKER v3.0 - Clasificar tipo de mensaje (solo si pasó moderación)
      const checkerResponse = await runCheckerAgent({
        question: currentQuestion,
        student_message: studentResponse,
        objective: lesson.objetivo,
      });
      const sessionMetadata = session.metadata && typeof session.metadata === 'object' ? session.metadata : {};

      await updateSession(session.id, {
        current_state: 'EVALUATING',
        progress: {
          ...sessionMetadata,
          momento_progress: (sessionMetadata as any).momento_progress,
        },
      });
    
      const { message_type, detected_question, redirect_message } = checkerResponse;
    
      const filteredImages = filterImagesByMoment((lesson.imagenes as any) || [], plan.momentId);
      const flexibilityBonus = calculateFlexibilityBonus(session);
    
      // 4. RUTEAR según tipo de mensaje (Checker clasifica contexto educativo)
      if (message_type === 'off_topic') {
        // OFF-TOPIC → Mostrar mensaje de redirección del Checker v3.1
        const finalMessage = redirect_message || `Entiendo que puedas tener otras dudas, pero enfoquémonos en la actividad de aprendizaje. Volvamos a la pregunta sobre ${lesson.objetivo.toLowerCase()}.`;
    
        await addChatMessage(session.id, {
          role: 'assistant',
          content: finalMessage,
          message_type: 'CORRECTING',
          metadata: {
            momento_id: plan.momentId,
            source: 'checker_off_topic_redirect'
          }
        });
    
        await updateSession(session.id, {
          current_state: 'WAITING_RESPONSE',
        });
    
      } else if (message_type === 'no_se') {
        // NO SÉ → Usar Evaluator con acción 'hint' para scaffold contextual
        progress.attempts = Math.min((progress.attempts || 0) + 1, progress.max_attempts || 3);
        await updateSession(session.id, {
          progress: {
            ...sessionMetadata,
            momento_progress: (sessionMetadata as any).momento_progress,
          },
        });
    
        // Obtener TODOS los mensajes del momento actual para acumular evidencias
        const sessionChatHistory = Array.isArray(session.chatHistory) ? session.chatHistory : [];
        const firstQuestioningIndex = sessionChatHistory.findIndex(
          (msg: any) => msg.message_type === 'QUESTIONING' && msg.metadata?.momento_id === plan.momentId
        );

        const currentMomentoMessages = firstQuestioningIndex >= 0
          ? sessionChatHistory.slice(firstQuestioningIndex)
          : sessionChatHistory.slice(-10);

        // DEBUG: Log del historial enviado al Evaluator (caso NO SÉ)
        console.log('\n🔍 [EVALUATOR DEBUG - NO SÉ] Momento:', plan.momentId);
        console.log('📊 Total mensajes en sesión:', sessionChatHistory.length);
        console.log('📌 Índice primer QUESTIONING:', firstQuestioningIndex);
        console.log('📨 Mensajes enviados al Evaluator:', currentMomentoMessages.length);
    
        const evaluatorResponse = await runEvaluatorAgentWithEmbeddings({
          objective: lesson.objetivo,
          momento_id: plan.momentId,
          question: currentQuestion,
          expected_evidences: plan.evidences,
          expected_answers: plan.expected_answers, // v3.2.0: Respuestas específicas
          student_answer: studentResponse, // "no sé" se procesa como respuesta
          attempt_number: progress.attempts,
          chat_history: currentMomentoMessages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
          images: filteredImages,
          flexibility_bonus: flexibilityBonus,
        });
    
        const { message, missing_concepts } = evaluatorResponse;
    
        await addChatMessage(session.id, {
          role: 'assistant',
          content: message,
          message_type: 'SCAFFOLDING',
          metadata: {
            momento_id: plan.momentId,
            source: 'evaluator_no_se_scaffold'
          }
        });
    
        // Generar pregunta basada en evidencias faltantes (con ayuda gradual)
        const nextQuestion = generateNextQuestionFromMissingEvidence(
          missing_concepts,
          plan.guidingQuestion,
          progress.attempts // Ayuda gradual según intento
        );
    
        if (nextQuestion) {
          await addChatMessage(session.id, {
            role: 'assistant',
            content: nextQuestion,
            message_type: 'QUESTIONING',
            metadata: {
              momento_id: plan.momentId,
              source: 'orchestrator_followup_question'
            }
          });
        }
    
        await updateSession(session.id, {
          current_state: 'WAITING_RESPONSE',
        });
    
      } else if (message_type === 'question_brief' || message_type === 'question_deep') {
        // PREGUNTA → Tutor explica
        const tutorResponse = await runTutorAgent({
          objective: lesson.objetivo,
          momento_id: plan.momentId,
          student_question: detected_question || studentResponse,
          current_activity: plan.activity,
          current_question: currentQuestion, // Para redirect contextual
          question_type: message_type === 'question_brief' ? 'brief' : 'deep',
          chat_history: (Array.isArray(session.chatHistory) ? session.chatHistory : []).slice(-3).map((msg: any) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
          images: filteredImages,
        });
    
        const fullMessage = `${tutorResponse.explanation}\n\n${tutorResponse.redirect_message}`;
    
        await addChatMessage(session.id, {
          role: 'assistant',
          content: fullMessage,
          message_type: 'EXPLAINING',
          metadata: {
            momento_id: plan.momentId,
            source: 'tutor_explanation'
          }
        });
    
        await updateSession(session.id, {
          current_state: 'WAITING_RESPONSE',
        });
    
      } else if (message_type === 'answer') {
        // RESPUESTA → Evaluator evalúa
        progress.attempts = Math.min((progress.attempts || 0) + 1, progress.max_attempts || 3);
        await updateSession(session.id, {
          progress: {
            ...sessionMetadata,
            momento_progress: (sessionMetadata as any).momento_progress,
          },
        });
    
        // Obtener TODOS los mensajes del momento actual para acumular evidencias
        // Encuentra el índice del primer mensaje QUESTIONING de este momento
        const answerChatHistory = Array.isArray(session.chatHistory) ? session.chatHistory : [];
        const firstQuestioningIndex = answerChatHistory.findIndex(
          (msg: any) => msg.message_type === 'QUESTIONING' && msg.metadata?.momento_id === plan.momentId
        );

        // Si encontramos el inicio del momento, toma TODOS los mensajes desde ahí
        const currentMomentoMessages = firstQuestioningIndex >= 0
          ? answerChatHistory.slice(firstQuestioningIndex)
          : answerChatHistory.slice(-10); // Fallback: últimos 10 mensajes

        // DEBUG: Log del historial enviado al Evaluator
        console.log('\n🔍 [EVALUATOR DEBUG] Momento:', plan.momentId);
        console.log('📊 Total mensajes en sesión:', answerChatHistory.length);
        console.log('📌 Índice primer QUESTIONING:', firstQuestioningIndex);
        console.log('📨 Mensajes enviados al Evaluator:', currentMomentoMessages.length);
        console.log('📝 Contenido enviado:');
        currentMomentoMessages.forEach((msg, idx) => {
          console.log(`  ${idx}: [${msg.role}] ${msg.message_type || 'user'}: "${msg.content.substring(0, 80)}..."`);
        });
    
        const evaluatorResponse = await runEvaluatorAgentWithEmbeddings({
          objective: lesson.objetivo,
          momento_id: plan.momentId,
          question: currentQuestion,
          expected_evidences: plan.evidences,
          expected_answers: plan.expected_answers, // v3.2.0: Respuestas específicas
          student_answer: studentResponse,
          attempt_number: progress.attempts,
          chat_history: currentMomentoMessages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
          images: filteredImages,
          flexibility_bonus: flexibilityBonus,
        });
    
        const { level, action, message, missing_concepts } = evaluatorResponse;
    
        // Mostrar mensaje del Evaluator
        await addChatMessage(session.id, {
          role: 'assistant',
          content: message,
          message_type: action === 'praise' ? 'PRAISING' : 'CORRECTING',
          metadata: {
            momento_id: plan.momentId,
            source: 'evaluator_feedback'
          }
        });
    
        if (level === 'correct') {
          // CORRECT → Avanzar al siguiente momento
          progress.attempts = 0;
          progress.completed_at = new Date().toISOString();
          await updateSession(session.id, {
            progress: {
              ...sessionMetadata,
              momento_progress: (sessionMetadata as any).momento_progress,
            },
          });
    
          const refreshedSession = await getSessionById(sessionId);
          if (refreshedSession) {
            await transitionToNextMoment(refreshedSession, lesson);
          }
    
        } else if (action === 'encourage' || action === 'guide') {
          // PARTIAL o INCORRECT → Verificar límite de intentos v3.5.4
          const MAX_ATTEMPTS = 3; // Mismo para TODOS los momentos
          const currentEvidenceKey = missing_concepts[0]; // Primera evidencia faltante

          // Get metadata object
          const metadata = session.metadata && typeof session.metadata === 'object' ? session.metadata : {};

          // Inicializar tracking de intentos por evidencia si no existe
          if (!(metadata as any).evidence_attempts) {
            (metadata as any).evidence_attempts = {};
          }

          if (!(metadata as any).evidence_attempts[currentEvidenceKey]) {
            (metadata as any).evidence_attempts[currentEvidenceKey] = {
              attempt_count: 0,
              best_score: 0,
              student_responses: [],
            };
          }

          const evidenceAttempt = (metadata as any).evidence_attempts[currentEvidenceKey];
          evidenceAttempt.attempt_count += 1;
          evidenceAttempt.student_responses.push(studentResponse);
    
          // Actualizar mejor score (del evaluatorResponse.evidence_scores)
          const currentScore = evaluatorResponse.evidence_scores?.find(
            s => s.evidence === currentEvidenceKey
          )?.score || 0;
          evidenceAttempt.best_score = Math.max(evidenceAttempt.best_score, currentScore);
    
          console.log(`\n🔄 [LÍMITE DE INTENTOS] Evidencia: "${currentEvidenceKey}"`);
          console.log(`   Intento: ${evidenceAttempt.attempt_count}/${MAX_ATTEMPTS}`);
          console.log(`   Mejor score: ${evidenceAttempt.best_score}/100`);
    
          if (evidenceAttempt.attempt_count >= MAX_ATTEMPTS) {
            // ✅ LÍMITE ALCANZADO → Aceptar mejor respuesta y pasar a siguiente evidencia
            console.log(`   ✅ Límite alcanzado - Aceptando mejor respuesta y avanzando`);
    
            evidenceAttempt.status = 'accepted_partial';
            evidenceAttempt.final_score = evidenceAttempt.best_score;
    
            await updateSession(session.id, {
              progress: {
                ...sessionMetadata,
                evidence_attempts: (sessionMetadata as any).evidence_attempts,
                momento_progress: (sessionMetadata as any).momento_progress,
              },
            });
    
            // Remover evidencia actual de missing_concepts
            const remainingConcepts = missing_concepts.slice(1);
    
            if (remainingConcepts.length > 0) {
              // Hay más evidencias → Pasar a la siguiente
              console.log(`   ➡️  Pasando a siguiente evidencia: "${remainingConcepts[0]}"`);
    
              await addChatMessage(session.id, {
                role: 'assistant',
                content: 'Entiendo. Continuemos con el siguiente punto.',
                message_type: 'TRANSITIONING',
                metadata: {
                  momento_id: plan.momentId,
                  source: 'evidence_limit_reached',
                },
              });
    
              const nextQuestion = generateNextQuestionFromMissingEvidence(
                remainingConcepts,
                plan.guidingQuestion,
                1 // Reset intentos para nueva evidencia
              );
    
              if (nextQuestion) {
                await addChatMessage(session.id, {
                  role: 'assistant',
                  content: nextQuestion,
                  message_type: 'QUESTIONING',
                  metadata: {
                    momento_id: plan.momentId,
                    source: 'orchestrator_next_evidence_question',
                  },
                });
              }
    
              await updateSession(session.id, {
                current_state: 'WAITING_RESPONSE',
              });
    
            } else {
              // No hay más evidencias → Transicionar a siguiente momento
              console.log(`   ✅ Todas las evidencias procesadas - Transicionando a siguiente momento`);
    
              await addChatMessage(session.id, {
                role: 'assistant',
                content: 'Muy bien, has trabajado en los puntos principales. Pasemos a la siguiente etapa.',
                message_type: 'TRANSITIONING',
                metadata: {
                  momento_id: plan.momentId,
                  source: 'all_evidences_processed',
                },
              });
    
              progress.attempts = 0;
              progress.completed_at = new Date().toISOString();
              await updateSession(session.id, {
                progress: {
                  ...sessionMetadata,
                  momento_progress: (sessionMetadata as any).momento_progress,
                },
              });
    
              const refreshedSession = await getSessionById(sessionId);
              if (refreshedSession) {
                await transitionToNextMoment(refreshedSession, lesson);
              }
            }
    
          } else {
            // ❌ Todavía hay intentos → Seguir preguntando con ayuda gradual
            console.log(`   🔄 Generando nueva pregunta con ayuda nivel ${evidenceAttempt.attempt_count}`);
    
            await updateSession(session.id, {
              progress: {
                ...sessionMetadata,
                evidence_attempts: (sessionMetadata as any).evidence_attempts,
                momento_progress: (sessionMetadata as any).momento_progress,
              },
            });
    
            const nextQuestion = generateNextQuestionFromMissingEvidence(
              missing_concepts,
              plan.guidingQuestion,
              evidenceAttempt.attempt_count // Ayuda gradual según intento de ESTA evidencia
            );
    
            if (nextQuestion) {
              await addChatMessage(session.id, {
                role: 'assistant',
                content: nextQuestion,
                message_type: 'QUESTIONING',
                metadata: {
                  momento_id: plan.momentId,
                  source: 'orchestrator_followup_question',
                },
              });
            }
    
            await updateSession(session.id, {
              current_state: 'WAITING_RESPONSE',
            });
          }
    
        } else {
          // Fallback: esperar respuesta
          await updateSession(session.id, {
            current_state: 'WAITING_RESPONSE',
          });
        }
      }

    // ✅ Si todo salió bien, resetear contador de errores
    await resetErrorCount(sessionId);

  } catch (error: any) {
    // 🚨 ERROR: Revertir al último checkpoint
    console.error('\n🚨 [ERROR] Fallo al procesar respuesta del estudiante:', error);

    const errorType = error.message?.includes('timeout') ? 'llm_timeout'
      : error.message?.includes('agent') ? 'agent_failure'
      : error.message?.includes('state') ? 'invalid_state'
      : 'unknown';

    await rollbackToCheckpoint(sessionId, error.message || 'Error desconocido', errorType);

    // Re-lanzar el error para que el API lo maneje
    throw new Error(`Error al procesar respuesta: ${error.message}. La sesión ha sido revertida al estado anterior.`);
  }
}

export async function handleChatMessage(
  sessionId: string,
  userMessage: string
): Promise<void> {
  const session = await getSessionById(sessionId);
  if (!session) throw new Error('Sesion no encontrada');

  if (session.currentState !== 'WAITING_RESPONSE') {
    throw new Error(`La sesion no esta esperando una respuesta (estado actual: ${session.currentState})`);
  }

  await processStudentResponse(sessionId, userMessage);
}
