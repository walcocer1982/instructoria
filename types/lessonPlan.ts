export type StudentMessageType = 'RESPONSE' | 'QUESTION';

/**
 * Sub-momento dentro de un momento pedagógico (v2.4.0)
 */
export interface SubMomentPlan {
  id: string;                   // M2.1, M2.2, M2.3, etc.
  nombre: string;
  min: number;
  actividad: string;
  evidencias: string[];
  pregunta_guia?: string;
  imagenes?: Array<{
    url: string;
    descripcion: string;
    tipo?: 'contexto' | 'ejemplo' | 'diagrama' | 'recurso';
  }>;

  // NUEVO v3.2.0: Enriquecimiento contextual
  context_narrative?: string;
  expected_answers?: string[];
  key_elements?: string[];
}

export interface LessonMomentPlan {
  momentId: string;
  activity: string;
  contexto?: string;          // Contexto del momento (descripción/instrucciones)
  imageId?: string;
  imageDescription?: string;
  evidences: string[];
  guidingQuestion: string;
  originalGuidingQuestion?: string;
  instructions?: string[];
  successCriteria?: string[];

  // NUEVO v2.4.0: Sub-momentos opcionales
  subMoments?: SubMomentPlan[];

  // NUEVO v3.2.0: Enriquecimiento contextual
  context_narrative?: string;    // Narrativa contextual basada en imagen
  expected_answers?: string[];   // Respuestas esperadas específicas
  key_elements?: string[];       // Elementos clave identificados
}

export interface MomentState {
  momentId: string;
  attempts: number;
  maxAttempts: number;
}

export interface StudentMessage {
  type: StudentMessageType;
  text: string;
  timestamp?: string;
}