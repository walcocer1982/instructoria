'use client'

import { useState } from 'react'
import Image from 'next/image'

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

interface ImagePanelProps {
  images: TopicImage[]
  onImageClick: (image: TopicImage) => void
  isOpen: boolean
  onClose: () => void
  currentImage: TopicImage | null
  showAllImages: boolean
  onToggleShowAll: () => void
}

export function ImagePanel({ images, onImageClick, isOpen, onClose, currentImage, showAllImages, onToggleShowAll }: ImagePanelProps) {
  const [selectedPriority, setSelectedPriority] = useState<string>('all')

  // Determinar qué imágenes mostrar
  const imagesToDisplay = showAllImages
    ? (selectedPriority === 'all' ? images : images.filter(img => img.priority === selectedPriority))
    : currentImage
    ? [currentImage]
    : [] // Al inicio, sin imagen actual, mostrar vacío

  const filteredImages = imagesToDisplay

  const priorityColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    practical: 'bg-blue-100 text-blue-800 border-blue-300',
    optional: 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const priorityLabels = {
    critical: 'Críticas',
    practical: 'Prácticas',
    optional: 'Opcionales'
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel lateral */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          lg:translate-x-0 lg:static lg:z-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Imágenes</h2>
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
            </div>
            <div className="flex items-center gap-2">
              {currentImage && !showAllImages && (
                <button
                  onClick={onToggleShowAll}
                  className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
                >
                  Ver todas
                </button>
              )}
              {showAllImages && currentImage && (
                <button
                  onClick={onToggleShowAll}
                  className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                >
                  Solo actual
                </button>
              )}
              <button
                onClick={onClose}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Cerrar panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filtros - Solo mostrar cuando se ven todas las imágenes */}
          {showAllImages && (
          <div className="p-4 border-b border-gray-200">
            <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">
              Filtrar por prioridad
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPriority('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  selectedPriority === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas ({images.length})
              </button>
              {(['critical', 'practical', 'optional'] as const).map(priority => {
                const count = images.filter(img => img.priority === priority).length
                if (count === 0) return null

                return (
                  <button
                    key={priority}
                    onClick={() => setSelectedPriority(priority)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      selectedPriority === priority
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {priorityLabels[priority]} ({count})
                  </button>
                )
              })}
            </div>
          </div>
          )}

          {/* Lista de imágenes */}
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
                  className="w-full group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-gray-300 transition"
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
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold border ${priorityColors[image.priority]}`}>
                      {priorityLabels[image.priority]}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                      {image.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {image.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 italic">{image.when_to_show}</span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
