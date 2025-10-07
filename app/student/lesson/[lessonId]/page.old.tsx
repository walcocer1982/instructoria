'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
}

interface Session {
  id: string;
  student_id: string;
  lesson_id: string;
  current_state: string;
  current_momento: string;
  momento_progress: Array<{
    momento_id: string;
    started_at: string;
    completed_at?: string;
    attempts: number;
    hints_used: number;
  }>;
  chat_history: any[];
  evaluations: any[];
}

export default function StudentLessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.lessonId as string;

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const chatContainerRef = useState<any>(null);
  const [modalImage, setModalImage] = useState<{url: string; descripcion: string} | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.rol !== 'estudiante') {
      router.push('/teacher');
      return;
    }

    setUser(userData);
    loadLessonAndSession(userData.id, token);
  }, [lessonId]);

  const loadLessonAndSession = async (studentId: string, token: string) => {
    try {
      // Cargar lección
      const lessonResponse = await fetch(`/api/lessons?id=${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const lessonResult = await lessonResponse.json();

      if (!lessonResult.success || !lessonResult.lesson) {
        setError('Lección no encontrada');
        setLoading(false);
        return;
      }

      setLesson(lessonResult.lesson);

      // Cargar o crear sesión
      const sessionResponse = await fetch(`/api/sessions?student_id=${studentId}&lesson_id=${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
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

  const getMomentoStatus = (momentoId: string) => {
    if (!session) return 'locked';

    const progress = session.momento_progress.find(p => p.momento_id === momentoId);
    if (!progress) return 'locked';
    if (progress.completed_at) return 'completed';
    if (session.current_momento === momentoId) return 'active';
    return 'locked';
  };

  const getMomentoIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'active': return '▶️';
      default: return '🔒';
    }
  };

  const handleInitializeChat = async () => {
    if (!session) return;

    setInitializing(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      } else {
        setError(result.error || 'Error al enviar mensaje');
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

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cargando lección...</p>
      </div>
    );
  }

  if (error || !lesson || !session) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          padding: '1.5rem',
          background: '#fed7d7',
          color: '#c53030',
          borderRadius: '6px',
          marginBottom: '1rem',
        }}>
          {error || 'Error al cargar lección'}
        </div>
        <button
          onClick={() => router.push('/student')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          ← Volver a Mis Lecciones
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar: Momentos */}
      <div style={{
        width: '280px',
        background: '#f7fafc',
        borderRight: '2px solid #e2e8f0',
        padding: '1.5rem',
        overflowY: 'auto',
      }}>
        <button
          onClick={() => router.push('/student')}
          style={{
            padding: '0.5rem 1rem',
            background: '#e2e8f0',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '1rem',
            width: '100%',
            fontSize: '0.875rem',
          }}
        >
          ← Volver
        </button>

        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>
          {lesson.titulo}
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '1.5rem' }}>
          ⏱️ {lesson.duracion_minutos || lesson.duracion_min || 45} min
        </p>

        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#4a5568', textTransform: 'uppercase' }}>
          Momentos Pedagógicos
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {lesson.momentos.map((momento) => {
            const status = getMomentoStatus(momento.id);
            const isActive = status === 'active';
            const isCompleted = status === 'completed';

            return (
              <div
                key={momento.id}
                style={{
                  padding: '0.75rem',
                  background: isActive ? '#667eea' : isCompleted ? '#c6f6d5' : 'white',
                  color: isActive ? 'white' : isCompleted ? '#22543d' : '#718096',
                  border: `1px solid ${isActive ? '#667eea' : isCompleted ? '#9ae6b4' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '600' : '500',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span>{getMomentoIcon(status)}</span>
                  <span style={{ fontWeight: '600' }}>{momento.id}</span>
                </div>
                <div style={{ fontSize: '0.75rem', marginLeft: '1.75rem' }}>
                  {momento.nombre}
                </div>
                <div style={{ fontSize: '0.7rem', marginLeft: '1.75rem', opacity: 0.8 }}>
                  {momento.min} min
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Summary */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'white',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.5rem' }}>
            Progreso General
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#e2e8f0',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.round((session.momento_progress.filter(p => p.completed_at).length / 6) * 100)}%`,
              height: '100%',
              background: '#667eea',
              transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ fontSize: '0.7rem', color: '#a0aec0', marginTop: '0.25rem' }}>
            {session.momento_progress.filter(p => p.completed_at).length} de 6 completados
          </div>
        </div>
      </div>

      {/* Main Content: Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '2px solid #e2e8f0',
          background: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2d3748' }}>
                {lesson.momentos.find(m => m.id === session.current_momento)?.nombre || 'Lección'}
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#718096' }}>
                Momento {session.current_momento}
              </p>
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              background: '#e2e8f0',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#4a5568',
            }}>
              Estado: {session.current_state}
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          background: '#f9fafb',
        }}>
          {error && (
            <div style={{
              padding: '1rem',
              background: '#fed7d7',
              color: '#c53030',
              borderRadius: '6px',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          {session.chat_history.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              background: 'white',
              borderRadius: '12px',
              border: '2px dashed #e2e8f0',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>
                Bienvenido a la Lección
              </h3>
              <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                Haz clic en el botón para comenzar. El tutor AI te guiará a través de cada momento.
              </p>
              <button
                onClick={handleInitializeChat}
                disabled={initializing}
                style={{
                  padding: '0.875rem 2rem',
                  background: initializing ? '#a0aec0' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: initializing ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                }}
              >
                {initializing ? '⏳ Inicializando...' : '🚀 Comenzar Lección'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {session.chat_history.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                  }}
                >
                  <div style={{
                    padding: '1rem',
                    background: msg.role === 'user' ? '#667eea' : 'white',
                    color: msg.role === 'user' ? 'white' : '#2d3748',
                    borderRadius: '12px',
                    border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // Estilos para elementos markdown
                          p: ({children}) => <p style={{ marginBottom: '0.5rem' }}>{children}</p>,
                          strong: ({children}) => <strong style={{ fontWeight: 600, color: msg.role === 'user' ? 'white' : '#2d3748' }}>{children}</strong>,
                          em: ({children}) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                          ul: ({children}) => <ul style={{ marginLeft: '1.25rem', marginBottom: '0.5rem', listStyleType: 'disc' }}>{children}</ul>,
                          ol: ({children}) => <ol style={{ marginLeft: '1.25rem', marginBottom: '0.5rem', listStyleType: 'decimal' }}>{children}</ol>,
                          li: ({children}) => <li style={{ marginBottom: '0.25rem' }}>{children}</li>,
                          h1: ({children}) => <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{children}</h1>,
                          h2: ({children}) => <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{children}</h2>,
                          h3: ({children}) => <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{children}</h3>,
                          code: ({children}) => <code style={{ background: msg.role === 'user' ? 'rgba(255,255,255,0.2)' : '#f7fafc', padding: '0.125rem 0.25rem', borderRadius: '0.25rem', fontSize: '0.85em' }}>{children}</code>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    {msg.images && msg.images.length > 0 && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {msg.images.map((img: any, i: number) => (
                          <div
                            key={i}
                            onClick={() => setModalImage(img)}
                            style={{
                              width: '100px',
                              height: '100px',
                              borderRadius: '8px',
                              border: '2px solid #667eea',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <img
                              src={img.url}
                              alt={img.descripcion}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            <div style={{
                              position: 'absolute',
                              bottom: '0',
                              left: '0',
                              right: '0',
                              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                              color: 'white',
                              fontSize: '0.7rem',
                              padding: '4px',
                              textAlign: 'center',
                            }}>
                              🔍 Ver
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{
                      fontSize: '0.7rem',
                      marginTop: '0.5rem',
                      opacity: 0.7,
                    }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{
          padding: '1.5rem',
          borderTop: '2px solid #e2e8f0',
          background: 'white',
        }}>
          {session.current_state === 'COMPLETED' ? (
            <div style={{
              padding: '1.5rem',
              background: '#c6f6d5',
              borderRadius: '6px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
              <p style={{ color: '#22543d', fontWeight: '600' }}>
                ¡Felicitaciones! Has completado toda la lección.
              </p>
            </div>
          ) : session.current_state === 'WAITING_RESPONSE' ? (
            <>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
              }}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu respuesta aquí..."
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    background: 'white',
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !inputMessage.trim()}
                  style={{
                    padding: '0.875rem 1.5rem',
                    background: (sending || !inputMessage.trim()) ? '#e2e8f0' : '#667eea',
                    color: (sending || !inputMessage.trim()) ? '#a0aec0' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (sending || !inputMessage.trim()) ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                  }}
                >
                  {sending ? '⏳ Enviando...' : 'Enviar'}
                </button>
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: '#718096',
                marginTop: '0.5rem',
                textAlign: 'center',
              }}>
                💡 Presiona Enter para enviar tu respuesta
              </p>
            </>
          ) : (
            <div style={{
              padding: '1rem',
              background: '#f7fafc',
              borderRadius: '6px',
              textAlign: 'center',
              color: '#718096',
              fontSize: '0.875rem',
            }}>
              {sending ? '⏳ Procesando tu respuesta...' : '🤖 El tutor está preparando el siguiente mensaje...'}
            </div>
          )}
        </div>
      </div>

      {/* Modal de imagen */}
      {modalImage && (
        <div
          onClick={() => setModalImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '2rem',
            cursor: 'pointer',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
              cursor: 'default',
            }}
          >
            <img
              src={modalImage.url}
              alt={modalImage.descripcion}
              style={{
                maxWidth: '70%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            />
            <div style={{
              position: 'absolute',
              bottom: '-40px',
              left: '0',
              right: '0',
              color: 'white',
              textAlign: 'center',
              fontSize: '0.875rem',
            }}>
              {modalImage.descripcion}
            </div>
            <button
              onClick={() => setModalImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontSize: '1.25rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}