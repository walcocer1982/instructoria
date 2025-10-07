// Tipos base del sistema SOPHI
// Sistema PedagÃ³gico HÃ­brido Inteligente

export type UserRole = 'profesor' | 'estudiante';

export interface User {
  id: string;
  nombre: string;
  email: string;
  password: string;
  rol: UserRole;
  created_at: string;
}

export interface ImageRef {
  id?: string;            // ID de la imagen
  url: string;
  descripcion: string;
  tipo: 'contexto' | 'ejemplo' | 'evidencia' | 'recurso';
  momento_id?: string; // M0, M1, M2, etc.
}

export interface SubMomento {
  id: string;  // M2.1, M2.2, etc.
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

  // NUEVO v3.2.0: Campos enriquecidos contextuales
  context_narrative?: string;
  expected_answers?: string[];
  key_elements?: string[];
}

export interface Momento {
  id: string; // M0, M1, M2, M3, M4, M5
  nombre: string;
  min: number;
  actividad: string;
  contexto?: string;          // Contexto/descripción del momento
  pregunta_guia?: string;     // Pregunta guía del momento
  evidencias: string[];
  actividad_detallada?: ActividadDetallada;
  recursos_sugeridos?: RecursoSugerido[];
  preguntas_clave?: string[];

  // NUEVO v2.4.0: Sub-momentos opcionales
  sub_momentos?: SubMomento[];

  // NUEVO v3.2.0: Campos enriquecidos contextuales
  context_narrative?: string;    // Narrativa contextual basada en imagen
  expected_answers?: string[];   // Respuestas esperadas específicas
  key_elements?: string[];       // Elementos clave identificados
}

export interface ActividadDetallada {
  tipo: 'analisis_caso' | 'resolucion_problema' | 'mapa_conceptual' | 'discusion_guiada' | 'experimento_mental' | 'creacion_producto' | 'investigacion' | 'practica_ejercicios';
  titulo: string;
  descripcion: string;
  instrucciones?: string[];
  duracion_estimada?: number;
  evidencias_esperadas?: string[];
  criterios_exito?: string[];
  pregunta_inicial_sugerida?: string;
  recursos_necesarios?: {
    imagen_principal?: string;
    descripcion?: string;
    proposito?: string;
  };
}

export interface RecursoSugerido {
  tipo: 'diagrama' | 'infografia' | 'fotografia' | 'esquema_proceso' | 'ejemplo_visual' | 'grafico_comparativo' | 'mapa_conceptual' | 'timeline' | 'video' | 'animacion';
  descripcion: string;
  proposito: string;
  prioridad: 'alta' | 'media' | 'baja';
}

export interface Lesson {
  id: string;
  profesor_id: string;
  titulo: string;
  objetivo: string;
  duracion_min: number;
  momentos: Momento[];
  imagenes: ImageRef[];
  criterios_evaluacion: string[];
  created_at: string;
  updated_at: string;
  publicada: boolean;
  agent_outputs?: {
    planner?: any;
    activities?: any;
    resources?: any;
    antiPlagiarism?: any;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  images?: ImageRef[];
  metadata?: {
    message_type?: 'INTRODUCING' | 'EXPOSING' | 'QUESTIONING' | 'PRAISING' | 'CORRECTING' | 'HINTING' | 'EXPLAINING' | 'EXPLAINING_BRIEF' | 'VERIFYING' | 'CLARIFYING';
    question_id?: string;
    attempt_count?: number;
    hint_level?: number;
    evaluation?: any;
  };
}

export interface EvidenceAttempt {
  attempt_count: number;
  best_score: number;
  student_responses: string[];
  status?: 'pending' | 'accepted_partial' | 'completed';
  final_score?: number;
}

export interface StudentSession {
  id: string;
  student_id: string;
  lesson_id: string;
  momento_actual: string; // M0, M1, etc.
  momentos_completed: string[];
  chat_history: ChatMessage[];
  current_state?: string;
  current_question?: any;
  momento_progress?: Record<string, any>;
  evaluations?: any[];
  evidence_attempts?: Record<string, EvidenceAttempt>; // v3.5.4: Tracking de intentos por evidencia
  started_at: string;
  updated_at: string;
  completed: boolean;
}

// Tipos para LLM
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}


export * from './lessonPlan';
export * from './evaluator';
