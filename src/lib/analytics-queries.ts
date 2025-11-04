/**
 * Analytics Queries para Dashboard
 *
 * Contiene las 10 queries SQL principales para métricas de la primera experiencia
 * Basado en PLAN_SQL_ANALYTICS.md
 */

import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

export interface CompletionRateData {
  completed: number
  abandoned: number
  completion_rate_percent: number
}

export interface SessionDurationData {
  avg_duration_minutes: number | null
  min_duration_minutes: number | null
  max_duration_minutes: number | null
  completed_sessions: number
  active_sessions: number
}

export interface MessagesByStudentData {
  student_name: string
  email: string
  message_count: number
  avg_message_length: number
}

export interface ActivitiesProgressData {
  student_name: string
  email: string
  completed: number
  in_progress: number
  not_started: number
  overall_progress: number
}

export interface RetryRateData {
  activity_id: string
  avg_attempts: number
  total_students_attempted: number
  students_completed: number
}

export interface ProgressAverageData {
  avg_progress: number
  min_progress: number
  max_progress: number
  median_progress: number
  high_progress_count: number
  medium_progress_count: number
  low_progress_count: number
}

export interface AbandonmentData {
  activity_id: string
  abandonment_count: number
}

export interface MessageLengthData {
  avg_length_chars: number
  avg_length_words: number
  min_length: number
  max_length: number
  short_responses: number
  medium_responses: number
  long_responses: number
}

export interface EngagementData {
  avg_gap_minutes: number | null
  median_gap_minutes: number | null
  fast_responses: number
  normal_responses: number
  slow_responses: number
}

export interface TemporalDistributionData {
  hour: number
  session_count: number
  period: string
}

/**
 * Métrica 1: Tasa de Finalización
 */
export async function getCompletionRate(): Promise<CompletionRateData> {
  const result = await prisma.$queryRaw<CompletionRateData[]>`
    SELECT
      COUNT(*) FILTER (WHERE "completedAt" IS NOT NULL)::int as completed,
      COUNT(*) FILTER (WHERE "completedAt" IS NULL)::int as abandoned,
      ROUND(
        COUNT(*) FILTER (WHERE "completedAt" IS NOT NULL)::numeric /
        NULLIF(COUNT(*)::numeric, 0) * 100,
        1
      ) as completion_rate_percent
    FROM "TopicEnrollment"
  `
  return result[0] || { completed: 0, abandoned: 0, completion_rate_percent: 0 }
}

/**
 * Métrica 2: Tiempo Promedio de Sesión
 */
export async function getSessionDuration(): Promise<SessionDurationData> {
  const result = await prisma.$queryRaw<SessionDurationData[]>`
    SELECT
      ROUND(AVG(EXTRACT(EPOCH FROM ("endedAt" - "startedAt")) / 60)::numeric) as avg_duration_minutes,
      ROUND(MIN(EXTRACT(EPOCH FROM ("endedAt" - "startedAt")) / 60)::numeric) as min_duration_minutes,
      ROUND(MAX(EXTRACT(EPOCH FROM ("endedAt" - "startedAt")) / 60)::numeric) as max_duration_minutes,
      COUNT(*) FILTER (WHERE "endedAt" IS NOT NULL)::int as completed_sessions,
      COUNT(*) FILTER (WHERE "endedAt" IS NULL)::int as active_sessions
    FROM "LearningSession"
  `
  return result[0] || {
    avg_duration_minutes: null,
    min_duration_minutes: null,
    max_duration_minutes: null,
    completed_sessions: 0,
    active_sessions: 0
  }
}

/**
 * Métrica 3: Mensajes por Estudiante
 */
export async function getMessagesByStudent(): Promise<MessagesByStudentData[]> {
  const result = await prisma.$queryRaw<MessagesByStudentData[]>`
    SELECT
      u.name as student_name,
      u.email,
      COUNT(m.id)::int as message_count,
      ROUND(AVG(LENGTH(m.content))) as avg_message_length
    FROM "User" u
    LEFT JOIN "LearningSession" ls ON ls."userId" = u.id
    LEFT JOIN "Message" m ON m."sessionId" = ls.id AND m.role = 'user'
    GROUP BY u.id, u.name, u.email
    HAVING COUNT(m.id) > 0
    ORDER BY message_count DESC
  `
  return result
}

/**
 * Métrica 4: Actividades Completadas por Estudiante
 */
export async function getActivitiesProgress(): Promise<ActivitiesProgressData[]> {
  const result = await prisma.$queryRaw<ActivitiesProgressData[]>`
    SELECT
      u.name as student_name,
      u.email,
      COUNT(*) FILTER (WHERE ap."completedAt" IS NOT NULL)::int as completed,
      COUNT(*) FILTER (WHERE ap."startedAt" IS NOT NULL AND ap."completedAt" IS NULL)::int as in_progress,
      COUNT(*) FILTER (WHERE ap."startedAt" IS NULL)::int as not_started,
      te.progress::float as overall_progress
    FROM "User" u
    JOIN "TopicEnrollment" te ON te."userId" = u.id
    LEFT JOIN "ActivityProgress" ap ON ap."topicEnrollmentId" = te.id
    GROUP BY u.id, u.name, u.email, te.progress
    ORDER BY completed DESC
  `
  return result
}

/**
 * Métrica 5: Tasa de Reintento por Actividad
 */
export async function getRetryRate(): Promise<RetryRateData[]> {
  const result = await prisma.$queryRaw<RetryRateData[]>`
    SELECT
      ap."activityId",
      ROUND(AVG(ap.attempts)::numeric, 1) as avg_attempts,
      COUNT(*)::int as total_students_attempted,
      COUNT(*) FILTER (WHERE ap."completedAt" IS NOT NULL)::int as students_completed
    FROM "ActivityProgress" ap
    WHERE ap."startedAt" IS NOT NULL
    GROUP BY ap."activityId"
    ORDER BY avg_attempts DESC
    LIMIT 10
  `
  return result
}

/**
 * Métrica 6: Progreso Promedio Alcanzado
 */
export async function getProgressAverage(): Promise<ProgressAverageData> {
  const result = await prisma.$queryRaw<ProgressAverageData[]>`
    SELECT
      ROUND(AVG(progress)::numeric, 1) as avg_progress,
      ROUND(MIN(progress)::numeric, 1) as min_progress,
      ROUND(MAX(progress)::numeric, 1) as max_progress,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY progress) as median_progress,
      COUNT(*) FILTER (WHERE progress >= 80)::int as high_progress_count,
      COUNT(*) FILTER (WHERE progress >= 50 AND progress < 80)::int as medium_progress_count,
      COUNT(*) FILTER (WHERE progress < 50)::int as low_progress_count
    FROM "TopicEnrollment"
  `
  return result[0] || {
    avg_progress: 0,
    min_progress: 0,
    max_progress: 0,
    median_progress: 0,
    high_progress_count: 0,
    medium_progress_count: 0,
    low_progress_count: 0
  }
}

/**
 * Métrica 7: Punto de Abandono Común
 */
export async function getAbandonmentPoints(): Promise<AbandonmentData[]> {
  const result = await prisma.$queryRaw<AbandonmentData[]>`
    WITH last_activity AS (
      SELECT
        ap."topicEnrollmentId",
        ap."activityId",
        ap."startedAt",
        ap."completedAt",
        ROW_NUMBER() OVER (
          PARTITION BY ap."topicEnrollmentId"
          ORDER BY ap."startedAt" DESC
        ) as rn
      FROM "ActivityProgress" ap
      WHERE ap."startedAt" IS NOT NULL
    )
    SELECT
      "activityId" as activity_id,
      COUNT(*)::int as abandonment_count
    FROM last_activity
    WHERE rn = 1 AND "completedAt" IS NULL
    GROUP BY "activityId"
    ORDER BY abandonment_count DESC
  `
  return result
}

/**
 * Métrica 8: Longitud Promedio de Respuestas
 */
export async function getMessageLength(): Promise<MessageLengthData> {
  const result = await prisma.$queryRaw<MessageLengthData[]>`
    SELECT
      ROUND(AVG(LENGTH(content))) as avg_length_chars,
      ROUND(AVG(array_length(string_to_array(content, ' '), 1))) as avg_length_words,
      MIN(LENGTH(content))::int as min_length,
      MAX(LENGTH(content))::int as max_length,
      COUNT(*) FILTER (WHERE LENGTH(content) < 50)::int as short_responses,
      COUNT(*) FILTER (WHERE LENGTH(content) BETWEEN 50 AND 200)::int as medium_responses,
      COUNT(*) FILTER (WHERE LENGTH(content) > 200)::int as long_responses
    FROM "Message"
    WHERE role = 'user'
  `
  return result[0] || {
    avg_length_chars: 0,
    avg_length_words: 0,
    min_length: 0,
    max_length: 0,
    short_responses: 0,
    medium_responses: 0,
    long_responses: 0
  }
}

/**
 * Métrica 9: Tiempo Entre Mensajes (Engagement)
 */
export async function getEngagement(): Promise<EngagementData> {
  const result = await prisma.$queryRaw<EngagementData[]>`
    WITH message_gaps AS (
      SELECT
        "sessionId",
        timestamp,
        LAG(timestamp) OVER (
          PARTITION BY "sessionId"
          ORDER BY timestamp
        ) as prev_timestamp
      FROM "Message"
    )
    SELECT
      ROUND(AVG(EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60)::numeric, 1) as avg_gap_minutes,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60
      )::numeric, 1) as median_gap_minutes,
      COUNT(*) FILTER (
        WHERE EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60 < 2
      )::int as fast_responses,
      COUNT(*) FILTER (
        WHERE EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60 BETWEEN 2 AND 5
      )::int as normal_responses,
      COUNT(*) FILTER (
        WHERE EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60 > 5
      )::int as slow_responses
    FROM message_gaps
    WHERE prev_timestamp IS NOT NULL
  `
  return result[0] || {
    avg_gap_minutes: null,
    median_gap_minutes: null,
    fast_responses: 0,
    normal_responses: 0,
    slow_responses: 0
  }
}

/**
 * Métrica 10: Distribución Temporal de Sesiones
 */
export async function getTemporalDistribution(): Promise<TemporalDistributionData[]> {
  const result = await prisma.$queryRaw<TemporalDistributionData[]>`
    SELECT
      EXTRACT(HOUR FROM "startedAt")::int as hour,
      COUNT(*)::int as session_count,
      CASE
        WHEN EXTRACT(HOUR FROM "startedAt") BETWEEN 6 AND 11 THEN 'Mañana'
        WHEN EXTRACT(HOUR FROM "startedAt") BETWEEN 12 AND 17 THEN 'Tarde'
        WHEN EXTRACT(HOUR FROM "startedAt") BETWEEN 18 AND 23 THEN 'Noche'
        ELSE 'Madrugada'
      END as period
    FROM "LearningSession"
    GROUP BY EXTRACT(HOUR FROM "startedAt")
    ORDER BY hour
  `
  return result
}

/**
 * Tipo de retorno de getAllAnalytics()
 */
export type AnalyticsResponse = Awaited<ReturnType<typeof getAllAnalytics>>

/**
 * Obtener todas las métricas en una sola llamada (transacción)
 */
export async function getAllAnalytics() {
  const [
    completionRate,
    sessionDuration,
    messagesByStudent,
    activitiesProgress,
    retryRate,
    progressAverage,
    abandonmentPoints,
    messageLength,
    engagement,
    temporalDistribution
  ] = await Promise.all([
    getCompletionRate(),
    getSessionDuration(),
    getMessagesByStudent(),
    getActivitiesProgress(),
    getRetryRate(),
    getProgressAverage(),
    getAbandonmentPoints(),
    getMessageLength(),
    getEngagement(),
    getTemporalDistribution()
  ])

  return {
    timestamp: new Date().toISOString(),
    metadata: {
      total_students: messagesByStudent.length,
      data_range: 'Primera experiencia - Enero 2025'
    },
    metrics: {
      completion_rate: completionRate,
      session_duration: sessionDuration,
      messages_by_student: messagesByStudent,
      activities_progress: activitiesProgress,
      retry_rate: retryRate,
      progress_average: progressAverage,
      abandonment_points: abandonmentPoints,
      message_length: messageLength,
      engagement,
      temporal_distribution: temporalDistribution
    }
  }
}
