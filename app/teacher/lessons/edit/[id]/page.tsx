'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TeacherLayout } from '@/components/teacher/TeacherLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertCircle, ArrowLeft, Sparkles, Save, Loader2 } from 'lucide-react';
import { EvidenceManager } from '@/components/lessons/EvidenceManager';
import { ImageManager } from '@/components/lessons/ImageManager';
import { SubMomentoManager } from '@/components/lessons/SubMomentoManager';

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingStructure, setGeneratingStructure] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [titulo, setTitulo] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [duracionMin, setDuracionMin] = useState(60);
  const [criterios, setCriterios] = useState<string[]>(['']);
  const [imagenes, setImagenes] = useState<any[]>([]);
  const [momentos, setMomentos] = useState<any[]>([]);
  const [publicada, setPublicada] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`/api/lessons?id=${lessonId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success && result.lesson) {
        const lesson = result.lesson;
        setTitulo(lesson.titulo);
        setObjetivo(lesson.objetivo);
        setDuracionMin(lesson.duracion_min);
        setMomentos(lesson.momentos || []);
        setImagenes(lesson.imagenes || []);
        setCriterios(lesson.criterios_evaluacion || ['']);
        setPublicada(lesson.publicada || false);
      } else {
        setError('Lección no encontrada');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList): Promise<string[]> => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      return result.files.map((file: any) => file.url);
    } else {
      throw new Error(result.error || 'Error al subir imágenes');
    }
  };

  const handleGenerateStructure = async () => {
    if (!objetivo.trim()) {
      setError('Por favor ingresa un objetivo para la lección');
      return;
    }

    setGeneratingStructure(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/agents/planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          objective: objetivo,
          images: imagenes.map(img => ({
            url: img.url,
            descripcion: img.descripcion || '',
            tipo: img.tipo || 'contexto',
          })),
          constraints: [`Duración: ${duracionMin} minutos`],
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMomentos(result.data.momentos);
      } else {
        setError(result.error || 'Error al generar estructura');
      }
    } catch (err: any) {
      setError(err.message || 'Error al generar estructura');
    } finally {
      setGeneratingStructure(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');

      const updates = {
        titulo,
        objetivo,
        duracion_min: duracionMin,
        momentos,
        imagenes,
        criterios_evaluacion: criterios.filter(c => c.trim() !== ''),
      };

      const response = await fetch(`/api/lessons?id=${lessonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/teacher/lessons');
      } else {
        setError(result.error || 'Error al actualizar lección');
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar lección');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMomento = (index: number, field: string, value: any) => {
    const newMomentos = [...momentos];
    newMomentos[index] = { ...newMomentos[index], [field]: value };
    setMomentos(newMomentos);
  };

  if (loading) {
    return (
      <TeacherLayout userName={user?.nombre}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </TeacherLayout>
    );
  }

  // Preparar lista de momentos para ImageManager
  const momentosForImageManager = momentos.flatMap(m => {
    const base = [{ id: m.id, nombre: m.nombre }];
    if (m.sub_momentos && m.sub_momentos.length > 0) {
      return [...base, ...m.sub_momentos.map((sm: any) => ({ id: sm.id, nombre: sm.nombre }))];
    }
    return base;
  });

  return (
    <TeacherLayout userName={user?.nombre}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/teacher/lessons')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Lecciones
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editar Lección</h1>
              <p className="text-muted-foreground mt-2">
                Modifica todos los aspectos de tu lección
              </p>
            </div>
            {publicada && (
              <Badge className="gap-1">
                ✓ Publicada
              </Badge>
            )}
          </div>
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

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Información Básica</TabsTrigger>
            <TabsTrigger value="images">Imágenes</TabsTrigger>
            <TabsTrigger value="structure">Estructura</TabsTrigger>
          </TabsList>

          {/* TAB 1: Información Básica */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>
                  Título, objetivo y criterios de evaluación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título de la Lección *</Label>
                  <Input
                    id="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Introducción a [MAIN_CONCEPT]"
                  />
                </div>

                <div>
                  <Label htmlFor="objetivo">Objetivo Educativo *</Label>
                  <Textarea
                    id="objetivo"
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value)}
                    placeholder="Ej: Comprender [MAIN_CONCEPT] y aplicar [PROCESS] en situaciones prácticas"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Usa variables en INGLÉS: [MAIN_CONCEPT], [PROCESS], [THEORY]
                  </p>
                </div>

                <div>
                  <Label htmlFor="duracion">Duración Estimada (minutos)</Label>
                  <Input
                    id="duracion"
                    type="number"
                    value={duracionMin}
                    onChange={(e) => setDuracionMin(parseInt(e.target.value) || 60)}
                    min={15}
                    max={300}
                    className="w-32"
                  />
                </div>
              </CardContent>
            </Card>

            <EvidenceManager
              evidencias={criterios}
              onChange={setCriterios}
              title="Criterios de Evaluación"
              description="Define los criterios que usarás para evaluar el aprendizaje"
            />
          </TabsContent>

          {/* TAB 2: Imágenes */}
          <TabsContent value="images">
            <ImageManager
              imagenes={imagenes}
              onChange={setImagenes}
              momentos={momentosForImageManager}
              onUpload={handleImageUpload}
            />
          </TabsContent>

          {/* TAB 3: Estructura */}
          <TabsContent value="structure" className="space-y-6">
            {/* Regenerar con IA */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Regenerar Estructura con IA
                </CardTitle>
                <CardDescription>
                  Si modificaste el objetivo, puedes regenerar los 6 momentos pedagógicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGenerateStructure}
                  disabled={generatingStructure || !objetivo.trim()}
                  className="gap-2"
                >
                  {generatingStructure ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Regenerar Estructura
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Edición de Momentos */}
            {momentos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No hay momentos. Usa el botón de arriba para generar la estructura.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {momentos.map((momento, momentoIndex) => (
                  <AccordionItem
                    key={momentoIndex}
                    value={`momento-${momentoIndex}`}
                    className="border border-border rounded-lg px-4 data-[state=open]:border-primary"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <Badge variant="outline" className="font-mono">
                          {momento.id}
                        </Badge>
                        <span className="font-semibold">{momento.nombre}</span>
                        <span className="text-sm text-muted-foreground ml-auto mr-4">
                          {momento.min} min
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nombre del Momento</Label>
                          <Input
                            value={momento.nombre}
                            onChange={(e) => handleUpdateMomento(momentoIndex, 'nombre', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Duración (minutos)</Label>
                          <Input
                            type="number"
                            min={1}
                            value={momento.min}
                            onChange={(e) => handleUpdateMomento(momentoIndex, 'min', parseInt(e.target.value) || 0)}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Actividad</Label>
                        <Textarea
                          value={momento.actividad}
                          onChange={(e) => handleUpdateMomento(momentoIndex, 'actividad', e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Pregunta Guía (opcional)</Label>
                        <Input
                          value={momento.pregunta_guia || ''}
                          onChange={(e) => handleUpdateMomento(momentoIndex, 'pregunta_guia', e.target.value)}
                          placeholder="¿Qué pregunta guiará este momento?"
                        />
                      </div>

                      <EvidenceManager
                        evidencias={momento.evidencias || ['']}
                        onChange={(newEvidencias) => handleUpdateMomento(momentoIndex, 'evidencias', newEvidencias)}
                        title={`Evidencias de ${momento.id}`}
                        description="¿Qué debe demostrar el estudiante en este momento?"
                      />

                      <SubMomentoManager
                        subMomentos={momento.sub_momentos || []}
                        onChange={(newSubMomentos) => handleUpdateMomento(momentoIndex, 'sub_momentos', newSubMomentos)}
                        momentoId={momento.id}
                        momentoNombre={momento.nombre}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/teacher/lessons')}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !titulo.trim() || !objetivo.trim() || momentos.length === 0}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </TeacherLayout>
  );
}
