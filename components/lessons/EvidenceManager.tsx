/**
 * Componente para gestionar evidencias de un momento o sub-momento
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface EvidenceManagerProps {
  evidencias: string[];
  onChange: (evidencias: string[]) => void;
  title?: string;
  description?: string;
}

export function EvidenceManager({
  evidencias,
  onChange,
  title = "Evidencias de Aprendizaje",
  description = "Define qué debe demostrar el estudiante"
}: EvidenceManagerProps) {

  const handleAdd = () => {
    onChange([...evidencias, '']);
  };

  const handleRemove = (index: number) => {
    onChange(evidencias.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, value: string) => {
    const newEvidencias = [...evidencias];
    newEvidencias[index] = value;
    onChange(newEvidencias);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        {evidencias.map((evidencia, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`Evidencia ${index + 1}: Ej: Identifica correctamente los peligros...`}
              value={evidencia}
              onChange={(e) => handleChange(index, e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={() => handleRemove(index)}
              disabled={evidencias.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar Evidencia
        </Button>
      </CardContent>
    </Card>
  );
}
