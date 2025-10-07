'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeacherLayout } from '@/components/teacher/TeacherLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BookOpen, Edit, Trash2, Eye, EyeOff, Clock, ImageIcon, Layers, Plus, AlertCircle } from 'lucide-react';

export default function LessonsListPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userStr));
    loadLessons();
  }, [router]);

  const loadLessons = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('user');

      if (!userStr) {
        router.push('/login');
        return;
      }

      const userData = JSON.parse(userStr);

      const response = await fetch(`/api/lessons?profesor_id=${userData.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setLessons(result.lessons);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`/api/lessons?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        loadLessons();
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`/api/lessons?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ publicada: !currentStatus }),
      });

      const result = await response.json();

      if (result.success) {
        loadLessons();
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <TeacherLayout userName={user?.nombre}>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">⏳ Cargando lecciones...</p>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout userName={user?.nombre}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis Lecciones</h1>
            <p className="text-muted-foreground mt-2">
              {lessons.length} lección(es) creada(s)
            </p>
          </div>
          <Button onClick={() => router.push('/teacher/lessons/create')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Lección
          </Button>
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

        {/* Empty State */}
        {lessons.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                No has creado ninguna lección aún
              </h2>
              <p className="text-muted-foreground mb-6">
                Crea tu primera lección con ayuda de la IA
              </p>
              <Button onClick={() => router.push('/teacher/lessons/create')} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Primera Lección
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Lessons List */
          <div className="grid gap-4">
            {lessons.map((lesson) => (
              <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{lesson.titulo}</CardTitle>
                        {lesson.publicada ? (
                          <Badge className="gap-1">
                            <Eye className="h-3 w-3" />
                            Publicada
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <EyeOff className="h-3 w-3" />
                            Borrador
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{lesson.objetivo}</CardDescription>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.duracion_min} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {lesson.momentos?.length || 0} momentos
                        </span>
                        <span className="flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {lesson.imagenes?.length || 0} imágenes
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/teacher/lessons/edit/${lesson.id}`)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant={lesson.publicada ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => handleTogglePublish(lesson.id, lesson.publicada)}
                        className="gap-2"
                      >
                        {lesson.publicada ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            Despublicar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Publicar
                          </>
                        )}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. La lección &ldquo;{lesson.titulo}&rdquo; será eliminada permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(lesson.id)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>

                {/* Momentos Details */}
                {lesson.momentos && lesson.momentos.length > 0 && (
                  <CardContent>
                    <details className="group">
                      <summary className="cursor-pointer font-medium text-sm text-primary hover:underline list-none">
                        <span className="inline-flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          Ver estructura de momentos
                        </span>
                      </summary>
                      <div className="mt-3 space-y-2">
                        {lesson.momentos.map((momento: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 bg-muted rounded-md text-sm"
                          >
                            <span className="font-semibold">{momento.id}: {momento.nombre}</span>
                            <span className="text-muted-foreground ml-2">({momento.min} min)</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
