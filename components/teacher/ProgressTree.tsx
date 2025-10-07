/**
 * ProgressTree Component
 * Visualización en árbol del progreso del estudiante por momento y sub-momento
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, AlertTriangle, XCircle, RotateCcw } from 'lucide-react';

interface MomentoProgress {
  momento_id: string;
  started_at: string;
  completed_at?: string;
  attempts: number;
  hints_used: number;
  max_attempts?: number; // Optional for backward compatibility
}

interface Momento {
  id: string;
  nombre: string;
  sub_momentos?: Array<{
    id: string;
    nombre: string;
  }>;
}

interface ProgressTreeProps {
  momentos: Momento[];
  momentoProgress: MomentoProgress[];
  currentMomento: string;
  errorCount?: number;
  onRestart?: (momentoId: string) => void;
}

export function ProgressTree({
  momentos,
  momentoProgress,
  currentMomento,
  errorCount = 0,
  onRestart,
}: ProgressTreeProps) {
  // Determinar el estado de un momento/sub-momento
  const getMomentoStatus = (momentoId: string): {
    status: 'completed' | 'in_progress' | 'stuck' | 'not_started';
    icon: any;
    color: string;
  } => {
    const progress = momentoProgress.find(p => p.momento_id === momentoId);

    if (!progress) {
      return {
        status: 'not_started',
        icon: Circle,
        color: 'text-gray-400',
      };
    }

    if (progress.completed_at) {
      return {
        status: 'completed',
        icon: CheckCircle2,
        color: 'text-green-600',
      };
    }

    if (momentoId === currentMomento) {
      // En progreso actualmente
      const maxAttempts = progress.max_attempts || 5; // Default to 5 if not set
      if (progress.attempts >= maxAttempts || errorCount >= 3) {
        return {
          status: 'stuck',
          icon: XCircle,
          color: 'text-red-600',
        };
      }

      if (progress.attempts >= 2) {
        return {
          status: 'in_progress',
          icon: AlertTriangle,
          color: 'text-yellow-600',
        };
      }

      return {
        status: 'in_progress',
        icon: Circle,
        color: 'text-blue-600',
      };
    }

    return {
      status: 'in_progress',
      icon: Circle,
      color: 'text-blue-400',
    };
  };

  const getStatusBadge = (status: 'completed' | 'in_progress' | 'stuck' | 'not_started'): {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  } => {
    switch (status) {
      case 'completed':
        return { label: 'Completado', variant: 'default' };
      case 'in_progress':
        return { label: 'En progreso', variant: 'secondary' };
      case 'stuck':
        return { label: 'Atascado', variant: 'destructive' };
      case 'not_started':
        return { label: 'No iniciado', variant: 'outline' };
    }
  };

  return (
    <div className="space-y-3">
      {momentos.map((momento) => {
        const momentoStatus = getMomentoStatus(momento.id);
        const StatusIcon = momentoStatus.icon;
        const momentoProgressData = momentoProgress.find(p => p.momento_id === momento.id);
        const badge = getStatusBadge(momentoStatus.status);

        return (
          <Card
            key={momento.id}
            className={`${
              momento.id === currentMomento ? 'border-primary shadow-sm' : ''
            }`}
          >
            <CardContent className="pt-4">
              {/* Momento Principal */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <StatusIcon className={`h-5 w-5 mt-0.5 ${momentoStatus.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {momento.id}
                      </Badge>
                      <span className="font-semibold">{momento.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                      </Badge>
                      {momentoProgressData && (
                        <>
                          <span>Intentos: {momentoProgressData.attempts}/{momentoProgressData.max_attempts || 5}</span>
                          <span>Pistas: {momentoProgressData.hints_used}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {onRestart && momentoProgressData && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestart(momento.id)}
                    className="gap-2"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reiniciar
                  </Button>
                )}
              </div>

              {/* Sub-Momentos (si existen) */}
              {momento.sub_momentos && momento.sub_momentos.length > 0 && (
                <div className="ml-8 mt-3 space-y-2 border-l-2 border-muted pl-4">
                  {momento.sub_momentos.map((subMomento) => {
                    const subStatus = getMomentoStatus(subMomento.id);
                    const SubIcon = subStatus.icon;
                    const subProgressData = momentoProgress.find(p => p.momento_id === subMomento.id);
                    const subBadge = getStatusBadge(subStatus.status);

                    return (
                      <div
                        key={subMomento.id}
                        className={`flex items-start justify-between p-2 rounded ${
                          subMomento.id === currentMomento ? 'bg-primary/5 border border-primary/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <SubIcon className={`h-4 w-4 mt-0.5 ${subStatus.color}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="font-mono text-xs">
                                {subMomento.id}
                              </Badge>
                              <span className="text-sm font-medium">{subMomento.nombre}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant={subBadge.variant} className="text-xs">
                                {subBadge.label}
                              </Badge>
                              {subProgressData && (
                                <>
                                  <span>Intentos: {subProgressData.attempts}/{subProgressData.max_attempts || 5}</span>
                                  <span>Pistas: {subProgressData.hints_used}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {onRestart && subProgressData && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRestart(subMomento.id)}
                            className="gap-2 h-8"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
