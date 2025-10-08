'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Lesson {
  id: string;
  titulo: string;
  objetivo: string;
  duracion_min: number;
  momentos: any[];
  publicada: boolean;
}

interface Session {
  id: string;
  lesson_id: string;
  current_momento: string;
  completed_at?: string;
  updated_at: string;
  momento_progress: Array<{
    momento_id: string;
    completed_at?: string;
  }>;
}

export default function EstudiantePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user) {
      loadData(session.user.id);
    }
  }, [session, status, router]);

  const loadData = async (userId: string) => {
    try {
      // Cargar lecciones publicadas
      const lessonsResponse = await fetch('/api/lessons?published=true');
      const lessonsResult = await lessonsResponse.json();

      if (lessonsResult.success) {
        setLessons(lessonsResult.lessons || []);
      }

      // Cargar sesiones del estudiante
      const sessionsResponse = await fetch(`/api/sessions?student_id=${userId}`);
      const sessionsResult = await sessionsResponse.json();

      if (sessionsResult.success) {
        setSessions(sessionsResult.sessions || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const getSessionForLesson = (lessonId: string) => {
    return sessions.find(s => s.lesson_id === lessonId && !s.completed_at);
  };

  const getLessonProgress = (lessonId: string) => {
    const session = getSessionForLesson(lessonId);
    if (!session) return 0;

    const completedMomentos = session.momento_progress.filter(p => p.completed_at).length;
    const totalMomentos = 6; // M0-M5
    return Math.round((completedMomentos / totalMomentos) * 100);
  };

  const handleStartLesson = (lessonId: string) => {
    router.push(`/student/lesson/${lessonId}`);
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #e2e8f0',
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.25rem' }}>
            Mis Lecciones
          </h1>
          <p style={{ color: '#718096' }}>Hola, {session.user.name}! 👋</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.625rem 1.25rem',
            background: '#f56565',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
          }}
        >
          Cerrar Sesión
        </button>
      </header>

      {error && (
        <div style={{
          padding: '1rem',
          background: '#fed7d7',
          color: '#c53030',
          borderRadius: '6px',
          marginBottom: '1.5rem',
        }}>
          {error}
        </div>
      )}

      {lessons.length === 0 ? (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          background: 'white',
          borderRadius: '12px',
          border: '2px dashed #e2e8f0',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: '#2d3748' }}>
            No hay lecciones disponibles aún
          </h2>
          <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
            Tu profesor aún no ha publicado ninguna lección.
            <br />
            Vuelve más tarde para ver contenido nuevo.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {lessons.map(lesson => {
            const session = getSessionForLesson(lesson.id);
            const progress = getLessonProgress(lesson.id);
            const hasStarted = !!session;

            return (
              <div
                key={lesson.id}
                style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#2d3748' }}>
                  {lesson.titulo}
                </h3>

                <p style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {lesson.objetivo}
                </p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#718096' }}>
                  <span>⏱️ {lesson.duracion_min} min</span>
                  <span>📋 {lesson.momentos.length} momentos</span>
                </div>

                {hasStarted && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                      <span style={{ color: '#718096' }}>Progreso</span>
                      <span style={{ fontWeight: '600', color: '#48bb78' }}>{progress}%</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: progress === 100 ? '#48bb78' : '#667eea',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.25rem' }}>
                      Momento actual: {session?.current_momento}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handleStartLesson(lesson.id)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: hasStarted ? '#667eea' : '#48bb78',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                  }}
                >
                  {hasStarted ? '▶️ Continuar Lección' : '🚀 Iniciar Lección'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
