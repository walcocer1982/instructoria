/**
 * Módulo de Sesiones de Estudiante
 * Sistema SOPHI - Fase 3
 *
 * Gestiona el progreso de estudiantes en lecciones
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');

/**
 * Estados posibles del chat
 */
export type ChatState =
  | 'INTRODUCING'       // Bienvenida al momento
  | 'EXPOSING'          // Exponiendo contenido con imágenes
  | 'QUESTIONING'       // Tutor genera pregunta
  | 'WAITING_RESPONSE'  // Esperando respuesta del estudiante
  | 'EVALUATING'        // Checker evaluando respuesta
  | 'PRAISING'          // Retroalimentación positiva
  | 'CORRECTING'        // Retroalimentación correctiva
  | 'HINTING'           // Dando pista gradual
  | 'EXPLAINING'        // Explicación completa tras 3 intentos
  | 'EXPLAINING_BRIEF'  // Explicación breve cuando estudiante pregunta definición
  | 'EXPLAINING_DEEP'   // Explicación extensa y detallada (8-12 líneas)
  | 'SCAFFOLDING'       // Andamiaje "No Opt Out" cuando dice "no sé"
  | 'EXAMPLE'           // Mostrando ejemplo práctico
  | 'VERIFYING'         // Pregunta de verificación post-explicación
  | 'CLARIFYING'        // Solicitando clarificación de respuesta ambigua
  | 'TRANSITIONING'     // Transición entre preguntas o momentos
  | 'FINAL_EVALUATION'  // Evaluación final automática (Fase 3)
  | 'COMPLETED';        // Sesión completada

/**
 * Progreso en un momento específico
 */
export interface MomentoProgress {
  momento_id: string;           // M0, M1, M2, M3, M4, M5 o M2.1, M2.2, etc.
  started_at: string;
  completed_at?: string;
  attempts: number;             // Número de intentos en preguntas
  hints_used: number;           // Número de pistas usadas
  max_attempts: number;         // Máximo de intentos permitidos (default: 3)
  current_question_id?: string; // ID de la pregunta actual

  // NUEVO v2.4.0: Para sub-momentos
  parent_momento_id?: string;   // Si es M2.1, el parent es M2
  sub_momento_index?: number;   // Índice del sub-momento actual (0, 1, 2...)
}

/**
 * Mensaje del chat
 */
export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  message_type?: ChatState | 'RESPONSE';
  images?: Array<{
    url: string;
    descripcion: string;
  }>;
  metadata?: {
    question_id?: string;
    attempt_count?: number;
    hint_level?: number;
    evaluation?: 'correct' | 'partial' | 'incorrect';
    [key: string]: any;
  };
}

/**
 * Evaluación de un momento
 */
export interface MomentoEvaluation {
  momento_id: string;
  criterios_met: string[];      // Criterios cumplidos
  feedback: string;              // Retroalimentación del Checker
  score?: number;                // Puntaje opcional (0-100)
  evaluated_at: string;
}

/**
 * Evaluación final completa (Fase 5)
 */
export interface FinalEvaluation {
  id: string;
  timestamp: string;
  score: number;              // Score 0-100
  feedback: string;           // Feedback general
  passed: boolean;            // Si aprobó (>= 60)
  submitted_work?: string;    // Trabajo final enviado
  // Legacy fields (opcional para compatibilidad)
  overall_score?: number;
  rubric_scores?: Array<{
    criterion: string;
    score: number;
    feedback: string;
    level: 'excelente' | 'bueno' | 'satisfactorio' | 'necesita_mejorar';
  }>;
  strengths?: string[];
  areas_for_improvement?: string[];
  recommendations?: string[];
  general_feedback?: string;
}

/**
 * Sesión de un estudiante en una lección
 */
export interface StudentSession {
  id: string;
  student_id: string;
  lesson_id: string;
  started_at: string;
  updated_at: string;
  completed_at?: string;

  // Estado actual
  current_state: ChatState;
  current_momento: string;      // M0, M1, M2, M3, M4, M5
  current_question?: string;    // ID de pregunta actual

  // Progreso por momento
  momento_progress: MomentoProgress[];

  // Historial de chat
  chat_history: ChatMessage[];

  // Evaluaciones finales (Fase 5)
  evaluations: FinalEvaluation[];

  // Evaluaciones por momento (legacy/opcional)
  momento_evaluations?: MomentoEvaluation[];

  // NUEVO v3.5.4: Tracking de intentos por evidencia
  evidence_attempts?: Record<string, {
    attempt_count: number;
    best_score: number;
    student_responses: string[];
    status?: 'pending' | 'accepted_partial' | 'completed';
    final_score?: number;
  }>;

  // Perfil del estudiante para flexibilidad adaptativa (Opción 1)
  student_profile?: {
    nivel_inicial: 'principiante' | 'intermedio' | 'avanzado';
    necesita_mas_apoyo: boolean; // NEE, dislexia, etc. (manual del profesor)
  };

  // NUEVO v4.0: Sistema de recuperación de errores
  last_known_good_state?: {
    state: ChatState;
    momento_id: string;
    timestamp: string;
    chat_history_length: number;
    momento_progress: MomentoProgress[];
    evidence_attempts?: Record<string, {
      attempt_count: number;
      best_score: number;
      student_responses: string[];
      status?: 'pending' | 'accepted_partial' | 'completed';
      final_score?: number;
    }>;
  };
  error_count?: number;           // Contador de errores consecutivos
  is_recovering?: boolean;        // Flag de estado de recuperación
  last_error?: {
    timestamp: string;
    message: string;
    type: 'agent_failure' | 'llm_timeout' | 'invalid_state' | 'unknown';
  };

  // NUEVO v4.1: Reportes del estudiante
  student_reports?: Array<{
    id: string;
    timestamp: string;
    momento_id: string;
    student_message: string;
    context: {
      last_question: string;
      chat_history_length: number;
      error_count: number;
      attempts: number;
    };
    status: 'pending' | 'reviewed' | 'resolved';
    instructor_notes?: string;
    resolved_at?: string;
  }>;
}

/**
 * Crea el directorio de sesiones si no existe
 */
async function ensureSessionsDir() {
  try {
    await fs.access(SESSIONS_DIR);
  } catch {
    await fs.mkdir(SESSIONS_DIR, { recursive: true });
  }
}

/**
 * Genera un ID único para mensaje
 */
export function generateMessageId(): string {
  return `msg_${crypto.randomUUID()}`;
}

/**
 * Genera un ID único para pregunta
 */
export function generateQuestionId(): string {
  return `q_${crypto.randomUUID()}`;
}

/**
 * Calcula bonus de flexibilidad según perfil del estudiante (Opción 1)
 * @returns Número entre -20 (más exigente) y +30 (más flexible)
 */
export function calculateFlexibilityBonus(session: StudentSession): number {
  const profile = session.student_profile;

  // Si no hay perfil definido, usar nivel intermedio (0 bonus)
  if (!profile) return 0;

  let bonus = 0;

  // Bonus por nivel inicial
  switch (profile.nivel_inicial) {
    case 'principiante':
      bonus += 20; // Más flexible en todos los momentos
      break;
    case 'intermedio':
      bonus += 0; // Flexibilidad estándar
      break;
    case 'avanzado':
      bonus -= 20; // Más exigente
      break;
  }

  // Bonus adicional si necesita más apoyo (NEE, dislexia, etc.)
  if (profile.necesita_mas_apoyo) {
    bonus += 30; // Máxima flexibilidad
  }

  // Limitar entre -20% y +50% (máximo +50% para NEE)
  return Math.min(Math.max(bonus, -20), 50);
}

/**
 * Crea una nueva sesión de estudiante
 * TODOS EMPIEZAN COMO PRINCIPIANTES por defecto (máxima flexibilidad inicial)
 * @param nivel Nivel inicial del estudiante (por defecto: principiante)
 * @param necesitaMasApoyo Si requiere apoyo adicional/NEE (opcional)
 */
export async function createSession(
  studentId: string,
  lessonId: string,
  nivel: 'principiante' | 'intermedio' | 'avanzado' = 'principiante',
  necesitaMasApoyo: boolean = false
): Promise<StudentSession> {
  await ensureSessionsDir();

  const sessionId = `session_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const session: StudentSession = {
    id: sessionId,
    student_id: studentId,
    lesson_id: lessonId,
    started_at: now,
    updated_at: now,
    current_state: 'INTRODUCING',
    current_momento: 'M0',
    momento_progress: [
      {
        momento_id: 'M0',
        started_at: now,
        attempts: 0,
        hints_used: 0,
        max_attempts: 3,
      }
    ],
    chat_history: [],
    evaluations: [],
    student_profile: {
      nivel_inicial: nivel,
      necesita_mas_apoyo: necesitaMasApoyo,
    },
  };

  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

  return session;
}

/**
 * Obtiene una sesión por ID
 */
export async function getSessionById(sessionId: string): Promise<StudentSession | null> {
  try {
    const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    const data = await fs.readFile(sessionPath, 'utf-8');
    return JSON.parse(data) as StudentSession;
  } catch {
    return null;
  }
}

/**
 * Obtiene la sesión activa de un estudiante en una lección
 * Si no existe, retorna null (no crea automáticamente)
 */
export async function getActiveSession(
  studentId: string,
  lessonId: string
): Promise<StudentSession | null> {
  await ensureSessionsDir();

  try {
    const files = await fs.readdir(SESSIONS_DIR);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const sessionPath = path.join(SESSIONS_DIR, file);
        const data = await fs.readFile(sessionPath, 'utf-8');
        const session = JSON.parse(data) as StudentSession;

        if (
          session.student_id === studentId &&
          session.lesson_id === lessonId &&
          !session.completed_at
        ) {
          return session;
        }
      }
    }
  } catch (err) {
    console.error('Error reading sessions:', err);
  }

  return null;
}

/**
 * Obtiene todas las sesiones de un estudiante
 */
export async function getStudentSessions(studentId: string): Promise<StudentSession[]> {
  await ensureSessionsDir();
  const sessions: StudentSession[] = [];

  try {
    const files = await fs.readdir(SESSIONS_DIR);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const sessionPath = path.join(SESSIONS_DIR, file);
        const data = await fs.readFile(sessionPath, 'utf-8');
        const session = JSON.parse(data) as StudentSession;

        if (session.student_id === studentId) {
          sessions.push(session);
        }
      }
    }
  } catch (err) {
    console.error('Error reading student sessions:', err);
  }

  return sessions.sort((a, b) =>
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

/**
 * Actualiza una sesión
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<StudentSession>
): Promise<StudentSession | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const updatedSession: StudentSession = {
    ...session,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
  await fs.writeFile(sessionPath, JSON.stringify(updatedSession, null, 2));

  return updatedSession;
}

/**
 * Agrega un mensaje al historial de chat
 */
export async function addChatMessage(
  sessionId: string,
  message: Omit<ChatMessage, 'id' | 'timestamp'>
): Promise<StudentSession | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const newMessage: ChatMessage = {
    ...message,
    id: generateMessageId(),
    timestamp: new Date().toISOString(),
  };

  session.chat_history.push(newMessage);
  session.updated_at = new Date().toISOString();

  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

  return session;
}

/**
 * Avanza al siguiente momento
 */
export async function advanceToNextMomento(
  sessionId: string,
  nextMomentoId: string
): Promise<StudentSession | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const now = new Date().toISOString();

  // Marcar momento actual como completado
  const currentProgress = session.momento_progress.find(
    p => p.momento_id === session.current_momento
  );
  if (currentProgress && !currentProgress.completed_at) {
    currentProgress.completed_at = now;
  }

  // Crear progreso para nuevo momento
  if (!session.momento_progress.find(p => p.momento_id === nextMomentoId)) {
    session.momento_progress.push({
      momento_id: nextMomentoId,
      started_at: now,
      attempts: 0,
      hints_used: 0,
      max_attempts: 3,
    });
  }

  session.current_momento = nextMomentoId;
  session.current_state = 'INTRODUCING';
  session.updated_at = now;

  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

  return session;
}

/**
 * Agrega una evaluación final (Fase 5)
 */
export async function addFinalEvaluation(
  sessionId: string,
  evaluation: FinalEvaluation
): Promise<StudentSession | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  session.evaluations.push(evaluation);
  session.updated_at = new Date().toISOString();

  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

  return session;
}

/**
 * Agrega una evaluación de momento (legacy)
 */
export async function addMomentoEvaluation(
  sessionId: string,
  evaluation: MomentoEvaluation
): Promise<StudentSession | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  if (!session.momento_evaluations) {
    session.momento_evaluations = [];
  }

  session.momento_evaluations.push(evaluation);
  session.updated_at = new Date().toISOString();

  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

  return session;
}

/**
 * Marca una sesión como completada
 */
export async function completeSession(sessionId: string): Promise<StudentSession | null> {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const now = new Date().toISOString();

  // Completar momento actual si no está completado
  const currentProgress = session.momento_progress.find(
    p => p.momento_id === session.current_momento
  );
  if (currentProgress && !currentProgress.completed_at) {
    currentProgress.completed_at = now;
  }

  session.completed_at = now;
  session.updated_at = now;
  session.current_state = 'COMPLETED';

  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`);
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));

  return session;
}