'use client'

import { useState, useEffect, useRef } from 'react'
import { TopicImage } from '@/components/image-gallery-panel'

interface UseImageGalleryProps {
  sessionId: string
}

interface UseImageGalleryReturn {
  images: TopicImage[]
  isLoading: boolean
  error: string | null
  isPanelOpen: boolean
  isModalOpen: boolean
  selectedImage: TopicImage | null
  currentImage: TopicImage | null
  showAllImages: boolean
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  openModal: (image: TopicImage) => void
  closeModal: () => void
  setCurrentImageByTitle: (title: string) => void
  toggleShowAll: () => void
}

/**
 * Hook para manejar la galería de imágenes educativas
 * Carga las imágenes desde la base de datos (híbrido approach)
 */
export function useImageGallery({ sessionId }: UseImageGalleryProps): UseImageGalleryReturn {
  const [images, setImages] = useState<TopicImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<TopicImage | null>(null)
  const [currentImage, setCurrentImage] = useState<TopicImage | null>(null)
  const [showAllImages, setShowAllImages] = useState(false)

  const isMountedRef = useRef(true)
  const closeModalTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cargar imágenes al montar el componente
  useEffect(() => {
    isMountedRef.current = true
    loadImages()

    return () => {
      isMountedRef.current = false
      if (closeModalTimeoutRef.current) {
        clearTimeout(closeModalTimeoutRef.current)
      }
    }
  }, [sessionId])

  const loadImages = async () => {
    try {
      if (!isMountedRef.current) return

      setIsLoading(true)
      setError(null)

      // Obtener imágenes desde la API (que las lee de la DB)
      const response = await fetch(`/api/sessions/${sessionId}/images`)

      if (!isMountedRef.current) return

      if (!response.ok) {
        // Si no hay imágenes, es normal (degradación graceful)
        if (response.status === 404) {
          console.log('[ImageGallery] No images found for this topic (expected)')
          if (isMountedRef.current) setImages([])
          return
        }
        throw new Error(`Error loading images: ${response.status}`)
      }

      const data = await response.json()

      if (!isMountedRef.current) return

      if (data.success && Array.isArray(data.images)) {
        setImages(data.images)
        console.log(`[ImageGallery] ✅ Loaded ${data.images.length} images`)
      } else {
        setImages([])
      }
    } catch (err) {
      console.error('[ImageGallery] Error loading images:', err)
      // Degradación graceful: no mostrar error al usuario
      if (isMountedRef.current) {
        setError(null)
        setImages([])
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const openPanel = () => setIsPanelOpen(true)
  const closePanel = () => setIsPanelOpen(false)
  const togglePanel = () => setIsPanelOpen(prev => !prev)

  const openModal = (image: TopicImage) => {
    setSelectedImage(image)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (!isMountedRef.current) return

    setIsModalOpen(false)

    // Limpiar timeout anterior si existe
    if (closeModalTimeoutRef.current) {
      clearTimeout(closeModalTimeoutRef.current)
    }

    // Pequeño delay antes de limpiar la imagen para que la animación se vea bien
    closeModalTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setSelectedImage(null)
      }
    }, 300)
  }

  const setCurrentImageByTitle = (title: string) => {
    if (!isMountedRef.current) return

    const image = images.find(img =>
      img.title.toLowerCase() === title.toLowerCase()
    )
    if (image) {
      setCurrentImage(image)
      setShowAllImages(false) // Cuando se menciona una imagen, solo mostrar esa
    }
  }

  const toggleShowAll = () => {
    setShowAllImages(prev => !prev)
  }

  return {
    images,
    isLoading,
    error,
    isPanelOpen,
    isModalOpen,
    selectedImage,
    currentImage,
    showAllImages,
    openPanel,
    closePanel,
    togglePanel,
    openModal,
    closeModal,
    setCurrentImageByTitle,
    toggleShowAll
  }
}
