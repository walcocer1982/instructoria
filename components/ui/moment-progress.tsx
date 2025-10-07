"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, CheckCircle2, PlayCircle, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface Momento {
  id: string
  nombre: string
  min: number
}

interface MomentoProgress {
  momento_id: string
  completed_at?: string
}

interface MomentProgressProps {
  momentos: Momento[]
  currentMomento: string
  momentoProgress: MomentoProgress[]
  className?: string
}

export function MomentProgress({
  momentos,
  currentMomento,
  momentoProgress,
  className
}: MomentProgressProps) {
  const [isOpen, setIsOpen] = useState(false)

  const completedCount = momentoProgress.filter(p => p.completed_at).length
  const totalCount = momentos.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  const getMomentoStatus = (momentoId: string) => {
    const progress = momentoProgress.find(p => p.momento_id === momentoId)
    if (!progress) return 'locked'
    if (progress.completed_at) return 'completed'
    if (currentMomento === momentoId) return 'active'
    return 'locked'
  }

  const getMomentoIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-secondary" />
      case 'active':
        return <PlayCircle className="h-4 w-4 text-primary" />
      default:
        return <Lock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                📊 Progreso
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </h3>
              <span className="text-xs text-muted-foreground">
                {completedCount} de {totalCount}
              </span>
            </div>

            <Progress value={progressPercent} className="h-2 mb-2" />

            {!isOpen && (
              <p className="text-xs text-muted-foreground text-left">
                Click para ver momentos
              </p>
            )}
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4 space-y-2">
            {momentos.map((momento) => {
              const status = getMomentoStatus(momento.id)
              const isActive = status === 'active'
              const isCompleted = status === 'completed'

              return (
                <div
                  key={momento.id}
                  className={cn(
                    "p-3 rounded-lg border-l-4 transition-all",
                    isCompleted && "bg-secondary/10 border-l-secondary",
                    isActive && "bg-primary/10 border-l-primary",
                    !isCompleted && !isActive && "bg-muted/50 border-l-border opacity-60"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {getMomentoIcon(status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm font-medium",
                          isActive && "text-primary",
                          isCompleted && "text-secondary"
                        )}>
                          {momento.id}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {momento.min} min
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {momento.nombre}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
