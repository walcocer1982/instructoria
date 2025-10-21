'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { TopicImage } from './image-gallery-panel'

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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black bg-opacity-90 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl h-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-scaleIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Header con título y botón cerrar */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-gray-900">{image.title}</h2>
            <p className="text-gray-600 mt-2">{image.description}</p>
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
