'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

/**
 * Formatea el tiempo de ausencia de forma inteligente y legible
 */
function formatTimeAwaySmartly(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000)

  // 0-59 segundos: mostrar segundos exactos
  if (totalSeconds < 60) {
    return `${totalSeconds} segundo${totalSeconds !== 1 ? 's' : ''}`
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  // 1-5 minutos: mostrar minutos y segundos
  if (minutes <= 5) {
    if (seconds === 0) {
      return `${minutes} minuto${minutes !== 1 ? 's' : ''}`
    }
    return `${minutes}m ${seconds}s`
  }

  // 6-30 minutos: solo minutos
  if (minutes <= 30) {
    return `${minutes} minutos`
  }

  // Más de 30 minutos: "más de X minutos" (redondear)
  if (minutes <= 60) {
    return `más de ${Math.floor(minutes / 5) * 5} minutos`
  }

  // Más de 1 hora: "más de X horas"
  const hours = Math.floor(minutes / 60)
  return `más de ${hours} hora${hours !== 1 ? 's' : ''}`
}

/**
 * Hook para rastrear salidas de página durante verificaciones
 * Muestra notificación suave y transparente al usuario
 * Registra actividad en base de datos para auditoría
 */
export function useSoftPageExitTracking({
  sessionId,
  enabled = true
}: {
  sessionId: string
  enabled?: boolean
}) {
  const [totalTimeAway, setTotalTimeAway] = useState(0)
  const [exitCount, setExitCount] = useState(0)

  useEffect(() => {
    if (!enabled) return

    let leftTime: number | null = null

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // SALIÓ DE LA PÁGINA
        leftTime = Date.now()

      } else {
        // REGRESÓ A LA PÁGINA
        if (leftTime) {
          const timeAway = Date.now() - leftTime

          // Solo registrar si estuvo fuera más de 2 segundos
          if (timeAway > 2000) {
            const newTotal = totalTimeAway + timeAway
            const newCount = exitCount + 1

            setTotalTimeAway(newTotal)
            setExitCount(newCount)

            // Mostrar toast suave y transparente
            const timeStr = formatTimeAwaySmartly(timeAway)

            toast('⚠️ Actividad registrada', {
              description: `Saliste por ${timeStr}\n\nPor transparencia: tu actividad durante las verificaciones queda registrada.`,
              duration: 6000,
              style: {
                background: '#FFFBEB',      // Amarillo suave
                color: '#78350F',            // Texto oscuro
                border: '1px solid #FDE68A', // Borde amarillo
                padding: '16px',
                borderRadius: '8px'
              },
              position: 'bottom-left'
            })

            // Registrar en BD (silenciosamente, sin bloquear UI)
            try {
              await fetch('/api/audit/page-exit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId,
                  timeAway: Math.floor(timeAway / 1000),
                  totalTimeAway: Math.floor(newTotal / 1000),
                  exitCount: newCount,
                  timestamp: new Date().toISOString()
                })
              })
            } catch (error) {
              console.error('[PAGE_EXIT] Error registrando salida:', error)
              // No mostrar error al usuario, solo loguearlo
            }
          }

          leftTime = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [sessionId, enabled, totalTimeAway, exitCount])

  return { totalTimeAway, exitCount }
}
