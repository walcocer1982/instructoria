'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'

interface KeyPointsCardProps {
  keyPoints: string[]
}

export function KeyPointsCard({ keyPoints }: KeyPointsCardProps) {

  if (!keyPoints || keyPoints.length === 0) {
    return (
      <Card className="border-slate-300 bg-white shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-focus-700 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Puntos Clave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 italic">No hay puntos clave definidos aún</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-300 bg-white shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-focus-700 flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Puntos Clave
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {keyPoints.map((point, index) => (
          <div key={index} className="flex gap-2 items-start">
            <span className="text-focus-600 font-semibold text-xs mt-0.5 flex-shrink-0">
              {index + 1}.
            </span>
            <p className="text-xs text-gray-700 leading-relaxed">{point}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
