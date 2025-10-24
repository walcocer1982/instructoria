'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Target } from 'lucide-react'

interface LearningObjectivesCardProps {
  objectives: string[]
}

export function LearningObjectivesCard({ objectives }: LearningObjectivesCardProps) {
  if (!objectives || objectives.length === 0) {
    return (
      <Card className="border-slate-300  shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-learning-700 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Aprendizaje Esperado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 italic">No hay objetivos definidos aún</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-300  shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-learning-700 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Aprendizaje Esperado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {objectives.map((objective, index) => (
          <div key={index} className="flex gap-2 items-start">
            <CheckCircle2 className="h-4 w-4 text-learning-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-700 leading-relaxed">{objective}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
