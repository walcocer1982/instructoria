'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface TopicImage {
  id: string
  title: string
  url: string
  priority: 'critical' | 'practical' | 'optional'
  when_to_show: string
  usage_contexts?: string[]
  description: string
  keywords: string[]
}

interface ImageGalleryPanelProps {
  images: TopicImage[]
  onImageClick: (image: TopicImage) => void
  isOpen: boolean
  onClose: () => void
  currentImage: TopicImage | null
  showAllImages: boolean
  onToggleShowAll: () => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function ImageGalleryPanel({ images, onImageClick, isOpen, onClose, currentImage, showAllImages, onToggleShowAll, isMobileOpen = false, onMobileClose }: ImageGalleryPanelProps) {
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Determinar qué imágenes mostrar
  const imagesToDisplay = showAllImages
    ? (selectedPriority === 'all' ? images : images.filter(img => img.priority === selectedPriority))
    : currentImage
      ? [currentImage]
      : [] // Al inicio, sin imagen actual, mostrar vacío

  const filteredImages = imagesToDisplay

  return (
    <aside
      className={cn(
        'border-l bg-white  transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-80',
        // Mobile: hidden por default, fixed cuando está abierto
        'hidden sm:flex',
        isMobileOpen && 'flex fixed top-14 bottom-0 right-0 z-50 sm:static'
      )}
    >
        {/* Header con toggle */}
        <div className="h-14 border-b  flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* Botón colapsar (solo desktop) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn('h-8 w-8 hidden sm:flex', isCollapsed && 'mx-auto')}
              title={isCollapsed ? 'Expandir panel' : 'Contraer panel'}
            >
              {isCollapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            {!isCollapsed && (
              <span className="text-sm font-semibold text-gray-700">Panel de Imágenes</span>
            )}
          </div>
          {/* Botón cerrar (solo mobile) */}
          {onMobileClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileClose}
              className="h-8 w-8 sm:hidden"
              title="Cerrar panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>

        {/* Botones de acción - Solo cuando expandido */}
        {!isCollapsed && (
          <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center gap-2">
            <p className="text-sm text-gray-500">
              {currentImage && !showAllImages
                ? `Mostrando 1 de ${images.length}`
                : showAllImages
                  ? `${images.length} disponibles`
                  : images.length > 0
                    ? 'Esperando...'
                    : 'No disponibles'
              }
            </p>
            {currentImage && !showAllImages && (
              <button
                onClick={onToggleShowAll}
                className="cursor-pointer px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
              >
                Ver todas
              </button>
            )}
            {showAllImages && currentImage && (
              <button
                onClick={onToggleShowAll}
                className="cursor-pointer px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
              >
                Solo actual
              </button>
            )}
          </div>
        )}
        {/* Contenido expandido - Lista de imágenes */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredImages.length === 0 ? (
              <div className="text-center py-12 px-6 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-700 mb-2">Imágenes educativas</p>
                <p className="text-xs text-gray-500">El instructor te mostrará imágenes cuando sean relevantes para la explicación</p>
              </div>
            ) : (
              filteredImages.map(image => (
                <button
                  key={image.id}
                  onClick={() => onImageClick(image)}
                  className="w-full cursor-pointer group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-gray-300 transition"
                >
                  {/* Imagen preview */}
                  <div className="relative w-full h-32 bg-gray-100">
                    <Image
                      src={image.url}
                      alt={image.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="320px"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                      {image.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {image.description}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Vista colapsada - Solo iconos */}
        {isCollapsed && (
          <div className="flex-1 flex flex-col items-center gap-4 py-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 relative"
              title={`${images.length} imágenes disponibles`}
              onClick={() => setIsCollapsed(false)}
            >
              <span className="text-xl">🖼️</span>
              {images.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {images.length}
                </span>
              )}
            </Button>
            {currentImage && (
              <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-blue-500">
                <Image
                  src={currentImage.url}
                  alt={currentImage.title}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
            )}
          </div>
        )}
      </aside>
  )
}
