/**
 * Página de Detalle de Evaluación de Sesión
 * Sistema SOPHI - Fase 5-7 (con shadcn/ui)
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TeacherLayout } from '@/components/teacher/TeacherLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, MessageSquare, BarChart3, CheckCircle2, ArrowLeft, User, Bot, AlertTriangle, FileText } from 'lucide-react';
import { ProgressTree } from '@/components/teacher/ProgressTree';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  message_type?: string;
  metadata?: {
    evaluation?: 'correct' | 'partial' | 'incorrect';
    hint_level?: number;
    attempt_count?: number;
  };
}

interface MomentoProgress {
  momento_id: string;
  started_at: string;
  completed_at?: string;
  attempts: number;
  hints_used: number;
}

interface Evaluation {
  id: string;
  timestamp: string;
  score: number;
  feedback: string;
  passed: boolean;
}

interface Session {
  id: string;
  student_id: string;
  lesson_id: string;
  started_at: string;
  completed_at?: string;
  current_state: string;
  current_momento: string;
  chat_history: ChatMessage[];
  momento_progress: MomentoProgress[];
  evaluations: Evaluation[];
  evidence_attempts?: Record<string, {
    attempt_count: number;
    best_score: number;
    student_responses: string[];
    status?: string;
    final_score?: number;
  }>;
  error_count?: number;
  last_error?: {
    timestamp: string;
    message: string;
    type: string;
  };
  student_reports?: Array<{
    id: string;
    timestamp: string;
    momento_id: string;
    student_message: string;
    context: {
      last_question: string;
      chat_history_length: number;
      error_count: number;
      attempts: number;
    };
    status: 'pending' | 'reviewed' | 'resolved';
    instructor_notes?: string;
    resolved_at?: string;
  }>;
}

interface Lesson {
  id: string;
  titulo: string;
  objetivo: string;
  criterios_evaluacion: string[];
  momentos: Array<{
    id: string;
    nombre: string;
    sub_momentos?: Array<{
      id: string;
      nombre: string;
    }>;
  }>;
}

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'chat' | 'progress' | 'evaluation' | 'reports'>('chat');

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
    loadSessionData(token);
  }, [sessionId, router]);

  const loadSessionData = async (token: string) => {
    try {
      setLoading(true);

      // Cargar sesión
      const sessionResponse = await fetch(`/api/sessions?session_id=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const sessionData = await sessionResponse.json();

      if (!sessionData.success) {
        throw new Error(sessionData.error || 'Error al cargar sesión');
      }

      setSession(sessionData.session);

      // Cargar lección
      const lessonResponse = await fetch(`/api/lessons?lesson_id=${sessionData.session.lessonId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const lessonData = await lessonResponse.json();

      if (lessonData.success && lessonData.lesson) {
        setLesson(lessonData.lesson);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRestartFromMomento = async (momentoId: string) => {
    if (!confirm(`¿Estás seguro de reiniciar la sesión desde ${momentoId}? Esto eliminará el progreso posterior.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/sessions/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: session?.id,
          momentoId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Sesión reiniciada desde ${momentoId}`);
        // Recargar datos
        if (token) {
          loadSessionData(token);
        }
      } else {
        alert('❌ Error al reiniciar: ' + result.error);
      }
    } catch (err: any) {
      alert('❌ Error al reiniciar: ' + err.message);
    }
  };

  const getMomentoName = (momentoId: string): string => {
    const names: Record<string, string> = {
      'M0': 'Motivación',
      'M1': 'Saberes Previos',
      'M2': 'Modelado',
      'M3': 'Práctica Guiada',
      'M4': 'Práctica Independiente',
      'M5': 'Evaluación Final',
    };
    return names[momentoId] || momentoId;
  };

  const getMessageTypeColor = (messageType?: string): string => {
    const colors: Record<string, string> = {
      'PRAISING': 'border-l-green-500 bg-green-50/50',
      'CORRECTING': 'border-l-yellow-500 bg-yellow-50/50',
      'HINTING': 'border-l-blue-500 bg-blue-50/50',
      'EXPLAINING': 'border-l-purple-500 bg-purple-50/50',
      'QUESTIONING': 'border-l-indigo-500 bg-indigo-50/50',
    };
    return colors[messageType || ''] || '';
  };

  const getEvaluationBadge = (evaluation?: string) => {
    if (!evaluation) return null;

    const badges: Record<string, { variant: 'default' | 'secondary' | 'destructive'; icon: any }> = {
      'correct': { variant: 'default', icon: CheckCircle2 },
      'partial': { variant: 'secondary', icon: AlertTriangle },
      'incorrect': { variant: 'destructive', icon: AlertCircle },
    };

    const badge = badges[evaluation];
    if (!badge) return null;

    const Icon = badge.icon;

    return (
      <Badge variant={badge.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {evaluation === 'correct' ? 'Correcta' : evaluation === 'partial' ? 'Parcial' : 'Incorrecta'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <TeacherLayout userName={user?.nombre}>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">⏳ Cargando sesión...</p>
        </div>
      </TeacherLayout>
    );
  }

  if (error || !session) {
    return (
      <TeacherLayout userName={user?.nombre}>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{error || 'Sesión no encontrada'}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/teacher/evaluations')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a Evaluaciones
            </Button>
          </CardContent>
        </Card>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout userName={user?.nombre}>
      <div className="space-y-6">
        {/* Back Button + Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/teacher/evaluations')}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Evaluaciones
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Detalle de Sesión</h1>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Estudiante</p>
                <p className="text-lg">{session.userId}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Lección</p>
                <p className="text-lg">{lesson?.titulo || session.lessonId}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Iniciada</p>
                <p>{new Date(session.startedAt).toLocaleString('es-ES')}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Estado Actual</p>
                <Badge variant="outline">
                  {session.currentState} @ {session.currentMomento}
                </Badge>
              </div>
            </div>

            {/* Error info if exists */}
            {session.error_count && session.error_count > 0 && (
              <Card className="mt-4 border-yellow-500/50 bg-yellow-50/50">
                <CardContent className="pt-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Errores de procesamiento: {session.error_count}
                    {session.last_error && (
                      <span className="block text-xs mt-1 text-muted-foreground">
                        Último: {session.last_error.message} ({session.last_error.type})
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat ({Array.isArray(session.chatHistory) ? session.chatHistory.length : 0})
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Progreso
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Evaluaciones ({session.evaluations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              Reportes ({Array.isArray(session.studentReports) ? session.studentReports.filter((r: any) => r.status === 'pending').length : 0})
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-6">
            <ScrollArea className="h-[600px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {(Array.isArray(session.chatHistory) ? session.chatHistory : []).map((msg: any, idx: number) => (
                  <Card
                    key={msg.id || idx}
                    className={`${msg.role === 'assistant' ? `border-l-4 ${getMessageTypeColor(msg.message_type)}` : 'border-l-4 border-l-gray-300'}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {msg.role === 'assistant' ? (
                            <Bot className="h-4 w-4 text-primary" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-semibold">
                            {msg.role === 'assistant' ? 'SOPHI' : 'Estudiante'}
                          </span>
                          {msg.message_type && (
                            <Badge variant="secondary" className="text-xs">
                              {msg.message_type}
                            </Badge>
                          )}
                          {msg.metadata?.evaluation && getEvaluationBadge(msg.metadata.evaluation)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString('es-ES')}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {msg.metadata && (
                        <div className="mt-2 text-xs text-muted-foreground flex gap-3">
                          {msg.metadata.attempt_count && (
                            <span>Intento: {msg.metadata.attempt_count}</span>
                          )}
                          {msg.metadata.hint_level && (
                            <span>Nivel de pista: {msg.metadata.hint_level}</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="mt-6 space-y-6">
            {/* Momento Progress */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Progreso por Momento</h3>
              {session.momento_progress.map((progress) => (
                <Card key={progress.momento_id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {progress.momento_id} - {getMomentoName(progress.momento_id)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Iniciado: {new Date(progress.started_at).toLocaleString('es-ES')}
                        </CardDescription>
                        {progress.completed_at && (
                          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Completado: {new Date(progress.completed_at).toLocaleString('es-ES')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{progress.attempts}</div>
                        <p className="text-xs text-muted-foreground">intentos</p>
                        <p className="text-sm text-muted-foreground mt-1">{progress.hints_used} pistas</p>
                      </div>
                    </div>
                  </CardHeader>
                  {!progress.completed_at && (
                    <CardContent>
                      <Badge variant="secondary">⏳ En progreso</Badge>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Evidence Attempts */}
            {session.evidence_attempts && Object.keys(session.evidence_attempts).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">📝 Intentos por Evidencia</h3>
                {Object.entries(session.evidence_attempts).map(([evidenceKey, data]) => (
                  <Card key={evidenceKey}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-base">{evidenceKey}</CardTitle>
                          <CardDescription className="mt-1">
                            Intentos: {data.attempt_count} | Mejor score: {data.best_score}%
                          </CardDescription>
                          {data.status && (
                            <div className="mt-2">
                              <Badge variant={
                                data.status === 'completed' ? 'default' :
                                data.status === 'accepted_partial' ? 'secondary' :
                                'outline'
                              }>
                                {data.status === 'completed' ? '✓ Completado' :
                                 data.status === 'accepted_partial' ? '~ Parcial aceptado' :
                                 '⏳ Pendiente'}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {data.final_score !== undefined && (
                          <div className="text-3xl font-bold text-primary">
                            {data.final_score}%
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Evaluation Tab */}
          <TabsContent value="evaluation" className="mt-6">
            {session.evaluations && session.evaluations.length > 0 ? (
              <div className="space-y-6">
                {session.evaluations.map((evaluation, idx) => (
                  <Card key={evaluation.id || idx}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Evaluación Final</CardTitle>
                          <CardDescription>
                            {new Date(evaluation.timestamp).toLocaleString('es-ES')}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className={`text-4xl font-bold ${
                            evaluation.score >= 90 ? 'text-green-600' :
                            evaluation.score >= 70 ? 'text-blue-600' :
                            evaluation.score >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {evaluation.score}%
                          </div>
                          {evaluation.passed ? (
                            <Badge className="mt-2 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Aprobado
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="mt-2 gap-1">
                              <AlertCircle className="h-3 w-3" />
                              No aprobado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-semibold mb-2">Retroalimentación:</h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {evaluation.feedback}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No hay evaluaciones finales aún</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Las evaluaciones aparecerán cuando el estudiante complete la lección
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6 space-y-6">
            {/* Progress Tree */}
            {lesson && lesson.momentos && (
              <Card>
                <CardHeader>
                  <CardTitle>Árbol de Progreso</CardTitle>
                  <CardDescription>
                    Vista detallada del progreso del estudiante por momento y sub-momento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProgressTree
                    momentos={lesson.momentos}
                    momentoProgress={(session.metadata as any)?.momento_progress || []}
                    currentMomento={session.currentMomento}
                    errorCount={(session.metadata as any)?.error_count || 0}
                    onRestart={handleRestartFromMomento}
                  />
                </CardContent>
              </Card>
            )}

            {/* Student Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Reportes del Estudiante</CardTitle>
                <CardDescription>
                  Problemas reportados por el estudiante durante la lección
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(session.studentReports) && session.studentReports.length > 0 ? (
                  <div className="space-y-4">
                    {session.studentReports
                      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((report: any) => (
                        <Card
                          key={report.id}
                          className={`${
                            report.status === 'pending' ? 'border-yellow-500/50 bg-yellow-50/50' :
                            report.status === 'reviewed' ? 'border-blue-500/50 bg-blue-50/50' :
                            'border-green-500/50 bg-green-50/50'
                          }`}
                        >
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="font-mono">
                                    {report.momento_id}
                                  </Badge>
                                  <Badge variant={
                                    report.status === 'pending' ? 'default' :
                                    report.status === 'reviewed' ? 'secondary' :
                                    'outline'
                                  }>
                                    {report.status === 'pending' ? '🔔 Pendiente' :
                                     report.status === 'reviewed' ? '👁️ Revisado' :
                                     '✅ Resuelto'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(report.timestamp).toLocaleString('es-ES')}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold mb-2">Mensaje del estudiante:</p>
                                <p className="text-sm bg-background p-3 rounded border">
                                  {report.student_message}
                                </p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="bg-muted p-3 rounded text-xs space-y-1">
                              <p><strong>Contexto:</strong></p>
                              <p>• Última pregunta: {report.context.last_question.substring(0, 100)}...</p>
                              <p>• Mensajes: {report.context.chat_history_length}</p>
                              <p>• Intentos: {report.context.attempts}</p>
                              <p>• Errores: {report.context.error_count}</p>
                            </div>

                            {report.instructor_notes && (
                              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <p className="text-xs font-semibold text-blue-900 mb-1">Notas del instructor:</p>
                                <p className="text-sm text-blue-800">{report.instructor_notes}</p>
                              </div>
                            )}

                            <div className="flex gap-2">
                              {report.status === 'pending' && (
                                <Button size="sm" variant="outline">
                                  Marcar como Revisado
                                </Button>
                              )}
                              {report.status === 'reviewed' && (
                                <Button size="sm" variant="outline">
                                  Marcar como Resuelto
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay reportes del estudiante</p>
                    <p className="text-xs mt-2">
                      Los estudiantes pueden reportar problemas durante la lección
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Technical Errors */}
            {session.last_error && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Errores Técnicos
                  </CardTitle>
                  <CardDescription>
                    Errores del sistema detectados automáticamente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-destructive/10 p-4 rounded border border-destructive/20">
                    <p className="text-sm font-semibold mb-2">Último error:</p>
                    <p className="text-sm mb-2">{session.last_error.message}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Tipo: {session.last_error.type}</span>
                      <span>•</span>
                      <span>{new Date(session.last_error.timestamp).toLocaleString('es-ES')}</span>
                      <span>•</span>
                      <span>Total de errores: {session.error_count || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TeacherLayout>
  );
}
