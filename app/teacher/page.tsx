'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TeacherLayout } from '@/components/teacher/TeacherLayout';
import { StatCard } from '@/components/teacher/StatCard';
import { BookPlus, Library, BarChart3, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfesorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación
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
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <TeacherLayout userName={user?.nombre}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel del Profesor</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus lecciones, estudiantes y evaluaciones
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Crear Lección"
            description="Crea una nueva lección con el asistente de IA"
            icon={BookPlus}
            buttonLabel="Nueva Lección"
            onButtonClick={() => router.push('/teacher/lessons/create')}
            variant="info"
          />

          <StatCard
            title="Mis Lecciones"
            description="Ver y editar lecciones creadas"
            icon={Library}
            buttonLabel="Ver Lecciones"
            onButtonClick={() => router.push('/teacher/lessons')}
            variant="default"
          />

          <StatCard
            title="Evaluaciones"
            description="Ver evaluaciones y progreso de estudiantes"
            icon={BarChart3}
            buttonLabel="Ver Evaluaciones"
            onButtonClick={() => router.push('/teacher/evaluations')}
            variant="success"
          />
        </div>

        {/* Dev Tools Section */}
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Herramientas de Desarrollo</CardTitle>
            </div>
            <CardDescription>
              Utilidades para probar funcionalidades del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => router.push('/test-chat')}
              className="gap-2"
            >
              <FlaskConical className="h-4 w-4" />
              Test Chat (Agentes)
            </Button>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
}
