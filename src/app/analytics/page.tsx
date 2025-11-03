/**
 * Página de Analytics Dashboard
 *
 * Ruta: /analytics
 * Muestra métricas de la primera experiencia con estudiantes
 */

import { Suspense } from 'react'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'
import { getAllAnalytics } from '@/lib/analytics-queries'

export const dynamic = 'force-dynamic'

async function getAnalyticsData() {
  // Llamar directamente a la función en vez de fetch HTTP
  return await getAllAnalytics()
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-20 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-3 gap-6">
        <div className="h-64 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-96 bg-gray-200 rounded-lg" />
    </div>
  )
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <Suspense fallback={<LoadingSkeleton />}>
        <AnalyticsDashboard data={data} />
      </Suspense>
    </div>
  )
}
