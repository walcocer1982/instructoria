'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { InstructorCard } from './instructor-card'
import { LearningObjectivesCard } from './learning-objectives-card'
import { KeyPointsCard } from './key-points-card'
import { ProgressSection } from './ProgressSection'
import { cn } from '@/lib/utils'

interface LearningSidebarProps {
  instructorName: string
  instructorAvatar?: string
  instructorSpecialty?: string
  objectives: string[]
  keyPoints: string[]
  progress: number
  onProgressClick: () => void
  className?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function LearningSidebar({
  instructorName,
  instructorAvatar,
  instructorSpecialty,
  objectives,
  keyPoints,
  progress,
  onProgressClick,
  className,
  isMobileOpen = false,
  onMobileClose,
}: LearningSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'border-r bg-white transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-80',
        // Mobile: hidden por default, fixed cuando está abierto
        'hidden sm:flex',
        isMobileOpen && 'flex fixed top-14 bottom-0 left-0 z-50 sm:static',
        className
      )}
    >
      {/* Header con toggle */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        {!isCollapsed && (
          <span className="text-sm font-semibold text-gray-700">Panel de Aprendizaje</span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {/* Botón cerrar (solo mobile) */}
          {onMobileClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              className="h-8 w-8 sm:hidden"
              title="Cerrar panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
          {/* Botón colapsar (solo desktop) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 hidden sm:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Contenido */}
      {!isCollapsed && (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Instructor Card */}
            <InstructorCard
              instructorName={instructorName}
              instructorAvatar={instructorAvatar}
              instructorSpecialty={instructorSpecialty}
            />

            {/* Aprendizaje Esperado */}
            <LearningObjectivesCard objectives={objectives} />

            {/* Puntos Clave */}
            <KeyPointsCard keyPoints={keyPoints} />

            {/* Progreso */}
            <ProgressSection progress={progress} onViewDetails={onProgressClick} />
          </div>
        </ScrollArea>
      )}

      {/* Vista colapsada - solo iconos */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center gap-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            title={`Instructor: ${instructorName}`}
          >
            <span className="text-lg">👩‍🏫</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            title="Aprendizaje Esperado"
          >
            <span className="text-lg">🎯</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10" title="Puntos Clave">
            <span className="text-lg">💡</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            title="Progreso"
            onClick={onProgressClick}
          >
            <span className="text-lg">📊</span>
          </Button>
        </div>
      )}
    </aside>
  )
}
