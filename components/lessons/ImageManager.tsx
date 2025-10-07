/**
 * Componente para gestionar imágenes de la lección
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';

interface ImageData {
  url: string;
  descripcion: string;
  tipo: 'contexto' | 'ejemplo' | 'diagrama' | 'recurso';
  momento_id?: string;
}

interface ImageManagerProps {
  imagenes: ImageData[];
  onChange: (imagenes: ImageData[]) => void;
  momentos: Array<{ id: string; nombre: string }>;
  onUpload?: (files: FileList) => Promise<string[]>; // Retorna URLs de las imágenes subidas
}

export function ImageManager({ imagenes, onChange, momentos, onUpload }: ImageManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onUpload) return;

    setUploading(true);
    try {
      const urls = await onUpload(files);
      const newImages: ImageData[] = urls.map(url => ({
        url,
        descripcion: '',
        tipo: 'contexto' as const,
        momento_id: 'M0',
      }));
      onChange([...imagenes, ...newImages]);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleAddFromUrl = () => {
    if (!urlInput.trim()) return;

    const newImage: ImageData = {
      url: urlInput.trim(),
      descripcion: '',
      tipo: 'contexto' as const,
      momento_id: 'M0',
    };

    onChange([...imagenes, newImage]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemove = (index: number) => {
    onChange(imagenes.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: keyof ImageData, value: string) => {
    const newImages = [...imagenes];
    newImages[index] = { ...newImages[index], [field]: value };
    onChange(newImages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Imágenes de la Lección
        </CardTitle>
        <CardDescription>
          Sube imágenes y asígnalas a momentos específicos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL Input */}
        {!showUrlInput ? (
          <div
            onClick={() => setShowUrlInput(true)}
            className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          >
            <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">
              Agregar Imagen desde URL
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Pega la URL de cualquier imagen en internet
            </p>
          </div>
        ) : (
          <Card className="border-primary">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="url-input">URL de la Imagen *</Label>
                  <Input
                    id="url-input"
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFromUrl();
                      }
                    }}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ejemplo: https://www.ejemplo.com/imagen.jpg
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleAddFromUrl}
                    disabled={!urlInput.trim()}
                    className="flex-1"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Agregar Imagen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowUrlInput(false);
                      setUrlInput('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Images List */}
        {imagenes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Imágenes Subidas ({imagenes.length})</h4>
              <p className="text-xs text-muted-foreground">Click para expandir y editar</p>
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {imagenes.map((imagen, index) => (
                <AccordionItem
                  key={index}
                  value={`imagen-${index}`}
                  className="border border-border rounded-lg px-4 data-[state=open]:border-primary"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img
                          src={imagen.url}
                          alt={imagen.descripcion || `Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<ImageIcon className="h-6 w-6 text-muted-foreground" />';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {imagen.descripcion || `Imagen ${index + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {imagen.url}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {imagen.tipo}
                          </Badge>
                          {imagen.momento_id && (
                            <Badge variant="outline" className="text-xs">
                              {imagen.momento_id}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4 pb-2">
                    <div className="flex gap-4">
                      {/* Preview grande */}
                      <div className="w-32 h-32 rounded border bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img
                          src={imagen.url}
                          alt={imagen.descripcion || `Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement!;
                            parent.innerHTML = `
                              <div class="flex flex-col items-center gap-2 text-muted-foreground">
                                <svg class="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p class="text-xs">Error al cargar</p>
                              </div>
                            `;
                          }}
                        />
                      </div>

                      <div className="flex-1 space-y-3">
                        {/* URL */}
                        <div>
                          <Label htmlFor={`url-${index}`}>URL de la Imagen *</Label>
                          <Input
                            id={`url-${index}`}
                            type="url"
                            placeholder="https://ejemplo.com/imagen.jpg"
                            value={imagen.url}
                            onChange={(e) => handleUpdate(index, 'url', e.target.value)}
                          />
                        </div>

                        {/* Descripción */}
                        <div>
                          <Label htmlFor={`desc-${index}`}>Descripción *</Label>
                          <Textarea
                            id={`desc-${index}`}
                            placeholder="Describe qué muestra esta imagen y su propósito pedagógico..."
                            value={imagen.descripcion}
                            onChange={(e) => handleUpdate(index, 'descripcion', e.target.value)}
                            rows={2}
                          />
                        </div>

                        {/* Tipo y Momento */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`tipo-${index}`}>Tipo</Label>
                            <Select
                              value={imagen.tipo}
                              onValueChange={(value) => handleUpdate(index, 'tipo', value)}
                            >
                              <SelectTrigger id={`tipo-${index}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="contexto">Contexto</SelectItem>
                                <SelectItem value="ejemplo">Ejemplo</SelectItem>
                                <SelectItem value="diagrama">Diagrama</SelectItem>
                                <SelectItem value="recurso">Recurso</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor={`momento-${index}`}>Momento</Label>
                            <Select
                              value={imagen.momento_id || ''}
                              onValueChange={(value) => handleUpdate(index, 'momento_id', value)}
                            >
                              <SelectTrigger id={`momento-${index}`}>
                                <SelectValue placeholder="Selecciona..." />
                              </SelectTrigger>
                              <SelectContent>
                                {momentos.map((momento) => (
                                  <SelectItem key={momento.id} value={momento.id}>
                                    {momento.id} - {momento.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemove(index)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar Imagen
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {imagenes.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No hay imágenes aún. Sube la primera imagen.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
