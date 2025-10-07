"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Image as ImageIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageViewerProps {
  image?: {
    url: string
    descripcion: string
  }
  className?: string
}

export function ImageViewer({ image, className }: ImageViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!image) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="p-6 flex flex-col items-center justify-center h-full text-muted-foreground">
          <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-sm">No hay imagen disponible</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className={cn("flex flex-col h-full", className)}>
        {/* Imagen (70% altura) */}
        <Card className="flex-[7] overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-0 h-full flex items-center justify-center bg-muted/20">
            <img
              src={image.url}
              alt={image.descripcion}
              className="w-full h-full object-contain hover:brightness-105 transition-all"
              onClick={() => setIsModalOpen(true)}
            />
          </CardContent>
        </Card>

        {/* Descripción (30% altura) */}
        <Card className="flex-[3] mt-4">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Descripción</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed overflow-auto">
              {image.descripcion}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modal Fullscreen */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={image.url}
              alt={image.descripcion}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <p className="text-white text-center mt-4 text-sm">
              {image.descripcion}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
