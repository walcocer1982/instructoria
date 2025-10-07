/**
 * Componente para gestionar sub-momentos de un momento pedagógico
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { EvidenceManager } from './EvidenceManager';

interface SubMomento {
  id: string;
  nombre: string;
  min: number;
  actividad: string;
  evidencias: string[];
  pregunta_guia?: string;
}

interface SubMomentoManagerProps {
  subMomentos: SubMomento[];
  onChange: (subMomentos: SubMomento[]) => void;
  momentoId: string;
  momentoNombre: string;
}

export function SubMomentoManager({
  subMomentos,
  onChange,
  momentoId,
  momentoNombre,
}: SubMomentoManagerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAdd = () => {
    const nextNumber = subMomentos.length + 1;
    const newSubMomento: SubMomento = {
      id: `${momentoId}.${nextNumber}`,
      nombre: '',
      min: 10,
      actividad: '',
      evidencias: [''],
      pregunta_guia: '',
    };
    onChange([...subMomentos, newSubMomento]);
    setExpandedIndex(subMomentos.length);
  };

  const handleRemove = (index: number) => {
    const newSubMomentos = subMomentos.filter((_, i) => i !== index);
    // Renumerar IDs
    const renumbered = newSubMomentos.map((sm, i) => ({
      ...sm,
      id: `${momentoId}.${i + 1}`,
    }));
    onChange(renumbered);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleUpdate = (index: number, field: keyof SubMomento, value: any) => {
    const newSubMomentos = [...subMomentos];
    newSubMomentos[index] = { ...newSubMomentos[index], [field]: value };
    onChange(newSubMomentos);
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sub-Momentos de {momentoNombre}</CardTitle>
        <CardDescription>
          Divide este momento en actividades más pequeñas (opcional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subMomentos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay sub-momentos. Agrega uno si necesitas dividir esta actividad.
          </p>
        ) : (
          <div className="space-y-3">
            {subMomentos.map((subMomento, index) => (
              <Card key={index} className="border-l-4 border-l-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-mono text-sm font-semibold">
                        {subMomento.id}
                      </span>
                      <Input
                        placeholder="Nombre del sub-momento"
                        value={subMomento.nombre}
                        onChange={(e) => handleUpdate(index, 'nombre', e.target.value)}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Input
                          type="number"
                          min={1}
                          value={subMomento.min}
                          onChange={(e) => handleUpdate(index, 'min', parseInt(e.target.value) || 0)}
                          className="w-16"
                        />
                        <span className="text-sm text-muted-foreground">min</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpand(index)}
                      >
                        {expandedIndex === index ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expandedIndex === index && (
                  <CardContent className="space-y-4 pt-0">
                    {/* Actividad */}
                    <div>
                      <Label htmlFor={`actividad-${index}`}>Actividad</Label>
                      <Textarea
                        id={`actividad-${index}`}
                        placeholder="Describe la actividad de este sub-momento..."
                        value={subMomento.actividad}
                        onChange={(e) => handleUpdate(index, 'actividad', e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* Pregunta Guía */}
                    <div>
                      <Label htmlFor={`pregunta-${index}`}>Pregunta Guía (opcional)</Label>
                      <Input
                        id={`pregunta-${index}`}
                        placeholder="¿Qué pregunta guiará este sub-momento?"
                        value={subMomento.pregunta_guia || ''}
                        onChange={(e) => handleUpdate(index, 'pregunta_guia', e.target.value)}
                      />
                    </div>

                    {/* Evidencias */}
                    <EvidenceManager
                      evidencias={subMomento.evidencias}
                      onChange={(newEvidencias) => handleUpdate(index, 'evidencias', newEvidencias)}
                      title={`Evidencias de ${subMomento.id}`}
                      description="¿Qué debe demostrar el estudiante en este sub-momento?"
                    />
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar Sub-Momento
        </Button>
      </CardContent>
    </Card>
  );
}
