'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { LearningObjectivesCard } from './LearningObjectivesCard'
import { KeyPointsCard } from './KeyPointsCard'
import { ProgressSection } from './ProgressSection'
import { cn } from '@/lib/utils'

interface LearningSidebarProps {
  objectives: string[]
  keyPoints: string[]
  progress: number
  onProgressClick: () => void
  className?: string
}

export function LearningSidebar({
  objectives,
  keyPoints,
  progress,
  onProgressClick,
  className,
}: LearningSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'border-r bg-white transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-80',
        className
      )}
    >
      {/* Header con toggle */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        {!isCollapsed && (
          <span className="text-sm font-semibold text-gray-700">Panel de Aprendizaje</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Contenido */}
      {!isCollapsed && (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Aprendizaje Esperado */}
            <LearningObjectivesCard objectives={objectives} />

            <Separator />

            {/* Puntos Clave */}
            <KeyPointsCard keyPoints={keyPoints} />

            <Separator />

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
