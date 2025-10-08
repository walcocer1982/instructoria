'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ObjectiveCard } from "@/components/ui/objective-card";
import { MomentProgress } from "@/components/ui/moment-progress";
import { CriteriaChecklist } from "@/components/ui/criteria-checklist";
import { ImageViewer } from "@/components/ui/image-viewer";
import { Send, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Momento {
  id: string;
  nombre: string;
  min: number;
  actividad: string;
  evidencias: string[];
}

interface Lesson {
  id: string;
  titulo: string;
  objetivo: string;
  duracion_min?: number;
  duracion_minutos?: number;
  momentos: Momento[];
  criterios_evaluacion: string[];
  imagenes: Array<{
    url: string;
    descripcion: string;
    tipo?: string;
    momento_id?: string;
  }>;
}

interface Session {
  id: string;
  userId: string;
  lessonId: string;
  currentState: string;
  currentMomento: string;
  chatHistory: any[];
  metadata?: any; // Contains momento_progress, evaluations, etc.
  startedAt: string;
  lastActivity: string;
  completedAt?: string | null;
}

export default function StudentLessonPage() {
  const { data: authSession, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const lessonId = params.lessonId as string;

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (authSession?.user) {
      loadLessonAndSession(authSession.user.id);
    }
  }, [lessonId, authSession, status, router]);

  const loadLessonAndSession = async (studentId: string) => {
    try {
      const lessonResponse = await fetch(`/api/lessons?id=${lessonId}`);
      const lessonResult = await lessonResponse.json();

      if (!lessonResult.success || !lessonResult.lesson) {
        setError('Lección no encontrada');
        setLoading(false);
        return;
      }

      setLesson(lessonResult.lesson);

      const sessionResponse = await fetch(`/api/sessions?student_id=${studentId}&lesson_id=${lessonId}`);
      const sessionResult = await sessionResponse.json();

      if (sessionResult.success) {
        setSession(sessionResult.session);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar lección');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeChat = async () => {
    if (!session) return;

    setInitializing(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initialize',
          session_id: session.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSession(result.session);
      } else {
        setError(result.error || 'Error al inicializar chat');
      }
    } catch (err: any) {
      setError(err.message || 'Error al inicializar chat');
    } finally {
      setInitializing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !session || sending) return;

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_message',
          session_id: session.id,
          message: inputMessage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSession(result.session);
        setInputMessage('');
        setError(''); // Limpiar error si había
      } else {
        // Error del servidor - puede ser un error recuperable
        if (result.can_retry && result.session) {
          // La sesión fue revertida, actualizar UI
          setSession(result.session);
          setError(result.error || 'Error al enviar mensaje');
        } else {
          setError(result.error || 'Error al enviar mensaje');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSubmitReport = async () => {
    if (!reportMessage.trim() || !session || submittingReport) return;

    setSubmittingReport(true);

    try {
      const response = await fetch('/api/sessions/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          problemDescription: reportMessage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setReportDialogOpen(false);
        setReportMessage('');
        alert('✅ Reporte enviado al instructor correctamente. Recibirás ayuda pronto.');
      } else {
        alert('❌ Error al enviar reporte: ' + result.error);
      }
    } catch (err: any) {
      alert('❌ Error al enviar reporte: ' + err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  // Obtener criterios cumplidos desde evidence_attempts (en metadata)
  const getCriteriosCumplidos = (): string[] => {
    if (!session?.metadata?.evidence_attempts) return [];

    return Object.entries(session.metadata.evidence_attempts)
      .filter(([_, attempt]: [string, any]) => attempt.status === 'completed' || attempt.best_score >= 45)
      .map(([evidence]) => evidence);
  };

  // Obtener imagen actual del momento desde chatHistory
  // Las imágenes se adjuntan a los mensajes cuando el Orchestrator las envía
  const getCurrentImage = () => {
    if (!session?.chatHistory) return undefined;

    // Buscar en los mensajes del chat (de más reciente a más antiguo)
    // La imagen debe venir del último mensaje 'assistant' que tenga imágenes
    for (let i = session.chatHistory.length - 1; i >= 0; i--) {
      const msg = session.chatHistory[i];
      if (msg.role === 'assistant' && msg.images && msg.images.length > 0) {
        return msg.images[0]; // Retornar primera imagen del mensaje
      }
    }

    return undefined;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !lesson || !session) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
          {error || 'Error al cargar lección'}
        </div>
        <button
          onClick={() => router.push('/student')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          ← Volver a Mis Lecciones
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-muted/30">
      {/* Header Global - Solo Logo y Usuario */}
      <div className="shrink-0 border-b border-border bg-background px-6 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black text-primary">SOPHI</div>
            <div className="text-xs text-muted-foreground">Sistema Pedagógico Híbrido Inteligente</div>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <span>👤 {authSession?.user?.name || 'Estudiante'}</span>
          </div>
        </div>
      </div>

      {/* Contenedor de 3 paneles */}
      <div className="flex flex-1 min-h-0">
        {/* Panel Izquierdo: Objetivo + Criterios + Progreso */}
        <div className="w-[360px] border-r bg-background p-6 flex flex-col gap-4 overflow-y-auto">
          <ObjectiveCard objective={lesson.objetivo} />

          <CriteriaChecklist
            criterios={lesson.criterios_evaluacion || []}
            criteriosCumplidos={getCriteriosCumplidos()}
          />

          <MomentProgress
            momentos={lesson.momentos}
            currentMomento={session.currentMomento}
            momentoProgress={session.metadata?.momento_progress || []}
          />
        </div>

        {/* Panel Centro: Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Mini Header del Momento */}
          <div className="shrink-0 bg-background border-b px-6 py-4">
            <h2 className="text-2xl font-bold text-foreground">
              {lesson.momentos.find(m => m.id === session.currentMomento)?.nombre || 'Lección'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Momento {session.currentMomento} · Estado: {session.currentState.replace(/_/g, ' ')}
            </p>
          </div>

          {/* Banner de Error - Solo si hay error */}
          {error && (
            <div className="shrink-0 bg-destructive/10 border-b border-destructive/30 px-6 py-3">
              <div className="flex items-start gap-3">
                <div className="text-destructive">⚠️</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">{error}</p>
                  {session.metadata?.error_count && session.metadata.error_count >= 2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Varios intentos fallidos. Si el problema persiste, contacta al profesor.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <ScrollArea className="flex-1 min-h-0 p-6">
          {session.chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-semibold mb-2">Bienvenido a la Lección</h3>
              <p className="text-muted-foreground mb-6">
                Haz clic en el botón para comenzar. El tutor AI te guiará a través de cada momento.
              </p>
              <button
                onClick={handleInitializeChat}
                disabled={initializing}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {initializing && <Loader2 className="h-4 w-4 animate-spin" />}
                {initializing ? 'Inicializando...' : '🚀 Comenzar Lección'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {(Array.isArray(session.chatHistory) ? session.chatHistory : []).map((msg: any, index: number) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    <div className="text-xs opacity-70 mt-2">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input Area - Altura fija */}
        <div className="shrink-0 border-t bg-background p-4">
          <div className="space-y-3">
            {session.currentState === 'COMPLETED' ? (
              <div className="bg-secondary/10 text-secondary p-4 rounded-lg text-center">
                🎉 ¡Felicitaciones! Has completado toda la lección.
              </div>
            ) : session.currentState === 'WAITING_RESPONSE' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu respuesta aquí..."
                  disabled={sending}
                  className="flex-1 px-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !inputMessage.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold text-base shadow-md transition-all"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  {sending ? 'Enviando...' : '📤 Enviar'}
                </button>
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-lg text-center text-muted-foreground text-sm">
                {sending ? '⏳ Procesando tu respuesta...' : '🤖 El tutor está preparando el siguiente mensaje...'}
              </div>
            )}

            {/* Reportar Problema - Siempre visible */}
            {session.currentState !== 'COMPLETED' && (
              <div className="flex justify-center">
                <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Reportar Problema
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reportar Problema al Instructor</DialogTitle>
                      <DialogDescription>
                        Describe qué dificultad estás teniendo. El instructor recibirá tu mensaje y te ayudará.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                      <div>
                        <Label htmlFor="report-message">¿Qué problema tienes?</Label>
                        <Textarea
                          id="report-message"
                          value={reportMessage}
                          onChange={(e) => setReportMessage(e.target.value)}
                          placeholder="Ej: No entiendo la pregunta, el sistema no responde, hay un error..."
                          rows={4}
                          className="mt-2"
                        />
                      </div>
                      <div className="bg-muted p-3 rounded text-xs text-muted-foreground">
                        <p><strong>Contexto que se enviará:</strong></p>
                        <p>• Momento actual: {session.currentMomento}</p>
                        <p>• Estado: {session.currentState}</p>
                        <p>• Intentos: {(session.metadata?.momento_progress || []).find((p: any) => p.momento_id === session.currentMomento)?.attempts || 0}</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReportDialogOpen(false);
                          setReportMessage('');
                        }}
                        disabled={submittingReport}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSubmitReport}
                        disabled={submittingReport || !reportMessage.trim()}
                        className="gap-2"
                      >
                        {submittingReport ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4" />
                            Enviar Reporte
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Panel Derecho: Imagen + Descripción */}
        <div className="w-[420px] border-l bg-background p-6">
          <ImageViewer image={getCurrentImage()} className="h-full" />
        </div>
      </div>
    </div>
  );
}
