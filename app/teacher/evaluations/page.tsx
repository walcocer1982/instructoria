/**
 * Página de Revisión de Evaluaciones del Profesor
 * Sistema SOPHI - Fase 5-7
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeacherLayout } from '@/components/teacher/TeacherLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Eye, CheckCircle2, XCircle, FileText } from 'lucide-react';

interface Student {
  id: string;
  nombre: string;
  email: string;
}

interface Evaluation {
  id: string;
  timestamp: string;
  overall_score?: number;
  score?: number;
  passed: boolean;
  general_feedback?: string;
  feedback?: string;
}

interface SessionWithEvaluations {
  session_id: string;
  student: Student;
  lesson_title: string;
  lesson_id: string;
  started_at: string;
  evaluations: Evaluation[];
}

export default function TeacherEvaluationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionWithEvaluations[]>([]);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'passed' | 'failed'>('all');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.rol !== 'profesor') {
      router.push('/student');
      return;
    }

    setUser(userData);
    loadEvaluations(token);
  }, [router]);

  const loadEvaluations = async (token: string) => {
    try {
      setLoading(true);

      // Cargar todas las sesiones con datos enriquecidos
      const response = await fetch('/api/sessions?action=list_all', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar evaluaciones');
      }

      // Filtrar sesiones que tienen evaluaciones
      const sessionsWithEvaluations = (data.sessions || [])
        .filter((session: any) => session.evaluations && session.evaluations.length > 0)
        .map((session: any) => ({
          session_id: session.id,
          student: {
            id: session.userId,
            nombre: session.student_name,
            email: session.student_email,
          },
          lesson_title: session.lesson_title,
          lesson_id: session.lessonId,
          started_at: session.startedAt,
          evaluations: session.evaluations,
        }));

      setSessions(sessionsWithEvaluations);
    } catch (err: any) {
      setError(err.message || 'Error al cargar evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  const getScoreVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    if (score >= 60) return 'outline';
    return 'destructive';
  };

  const filteredSessions = sessions.filter(session => {
    if (selectedFilter === 'all') return true;
    const lastEvaluation = session.evaluations[session.evaluations.length - 1];
    if (selectedFilter === 'passed') return lastEvaluation.passed;
    if (selectedFilter === 'failed') return !lastEvaluation.passed;
    return true;
  });

  const passedCount = sessions.filter(s => s.evaluations[s.evaluations.length - 1]?.passed).length;
  const failedCount = sessions.filter(s => !s.evaluations[s.evaluations.length - 1]?.passed).length;

  if (loading) {
    return (
      <TeacherLayout userName={user?.nombre}>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">⏳ Cargando evaluaciones...</p>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout userName={user?.nombre}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evaluaciones de Estudiantes</h1>
          <p className="text-muted-foreground mt-2">
            Revisa el desempeño de tus estudiantes en las lecciones
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros con Tabs */}
        <Tabs value={selectedFilter} onValueChange={(v) => setSelectedFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">
              Todas ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="passed">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprobados ({passedCount})
            </TabsTrigger>
            <TabsTrigger value="failed">
              <XCircle className="h-4 w-4 mr-2" />
              No aprobados ({failedCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedFilter} className="mt-6">
            {/* Lista de evaluaciones */}
            {filteredSessions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay evaluaciones para mostrar</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredSessions.map((session) => {
                  const lastEvaluation = session.evaluations[session.evaluations.length - 1];
                  const score = lastEvaluation.score || lastEvaluation.overall_score || 0;

                  return (
                    <Card key={session.session_id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="text-xl">{session.student.nombre}</CardTitle>
                            <CardDescription>{session.student.email}</CardDescription>
                            <p className="text-sm text-muted-foreground">
                              📚 {session.lesson_title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Iniciada: {new Date(session.started_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="text-4xl font-bold">
                              {score}%
                            </div>
                            {lastEvaluation.passed ? (
                              <Badge className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Aprobado
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                No aprobado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Retroalimentación:</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {lastEvaluation.feedback || lastEvaluation.general_feedback}
                          </p>
                        </div>

                        {session.evaluations.length > 1 && (
                          <p className="text-xs text-muted-foreground">
                            📝 {session.evaluations.length} evaluaciones realizadas
                          </p>
                        )}

                        <Button
                          onClick={() => router.push(`/teacher/evaluations/${session.session_id}`)}
                          className="w-full gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalle Completo
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TeacherLayout>
  );
}
