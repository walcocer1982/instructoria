# PLAN_SQL_ANALYTICS.md

## Objetivo
Crear dashboard de analytics en `/app/analytics` que muestre métricas clave de la primera experiencia con ~10 estudiantes en producción.

---

## 10 Métricas Clave con SQL y Visualización

### 1. Tasa de Finalización
**¿Qué mide?** Porcentaje de estudiantes que completaron vs. abandonaron la clase

**SQL Query:**
```sql
SELECT
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed,
  COUNT(*) FILTER (WHERE completed_at IS NULL) as abandoned,
  ROUND(
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::numeric /
    COUNT(*)::numeric * 100,
    1
  ) as completion_rate_percent
FROM "TopicEnrollment";
```

**Visualización:**
- **Tipo:** Donut Chart / Pie Chart
- **Datos:** Completados vs. Abandonados
- **Color:** Verde (completado), Rojo (abandonado)
- **Label central:** `${completion_rate_percent}%` en grande

---

### 2. Tiempo Promedio de Sesión
**¿Qué mide?** Duración promedio de las sesiones completadas (en minutos)

**SQL Query:**
```sql
SELECT
  ROUND(AVG(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60)) as avg_duration_minutes,
  ROUND(MIN(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60)) as min_duration_minutes,
  ROUND(MAX(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60)) as max_duration_minutes,
  COUNT(*) FILTER (WHERE ended_at IS NOT NULL) as completed_sessions,
  COUNT(*) FILTER (WHERE ended_at IS NULL) as active_sessions
FROM "LearningSession";
```

**Visualización:**
- **Tipo:** Stat Card + Range Indicator
- **Layout:** Card grande con número principal (avg) + mini stats (min/max)
- **Formato:** `45 min` en grande, `Rango: 20-80 min` en pequeño
- **Icono:** ⏱️ Clock

---

### 3. Mensajes por Estudiante
**¿Qué mide?** Distribución de cantidad de mensajes enviados por estudiante

**SQL Query:**
```sql
SELECT
  u.name as student_name,
  u.email,
  COUNT(m.id) as message_count,
  ROUND(AVG(LENGTH(m.content))) as avg_message_length
FROM "User" u
LEFT JOIN "LearningSession" ls ON ls.user_id = u.id
LEFT JOIN "Message" m ON m.session_id = ls.id AND m.role = 'user'
GROUP BY u.id, u.name, u.email
ORDER BY message_count DESC;
```

**Visualización:**
- **Tipo:** Horizontal Bar Chart
- **Eje X:** Cantidad de mensajes
- **Eje Y:** Nombre del estudiante (anónimo: primeras letras + ***)
- **Color:** Gradiente de azul (más mensajes = más oscuro)
- **Tooltip:** Mostrar avg_message_length

---

### 4. Actividades Completadas por Estudiante
**¿Qué mide?** Cuántas actividades completó cada estudiante

**SQL Query:**
```sql
SELECT
  u.name as student_name,
  u.email,
  COUNT(*) FILTER (WHERE ap.completed_at IS NOT NULL) as completed,
  COUNT(*) FILTER (WHERE ap.started_at IS NOT NULL AND ap.completed_at IS NULL) as in_progress,
  COUNT(*) FILTER (WHERE ap.started_at IS NULL) as not_started,
  te.progress as overall_progress
FROM "User" u
JOIN "TopicEnrollment" te ON te.user_id = u.id
LEFT JOIN "ActivityProgress" ap ON ap.topic_enrollment_id = te.id
GROUP BY u.id, u.name, u.email, te.progress
ORDER BY completed DESC;
```

**Visualización:**
- **Tipo:** Stacked Horizontal Bar Chart
- **Segmentos:** Completadas (verde), En Progreso (amarillo), No Iniciadas (gris)
- **Eje Y:** Estudiantes (anónimos)
- **Label:** Porcentaje de progreso al final de cada barra

---

### 5. Tasa de Reintento por Actividad
**¿Qué mide?** Qué actividades requirieron más intentos (dificultad percibida)

**SQL Query:**
```sql
SELECT
  ap.activity_id,
  ROUND(AVG(ap.attempts), 1) as avg_attempts,
  COUNT(*) as total_students_attempted,
  COUNT(*) FILTER (WHERE ap.completed_at IS NOT NULL) as students_completed
FROM "ActivityProgress" ap
WHERE ap.started_at IS NOT NULL
GROUP BY ap.activity_id
ORDER BY avg_attempts DESC
LIMIT 10;
```

**Visualización:**
- **Tipo:** Vertical Bar Chart
- **Eje X:** Activity ID (abreviado: "Act 1", "Act 2"...)
- **Eje Y:** Promedio de intentos
- **Color:** Rojo (>3 intentos), Amarillo (2-3), Verde (<2)
- **Tooltip:** Total de estudiantes que intentaron + completaron

---

### 6. Progreso Promedio Alcanzado
**¿Qué mide?** Distribución del progreso alcanzado por los estudiantes

**SQL Query:**
```sql
SELECT
  ROUND(AVG(progress), 1) as avg_progress,
  ROUND(MIN(progress), 1) as min_progress,
  ROUND(MAX(progress), 1) as max_progress,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY progress) as median_progress,
  COUNT(*) FILTER (WHERE progress >= 80) as high_progress_count,
  COUNT(*) FILTER (WHERE progress >= 50 AND progress < 80) as medium_progress_count,
  COUNT(*) FILTER (WHERE progress < 50) as low_progress_count
FROM "TopicEnrollment";
```

**Visualización:**
- **Tipo:** Gauge Chart / Progress Ring
- **Dato principal:** avg_progress en el centro
- **Distribución:** Mini rings para High (verde), Medium (amarillo), Low (rojo)
- **Formato:** `65.3%` en grande + distribución en pequeño

---

### 7. Punto de Abandono Común
**¿Qué mide?** En qué actividad abandonan más estudiantes

**SQL Query:**
```sql
WITH last_activity AS (
  SELECT
    ap.topic_enrollment_id,
    ap.activity_id,
    ap.started_at,
    ap.completed_at,
    ROW_NUMBER() OVER (
      PARTITION BY ap.topic_enrollment_id
      ORDER BY ap.started_at DESC
    ) as rn
  FROM "ActivityProgress" ap
  WHERE ap.started_at IS NOT NULL
)
SELECT
  activity_id,
  COUNT(*) as abandonment_count
FROM last_activity
WHERE rn = 1 AND completed_at IS NULL
GROUP BY activity_id
ORDER BY abandonment_count DESC;
```

**Visualización:**
- **Tipo:** Heatmap / Tree Map
- **Tamaño de cuadro:** Proporcional a abandonment_count
- **Color:** Rojo intenso (muchos abandonos) → Naranja (pocos)
- **Label:** Activity ID + número de abandonos

---

### 8. Longitud Promedio de Respuestas
**¿Qué mide?** Si los estudiantes responden con detalle o brevemente

**SQL Query:**
```sql
SELECT
  ROUND(AVG(LENGTH(content))) as avg_length_chars,
  ROUND(AVG(array_length(string_to_array(content, ' '), 1))) as avg_length_words,
  MIN(LENGTH(content)) as min_length,
  MAX(LENGTH(content)) as max_length,
  COUNT(*) FILTER (WHERE LENGTH(content) < 50) as short_responses,
  COUNT(*) FILTER (WHERE LENGTH(content) BETWEEN 50 AND 200) as medium_responses,
  COUNT(*) FILTER (WHERE LENGTH(content) > 200) as long_responses
FROM "Message"
WHERE role = 'user';
```

**Visualización:**
- **Tipo:** Distribution Bar Chart (Histogram-like)
- **3 Barras:** Short (<50 chars), Medium (50-200), Long (>200)
- **Color:** Azul claro → Azul oscuro
- **Stat card arriba:** `${avg_length_words} palabras promedio`

---

### 9. Tiempo Entre Mensajes (Engagement)
**¿Qué mide?** Ritmo de conversación (tiempo promedio entre mensajes consecutivos)

**SQL Query:**
```sql
WITH message_gaps AS (
  SELECT
    session_id,
    timestamp,
    LAG(timestamp) OVER (
      PARTITION BY session_id
      ORDER BY timestamp
    ) as prev_timestamp
  FROM "Message"
)
SELECT
  ROUND(AVG(EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60), 1) as avg_gap_minutes,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60
  ), 1) as median_gap_minutes,
  COUNT(*) FILTER (
    WHERE EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60 < 2
  ) as fast_responses,
  COUNT(*) FILTER (
    WHERE EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60 BETWEEN 2 AND 5
  ) as normal_responses,
  COUNT(*) FILTER (
    WHERE EXTRACT(EPOCH FROM (timestamp - prev_timestamp)) / 60 > 5
  ) as slow_responses
FROM message_gaps
WHERE prev_timestamp IS NOT NULL;
```

**Visualización:**
- **Tipo:** Line Chart con área rellena
- **Eje X:** Categorías (Fast <2min, Normal 2-5min, Slow >5min)
- **Eje Y:** Cantidad de respuestas
- **Color:** Verde (fast) → Amarillo (normal) → Rojo (slow)
- **Stat card:** `${avg_gap_minutes} min promedio`

---

### 10. Distribución Temporal de Sesiones
**¿Qué mide?** A qué hora del día estudian más (patrón de uso)

**SQL Query:**
```sql
SELECT
  EXTRACT(HOUR FROM started_at) as hour,
  COUNT(*) as session_count,
  CASE
    WHEN EXTRACT(HOUR FROM started_at) BETWEEN 6 AND 11 THEN 'Mañana'
    WHEN EXTRACT(HOUR FROM started_at) BETWEEN 12 AND 17 THEN 'Tarde'
    WHEN EXTRACT(HOUR FROM started_at) BETWEEN 18 AND 23 THEN 'Noche'
    ELSE 'Madrugada'
  END as period
FROM "LearningSession"
GROUP BY hour
ORDER BY hour;
```

**Visualización:**
- **Tipo:** Area Chart / Time Series
- **Eje X:** Horas del día (0-23)
- **Eje Y:** Cantidad de sesiones iniciadas
- **Color:** Gradiente según período (mañana=amarillo, tarde=naranja, noche=azul)
- **Highlight:** Marcar hora pico con badge

---

## Arquitectura de Implementación

### Estructura de Archivos

```
src/
├── app/
│   └── analytics/
│       ├── page.tsx                    # Página principal del dashboard
│       └── loading.tsx                 # Skeleton loading state
│
├── app/api/
│   └── analytics/
│       └── route.ts                    # GET /api/analytics (todas las queries)
│
├── components/analytics/
│   ├── completion-rate-chart.tsx       # Métrica 1
│   ├── session-duration-card.tsx       # Métrica 2
│   ├── messages-by-student-chart.tsx   # Métrica 3
│   ├── activities-progress-chart.tsx   # Métrica 4
│   ├── retry-rate-chart.tsx            # Métrica 5
│   ├── progress-gauge.tsx              # Métrica 6
│   ├── abandonment-heatmap.tsx         # Métrica 7
│   ├── message-length-chart.tsx        # Métrica 8
│   ├── engagement-chart.tsx            # Métrica 9
│   ├── temporal-distribution-chart.tsx # Métrica 10
│   └── analytics-header.tsx            # Header con metadata
│
└── lib/
    └── analytics-queries.ts            # Funciones para ejecutar queries
```

### API Endpoint

**GET /api/analytics**

```typescript
// app/api/analytics/route.ts
export async function GET() {
  const data = await prisma.$transaction([
    // Query 1: Completion Rate
    prisma.$queryRaw`...`,
    // Query 2: Session Duration
    prisma.$queryRaw`...`,
    // ... (todas las queries en paralelo)
  ])

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    metadata: {
      total_students: 10,
      data_range: '2025-01-01 to 2025-01-31'
    },
    metrics: {
      completion_rate: data[0],
      session_duration: data[1],
      messages_by_student: data[2],
      // ... resto de métricas
    }
  })
}
```

### Página del Dashboard

**Layout sugerido (4x3 grid):**

```
┌─────────────────────────────────────────────────────┐
│  Analytics Dashboard - Primera Experiencia          │
│  10 estudiantes | Enero 2025                        │
└─────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ Completion   │ Avg Session  │ Progress     │
│ Rate (1)     │ Duration (2) │ Gauge (6)    │
│ Donut Chart  │ Stat Card    │ Gauge        │
└──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────┐
│ Messages by Student (3)                     │
│ Horizontal Bar Chart                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Activities Progress by Student (4)          │
│ Stacked Horizontal Bar Chart                │
└─────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ Retry Rate   │ Message      │ Engagement   │
│ by Activity  │ Length (8)   │ (9)          │
│ (5) Bar      │ Distribution │ Line Chart   │
└──────────────┴──────────────┴──────────────┘

┌─────────────────────┬───────────────────────┐
│ Abandonment Points  │ Temporal Distribution │
│ (7) Heatmap         │ (10) Area Chart       │
└─────────────────────┴───────────────────────┘
```

### Librerías de Gráficos Sugeridas

**Opción 1: Recharts (Recomendada)**
- Pros: React-native, TypeScript, flexible, buen soporte
- Instalación: `npm install recharts`
- Uso: `import { PieChart, BarChart, LineChart, ... } from 'recharts'`

**Opción 2: Chart.js con react-chartjs-2**
- Pros: Muy completo, muchos ejemplos
- Instalación: `npm install chart.js react-chartjs-2`

**Opción 3: Tremor (UI completa para dashboards)**
- Pros: Componentes pre-diseñados, basado en Tailwind
- Instalación: `npm install @tremor/react`
- Uso: `import { Card, BarChart, DonutChart, ... } from '@tremor/react'`

**Recomendación:** **Tremor** - Rápido, elegante, bien integrado con Tailwind

### Seguridad y Permisos

**Protección de ruta:**
```typescript
// app/analytics/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export default async function AnalyticsPage() {
  const session = await getServerSession()

  // Solo admins/instructores
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Fetch analytics data
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/analytics`)
  const data = await response.json()

  return <AnalyticsDashboard data={data} />
}
```

### Variables de Entorno

```env
# Añadir en .env (opcional - para analytics en producción)
ANALYTICS_ENABLED=1              # Activar/desactivar analytics
ANALYTICS_CACHE_TTL=300          # Cache de 5 minutos
```

---

## Implementación en Fases

### Fase 1: API y Queries (30 min)
- Crear `/api/analytics/route.ts`
- Implementar las 10 queries en `lib/analytics-queries.ts`
- Probar endpoint con Postman/Thunder Client

### Fase 2: Componentes Básicos (1 hora)
- Instalar Tremor: `npm install @tremor/react`
- Crear componentes básicos para 3-4 métricas principales
- Layout básico del dashboard

### Fase 3: Visualizaciones Avanzadas (1 hora)
- Completar los 10 componentes de visualización
- Ajustar colores y estilos según brand
- Responsive design

### Fase 4: UX y Polish (30 min)
- Loading states (skeletons)
- Error handling
- Export a PDF/CSV (opcional)
- Tooltips y explicaciones

---

## Ejemplo de Código (Métrica 1)

```typescript
// components/analytics/completion-rate-chart.tsx
'use client'

import { DonutChart, Card, Title, Metric } from '@tremor/react'

interface CompletionRateProps {
  data: {
    completed: number
    abandoned: number
    completion_rate_percent: number
  }
}

export function CompletionRateChart({ data }: CompletionRateProps) {
  const chartData = [
    { name: 'Completados', value: data.completed, color: 'emerald' },
    { name: 'Abandonados', value: data.abandoned, color: 'red' }
  ]

  return (
    <Card>
      <Title>Tasa de Finalización</Title>
      <Metric className="text-center mt-4">
        {data.completion_rate_percent}%
      </Metric>
      <DonutChart
        data={chartData}
        category="value"
        index="name"
        colors={['emerald', 'red']}
        className="mt-6"
        showLabel={true}
      />
    </Card>
  )
}
```

---

## Testing

### Query Testing
```bash
# Conectar directamente a BD de producción (read-only)
psql $DATABASE_URL_PROD

# Ejecutar queries una por una
SELECT ... FROM "TopicEnrollment" ...;
```

### Component Testing
```bash
# Usar mock data primero
const mockData = {
  completion_rate: { completed: 7, abandoned: 3, completion_rate_percent: 70 },
  // ... resto de datos mock
}

# Luego conectar a API real
```

---

## Entrega Final

**Archivos generados:**
- ✅ `app/analytics/page.tsx` - Dashboard completo
- ✅ `app/api/analytics/route.ts` - API con las 10 queries
- ✅ `components/analytics/*.tsx` - 10 componentes de visualización
- ✅ `lib/analytics-queries.ts` - Funciones helper para queries
- ✅ Documentación en README (sección Analytics)

**Ruta de acceso:** `/analytics` (protegida, solo admins)

**Tiempo estimado:** 3-4 horas de implementación completa

---

**Versión:** 1.0
**Fecha:** 2025-01-01
**Autor:** Claude + Bruno
