'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { BarChart3 } from 'lucide-react'

interface ProgressSectionProps {
  progress: number
  onViewDetails: () => void
}

export function ProgressSection({ progress, onViewDetails }: ProgressSectionProps) {
  return (
    <Card className="border-slate-300 shadow-none">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Progreso
            </span>
            <span className="text-sm font-bold text-learning-600">{progress}%</span>
          </div>

          <div
            onClick={onViewDetails}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Progress
              value={progress}
              className="h-3 border border-learning-200"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-8 text-gray-600 hover:text-learning-600"
            onClick={onViewDetails}
          >
            Ver progreso detallado
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
