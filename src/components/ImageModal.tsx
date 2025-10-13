'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { TopicImage } from './ImagePanel'

interface ImageModalProps {
  image: TopicImage | null
  isOpen: boolean
  onClose: () => void
}

export function ImageModal({ image, isOpen, onClose }: ImageModalProps) {
  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !image) return null

  const priorityColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    practical: 'bg-blue-100 text-blue-800 border-blue-300',
    optional: 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const priorityLabels = {
    critical: 'Crítica',
    practical: 'Práctica',
    optional: 'Opcional'
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-90 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{image.title}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${priorityColors[image.priority]}`}>
                {priorityLabels[image.priority]}
              </span>
            </div>
            <p className="text-gray-600">{image.description}</p>
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Cerrar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Imagen principal */}
        <div className="relative w-full h-[60vh] bg-gray-100">
          <Image
            src={image.url}
            alt={image.title}
            fill
            className="object-contain"
            sizes="(max-width: 1536px) 100vw, 1536px"
            priority
          />
        </div>

        {/* Footer con metadata */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cuándo mostrar */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">
                📅 Cuándo mostrar
              </h3>
              <p className="text-sm text-gray-900 italic">{image.when_to_show}</p>
            </div>

            {/* Contextos de uso */}
            {image.usage_contexts && image.usage_contexts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">
                  🎯 Contextos de uso
                </h3>
                <div className="flex flex-wrap gap-2">
                  {image.usage_contexts.map((context, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white text-gray-700 rounded-full text-xs border border-gray-300"
                    >
                      {context}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {image.keywords && image.keywords.length > 0 && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2">
                  🏷️ Palabras clave
                </h3>
                <div className="flex flex-wrap gap-2">
                  {image.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botón de descarga/apertura */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Abrir en nueva pestaña
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
