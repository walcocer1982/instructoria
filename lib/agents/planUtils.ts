import { LessonMomentPlan, MomentState } from '@/types/lessonPlan';
import { ImageRef, Momento } from '@/types';

const DEFAULT_MAX_ATTEMPTS = 3;

function normalizeText(value?: string | null): string {
  if (!value) {
    return '';
  }
  return value.replace(/\s+/g, ' ').trim();
}

function pickMoment(lessonJson: any, momentId: string): Momento {
  if (!lessonJson?.momentos || !Array.isArray(lessonJson.momentos)) {
    throw new Error('Lesson JSON does not contain momentos array');
  }
  const moment = lessonJson.momentos.find((item: Momento) => item.id === momentId);
  if (!moment) {
    throw new Error(`Moment ${momentId} not found in lesson`);
  }
  return moment;
}

function pickImageForMoment(images: ImageRef[] | undefined, momentId: string): ImageRef | undefined {
  if (!images || images.length === 0) {
    return undefined;
  }
  const strictMatch = images.find((img) => img.momento_id === momentId);
  if (strictMatch) {
    return strictMatch;
  }
  const contextCandidates = images.filter((img) => !img.momento_id && (img.tipo === 'contexto' || img.tipo === 'ejemplo'));
  return contextCandidates[0] ?? images[0];
}

function ensureEvidenceSentence(raw: string): string {
  const trimmed = normalizeText(raw);
  if (!trimmed) {
    return '';
  }
  const hasEndingPunctuation = /[.!?]$/.test(trimmed);
  return hasEndingPunctuation ? trimmed : `${trimmed}.`;
}

function deriveEvidences(moment: Momento, fallbackActivity: string): string[] {
  const detailedEvidences = moment.actividad_detallada?.evidencias_esperadas;
  const rawList = Array.isArray(detailedEvidences) && detailedEvidences.length > 0
    ? detailedEvidences
    : Array.isArray(moment.evidencias)
      ? moment.evidencias
      : [];
  const normalized = rawList
    .map((item) => ensureEvidenceSentence(item))
    .filter((item) => item.length > 0);
  if (normalized.length > 0) {
    return normalized;
  }
  const activityEvidence = normalizeText(fallbackActivity);
  return activityEvidence ? [ensureEvidenceSentence(activityEvidence)] : [];
}

function buildGuidingQuestion(plan: LessonMomentPlan, baseQuestion?: string): string {
  const normalizedBase = normalizeText(baseQuestion);

  // Si hay pregunta base, usarla directamente
  if (normalizedBase) {
    return normalizedBase.endsWith('?') ? normalizedBase : `${normalizedBase}?`;
  }

  // Fallback: construir pregunta simple basada en la actividad
  const activity = plan.activity || 'realizar la actividad';
  const question = `¿Qué observas en esta situación relacionada con ${activity.toLowerCase()}?`;

  return question;
}

export function loadMoment(lessonJson: any, momentId: string): LessonMomentPlan {
  const moment = pickMoment(lessonJson, momentId);
  const image = pickImageForMoment(lessonJson?.imagenes, momentId);

  // Planner v4.0: campos simplificados
  const contexto = normalizeText(moment.contexto || '');
  const preguntaGuia = normalizeText(moment.pregunta_guia);
  const rawEvidences = Array.isArray(moment.evidencias) && moment.evidencias.length > 0
    ? moment.evidencias.map((e: string) => normalizeText(e)).filter((e: string) => e.length > 0)
    : [];

  // Fallback para lecciones viejas
  const activity = normalizeText(moment.actividad || moment.contexto);
  const instructions = moment.actividad_detallada?.instrucciones?.map((step: string) => normalizeText(step)).filter((step: string) => step.length > 0);
  const successCriteria = moment.actividad_detallada?.criterios_exito?.map((criterion: string) => normalizeText(criterion)).filter((criterion: string) => criterion.length > 0);

  // Determinar evidencias
  const evidences = rawEvidences.length > 0 ? rawEvidences : deriveEvidences(moment, activity);

  // Construir pregunta guía
  const guidingQuestion = preguntaGuia || buildGuidingQuestion({
    momentId,
    activity,
    imageDescription: normalizeText(image?.descripcion),
    evidences,
  } as any, preguntaGuia);

  // NUEVO v2.4.0: Cargar sub-momentos si existen
  const subMoments = moment.sub_momentos?.map((subMom: any) => ({
    id: subMom.id,
    nombre: normalizeText(subMom.nombre),
    min: subMom.min,
    actividad: normalizeText(subMom.actividad),
    evidencias: Array.isArray(subMom.evidencias)
      ? subMom.evidencias.map((e: string) => normalizeText(e)).filter((e: string) => e.length > 0)
      : [],
    pregunta_guia: normalizeText(subMom.pregunta_guia),
    imagenes: subMom.imagenes?.map((img: any) => ({
      url: img.url,
      descripcion: normalizeText(img.descripcion),
      tipo: img.tipo,
    })),
    // NUEVO v3.2.0: Campos enriquecidos en sub-momentos
    context_narrative: normalizeText(subMom.context_narrative),
    expected_answers: Array.isArray(subMom.expected_answers)
      ? subMom.expected_answers.map((ans: string) => normalizeText(ans)).filter((ans: string) => ans.length > 0)
      : undefined,
    key_elements: Array.isArray(subMom.key_elements)
      ? subMom.key_elements.map((elem: string) => normalizeText(elem)).filter((elem: string) => elem.length > 0)
      : undefined,
  }));

  const plan: LessonMomentPlan = {
    momentId,
    activity,
    imageId: image?.id,
    imageDescription: normalizeText(image?.descripcion),
    contexto,
    evidences,
    guidingQuestion,
    originalGuidingQuestion: preguntaGuia,
    instructions,
    successCriteria,
    subMoments,  // NUEVO v2.4.0

    // NUEVO v3.2.0: Campos enriquecidos contextuales
    context_narrative: normalizeText(moment.context_narrative),
    expected_answers: Array.isArray(moment.expected_answers)
      ? moment.expected_answers.map((ans: string) => normalizeText(ans)).filter((ans: string) => ans.length > 0)
      : undefined,
    key_elements: Array.isArray(moment.key_elements)
      ? moment.key_elements.map((elem: string) => normalizeText(elem)).filter((elem: string) => elem.length > 0)
      : undefined,
  };

  return plan;
}

export function extractEvidences(plan: LessonMomentPlan): string[] {
  return plan.evidences.slice();
}

export function generateGuidingQuestion(plan: LessonMomentPlan): string {
  return buildGuidingQuestion(plan, plan.originalGuidingQuestion);
}

export function initializeMomentState(momentId: string, maxAttempts: number = DEFAULT_MAX_ATTEMPTS): MomentState {
  return {
    momentId,
    attempts: 0,
    maxAttempts,
  };
}

/**
 * Carga un sub-momento específico de un momento
 * NUEVO v2.4.0
 *
 * @param plan - Plan del momento padre
 * @param subMomentIndex - Índice del sub-momento (0, 1, 2...)
 * @returns Plan adaptado para el sub-momento o null si no existe
 */
export function loadSubMoment(plan: LessonMomentPlan, subMomentIndex: number): LessonMomentPlan | null {
  if (!plan.subMoments || subMomentIndex >= plan.subMoments.length) {
    return null;
  }

  const subMom = plan.subMoments[subMomentIndex];

  // Crear un plan adaptado para el sub-momento
  return {
    momentId: subMom.id,  // M2.1, M2.2, etc.
    activity: subMom.actividad,
    evidences: subMom.evidencias,
    guidingQuestion: subMom.pregunta_guia || buildGuidingQuestion({
      momentId: subMom.id,
      activity: subMom.actividad,
      evidences: subMom.evidencias,
    } as any),
    originalGuidingQuestion: subMom.pregunta_guia,
    contexto: plan.contexto,  // Hereda contexto del padre
    imageId: subMom.imagenes?.[0]?.url,  // Primera imagen del sub-momento
    imageDescription: subMom.imagenes?.[0]?.descripcion,
    instructions: plan.instructions,  // Hereda instrucciones generales
    successCriteria: plan.successCriteria,  // Hereda criterios
    subMoments: plan.subMoments,  // Mantiene referencia a todos los sub-momentos

    // NUEVO v3.2.0: Campos enriquecidos del sub-momento
    context_narrative: subMom.context_narrative,
    expected_answers: subMom.expected_answers,
    key_elements: subMom.key_elements,
  };
}

