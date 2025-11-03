/**
 * Analytics Dashboard - Componente Principal
 *
 * Muestra las 10 métricas clave en un layout responsive
 * Usa Recharts para las visualizaciones
 */

'use client'

import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface AnalyticsData {
  timestamp: string
  metadata: {
    total_students: number
    data_range: string
  }
  metrics: {
    completion_rate: {
      completed: number
      abandoned: number
      completion_rate_percent: number
    }
    session_duration: {
      avg_duration_minutes: number | null
      min_duration_minutes: number | null
      max_duration_minutes: number | null
      completed_sessions: number
      active_sessions: number
    }
    messages_by_student: Array<{
      student_name: string
      email: string
      message_count: number
      avg_message_length: number
    }>
    activities_progress: Array<{
      user_id: string
      activity_id: string
      completed: boolean
      attempts: number
    }>
    retry_rate: Array<{
      activity_id: string
      avg_attempts: number
      total_students_attempted: number
      students_completed: number
    }>
    progress_average: {
      avg_progress: number
      min_progress: number
      max_progress: number
      median_progress: number
      high_progress_count: number
      medium_progress_count: number
      low_progress_count: number
    }
    abandonment_points: Array<{
      activity_id: string
      started_count: number
      not_completed_count: number
      abandonment_rate: number
    }>
    message_length: {
      avg_length_chars: number
      avg_length_words: number
      min_length: number
      max_length: number
      short_responses: number
      medium_responses: number
      long_responses: number
    }
    engagement: {
      avg_gap_minutes: number | null
      median_gap_minutes: number | null
      fast_responses: number
      normal_responses: number
      slow_responses: number
    }
    temporal_distribution: Array<{
      hour: number
      session_count: number
      period: string
    }>
  }
}

const COLORS = {
  emerald: '#10b981',
  red: '#ef4444',
  blue: '#3b82f6',
  amber: '#f59e0b',
  violet: '#8b5cf6'
}

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  // Helper para convertir valores numéricos de forma segura
  const toNumber = (val: any): number => {
    if (typeof val === 'number') return val
    if (typeof val === 'string') return parseFloat(val)
    return 0
  }

  // Preparar datos para gráficos

  // 1. Completion Rate - Pie Chart
  const completionData = [
    {
      name: 'Completados',
      value: data.metrics.completion_rate.completed
    },
    {
      name: 'Abandonados',
      value: data.metrics.completion_rate.abandoned
    }
  ]

  // 3. Messages by Student - Bar Chart (top 10)
  const messagesData = data.metrics.messages_by_student
    .slice(0, 10)
    .map(s => ({
      name: s.student_name ? s.student_name.split(' ')[0] : 'Anónimo',
      mensajes: s.message_count
    }))

  // 5. Retry Rate - Bar Chart
  const retryData = data.metrics.retry_rate.map(r => ({
    activity: r.activity_id ? r.activity_id.slice(0, 10) : 'N/A',
    intentos: toNumber(r.avg_attempts)
  }))

  // 8. Message Length Distribution - Pie Chart
  const messageLengthData = [
    {
      name: 'Cortas',
      value: data.metrics.message_length.short_responses
    },
    {
      name: 'Medias',
      value: data.metrics.message_length.medium_responses
    },
    {
      name: 'Largas',
      value: data.metrics.message_length.long_responses
    }
  ]

  // 9. Engagement - Pie Chart
  const engagementData = [
    {
      name: 'Rápidas (<2min)',
      value: data.metrics.engagement.fast_responses
    },
    {
      name: 'Normales (2-5min)',
      value: data.metrics.engagement.normal_responses
    },
    {
      name: 'Lentas (>5min)',
      value: data.metrics.engagement.slow_responses
    }
  ]

  // 10. Temporal Distribution - Area Chart
  const temporalData = data.metrics.temporal_distribution
    .sort((a, b) => a.hour - b.hour)
    .map(t => ({
      hora: `${t.hour}h`,
      sesiones: t.session_count
    }))

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Primera Experiencia - {data.metadata.total_students} Estudiantes
        </p>
        <p className="text-sm text-gray-500">{data.metadata.data_range}</p>
      </div>

      {/* Primera fila: Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* 1. Completion Rate */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Tasa de Finalización</h3>
          <div className="text-4xl font-bold text-emerald-600 mb-4">
            {toNumber(data.metrics.completion_rate.completion_rate_percent).toFixed(1)}%
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={completionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill={COLORS.emerald} />
                <Cell fill={COLORS.red} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Session Duration */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Duración Promedio de Sesión</h3>
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {data.metrics.session_duration.avg_duration_minutes ?
              `${toNumber(data.metrics.session_duration.avg_duration_minutes).toFixed(0)} min` :
              'N/A'}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mínimo</span>
              <span className="font-semibold">{data.metrics.session_duration.min_duration_minutes || 0} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Máximo</span>
              <span className="font-semibold">{data.metrics.session_duration.max_duration_minutes || 0} min</span>
            </div>
            <div className="mt-4 flex justify-between text-xs">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                {data.metrics.session_duration.completed_sessions} completadas
              </span>
              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded">
                {data.metrics.session_duration.active_sessions} activas
              </span>
            </div>
          </div>
        </div>

        {/* 6. Progress Average */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Progreso Promedio</h3>
          <div className="text-4xl font-bold text-violet-600 mb-4">
            {toNumber(data.metrics.progress_average.avg_progress).toFixed(1)}%
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded text-sm">
              {data.metrics.progress_average.high_progress_count} alto (≥80%)
            </span>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded text-sm">
              {data.metrics.progress_average.medium_progress_count} medio
            </span>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm">
              {data.metrics.progress_average.low_progress_count} bajo (&lt;50%)
            </span>
          </div>
        </div>
      </div>

      {/* Segunda fila: Messages by Student */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Mensajes Enviados por Estudiante</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={messagesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="mensajes" fill={COLORS.blue} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tercera fila: Retry Rate */}
      {retryData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-2">Tasa de Reintento por Actividad</h3>
          <p className="text-sm text-gray-600 mb-4">
            Promedio de intentos por actividad (dificultad percibida)
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={retryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="activity" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="intentos" fill={COLORS.red} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cuarta fila: 3 métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* 8. Message Length */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Longitud de Respuestas</h3>
          <div className="text-2xl font-bold text-gray-700 mb-4">
            {data.metrics.message_length.avg_length_words} palabras
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={messageLengthData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill={COLORS.emerald} />
                <Cell fill={COLORS.amber} />
                <Cell fill={COLORS.red} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 9. Engagement */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Tiempo Entre Mensajes</h3>
          <div className="text-2xl font-bold text-gray-700 mb-4">
            {data.metrics.engagement.avg_gap_minutes ?
              `${toNumber(data.metrics.engagement.avg_gap_minutes).toFixed(1)} min` :
              'N/A'}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={engagementData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill={COLORS.emerald} />
                <Cell fill={COLORS.amber} />
                <Cell fill={COLORS.red} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Placeholder for future metric */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Resumen</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total estudiantes:</span>
              <span className="font-semibold">{data.metadata.total_students}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sesiones totales:</span>
              <span className="font-semibold">
                {data.metrics.session_duration.completed_sessions + data.metrics.session_duration.active_sessions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tasa de finalización:</span>
              <span className="font-semibold">
                {toNumber(data.metrics.completion_rate.completion_rate_percent).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quinta fila: Temporal Distribution */}
      {temporalData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Distribución Temporal de Sesiones</h3>
          <p className="text-sm text-gray-600 mb-4">Horarios preferidos para estudiar</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={temporalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="sesiones" stroke={COLORS.violet} fill={COLORS.violet} fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
