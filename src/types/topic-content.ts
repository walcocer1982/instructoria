// ========================================
// ESTRUCTURA DEL CONTENIDO DE UN TEMA
// ========================================

export interface TopicContent {
  topic: {
    id: string
    title: string
    learning_objective: string
    expected_learning: string
    key_points: string[]

    // Opción 1: Con clases (temas largos)
    classes?: Class[]

    // Opción 2: Sin clases (temas cortos)
    moments?: Moment[]
  }
}

export interface Class {
  id: string
  title: string
  order: number
  learning_objective?: string
  expected_learning?: string
  key_points?: string[]
  moments: Moment[]
}

export interface Moment {
  id: string
  title: string
  order: number
  description?: string
  activities: Activity[]
}

export interface Activity {
  id: string
  type: ActivityType

  // NUEVO: Complejidad para ajustar maxTokens dinámicamente
  complexity?: 'simple' | 'moderate' | 'complex'

  // Fase de enseñanza
  teaching: TeachingPhase

  // Fase de verificación
  verification: VerificationPhase

  // Evidencia del estudiante (OPCIONAL - para compatibilidad)
  student_evidence?: StudentEvidence

  // Manejo de preguntas (DEPRECADO - la app lo maneja automáticamente)
  student_questions?: StudentQuestionsConfig

  // Guardrails (DEPRECADO - moderateContent lo maneja)
  guardrails?: GuardrailsConfig

  // Metadata
  metadata?: ActivityMetadata
}

// ========================================
// TIPOS DE ACTIVIDADES
// ========================================

export type ActivityType =
  | "explanation"       // Instructor explica un concepto
  | "exercise"          // Ejercicio práctico simple
  | "challenge"         // Desafío más complejo
  | "quiz"              // Preguntas de evaluación
  | "project"           // Proyecto integrador
  | "discussion"        // Discusión reflexiva
  | "case_study"        // Análisis de caso

// ========================================
// FASE DE ENSEÑANZA
// ========================================

export interface TeachingPhase {
  agent_instruction: string

  // NUEVO: Extensión objetivo para el mensaje del instructor
  target_length?: string  // Ej: "150-300 palabras"

  // NUEVO: Contexto adicional para generar ejemplos
  context?: string  // Ej: "Sector: construcción. País: Perú"

  // OPCIONAL: El IA puede generar sus propios conceptos y ejemplos
  key_concepts?: string[]
  examples?: string[]

  image?: {
    url: string
    description: string
  }
}

// ========================================
// FASE DE VERIFICACIÓN
// ========================================

export interface VerificationPhase {
  method?: "conversational" | "quiz" | "document_review"

  // SIMPLIFICADO: Solo la pregunta de verificación
  initial_question?: string  // Para compatibilidad
  question?: string          // Nuevo nombre más simple

  // DEPRECADO: La app analiza automáticamente con analyzeStudentResponse
  success_criteria?: {
    must_include: string[]
    understanding_level: UnderstandingLevel
    min_completeness: number // 0-100%
  }

  // DEPRECADO: La app maneja las repreguntas automáticamente
  reprompt_strategy?: RepromptStrategy

  follow_up_questions?: FollowUpQuestion[]
}

export type UnderstandingLevel =
  | "memorized"    // Solo recuerda la definición
  | "understood"   // Entiende el concepto
  | "applied"      // Puede aplicarlo a ejemplos
  | "analyzed"     // Puede analizar casos complejos

export interface RepromptStrategy {
  if_incomplete: string[]
  if_memorized_only: string[]
  if_incorrect: string[]
  hints: string[]
}

export interface FollowUpQuestion {
  trigger: string
  question: string
  optional: boolean
}

// ========================================
// EVIDENCIA DEL ESTUDIANTE
// ========================================

export interface StudentEvidence {
  type: EvidenceType
  description: string

  captured_data: {
    conversation_transcript: boolean
    key_insights: boolean
    attempts_count: boolean
    understanding_level: boolean
  }
}

export type EvidenceType =
  | "conversational_assessment"
  | "verbal_response"
  | "text_list"
  | "calculation"
  | "table_completion"
  | "document_submission"
  | "quiz_responses"
  | "file_upload"

// ========================================
// MANEJO DE PREGUNTAS DEL ESTUDIANTE
// ========================================

export interface StudentQuestionsConfig {
  allowed: boolean

  scope: {
    current_activity: boolean
    current_moment: boolean
    current_topic: boolean
    related_topics: boolean
    off_topic: boolean
  }

  out_of_scope_strategy: {
    acknowledge: boolean
    brief_answer: boolean
    redirect: boolean
    response_templates: {
      related_but_future_topic: string
      related_but_different_course: string
      tangentially_related: string
      completely_off_topic: string
    }
  }

  expected_question_types: QuestionType[]
}

export type QuestionType =
  | "clarification"
  | "example_request"
  | "application"
  | "why_question"
  | "comparison"
  | "procedure"

// ========================================
// GUARDRAILS
// ========================================

export interface GuardrailsConfig {
  prohibited_topics: ProhibitedTopic[]

  response_on_violation: {
    template: string
    log_incident: boolean
    escalate_after: number
  }

  tone_requirements: {
    professional: boolean
    respectful: boolean
    encouraging: boolean
    no_judgment: boolean
  }
}

export type ProhibitedTopic =
  | "sexual_content"
  | "violence"
  | "illegal_activities"
  | "personal_attacks"
  | "political_opinions"
  | "religious_proselytism"
  | "commercial_promotion"

// ========================================
// METADATA
// ========================================

export interface ActivityMetadata {
  estimated_minutes?: number
  difficulty?: "easy" | "medium" | "hard"
  max_reprompts?: number
  allow_skip?: boolean
  required_for_completion?: boolean
}

// ========================================
// RESULTADOS DE ANÁLISIS
// ========================================

export interface VerificationResult {
  criteria_met: number[]
  criteria_missing: number[]
  completeness_percentage: number
  understanding_level: UnderstandingLevel
  needs_reprompt: boolean
  suggested_reprompt_type: "incomplete" | "memorized_only" | "incorrect" | "correct"
  key_insights: string[]
  ready_to_advance: boolean
}

export interface ModerationResult {
  is_safe: boolean
  violations: string[]
  severity: "none" | "low" | "medium" | "high"
  requires_intervention: boolean
}

export interface IntentClassification {
  intent: "answer_verification" | "ask_question" | "request_clarification" | "off_topic" | "small_talk"
  question_type: QuestionType | null
  is_on_topic: boolean
  relevance_score: number
  topic_mentioned: string | null
  needs_redirect: boolean
  suggested_response_strategy: "full_answer" | "brief_redirect" | "firm_redirect" | "acknowledge_answer"
}
