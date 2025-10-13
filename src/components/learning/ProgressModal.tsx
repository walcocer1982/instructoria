'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

interface Activity {
  id: string
  title: string
  status: 'completed' | 'in_progress' | 'pending'
}

interface ProgressModalProps {
  isOpen: boolean
  onClose: () => void
  progress: number
  activities?: Activity[]
}

export function ProgressModal({ isOpen, onClose, progress, activities = [] }: ProgressModalProps) {
  const getStatusIcon = (status: Activity['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-learning-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-focus-500 animate-pulse" />
      default:
        return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  const getStatusText = (status: Activity['status']) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'in_progress':
        return 'En progreso'
      default:
        return 'Pendiente'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            Progreso Detallado
          </DialogTitle>
          <DialogDescription>
            Tu avance en esta sesión de aprendizaje
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progreso general */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progreso General</span>
              <span className="text-2xl font-bold text-learning-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Lista de actividades */}
          {activities.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Actividades</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {getStatusIcon(activity.status)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{getStatusText(activity.status)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No hay actividades registradas aún</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
