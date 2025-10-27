'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { ImageGalleryPanel } from '@/components/image-gallery-panel'
import { ImageModal } from '@/components/ImageModal'
import { useImageGallery } from '@/hooks/useImageGallery'
// import { useSoftPageExitTracking } from '@/hooks/useSoftPageExitTracking'
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'
import { LearningSidebar } from '@/components/learning/learning-sidebar'
import { ProgressModal } from '@/components/learning/progress-modal'
import { ChatMessages } from '@/components/learning/chat-messages'
import { ChatInput } from '@/components/learning/chat-input'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Loader from '@/components/ui/loader'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Activity {
  id: string
  title: string
  status: 'completed' | 'in_progress' | 'pending'
}

interface SessionInfo {
  instructor: {
    name: string
    avatar?: string
    specialty?: string
  }
  user: {
    name: string
    avatar?: string
  }
  topic: {
    title: string
    description?: string
  }
  learningObjectives: string[]
  keyPoints: string[]
  activities: Activity[]
  progress: number
}

export default function LearnPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null)
  const [showProgressModal, setShowProgressModal] = useState(false)

  // Ref para auto-focus del textarea después del streaming
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Estados para sidebars mobile
  const [mobileLearningSidebarOpen, setMobileLearningSidebarOpen] = useState(false)
  const [mobileImagePanelOpen, setMobileImagePanelOpen] = useState(false)

  // Handlers para abrir sidebars (solo uno a la vez en mobile)
  const openLearningSidebar = () => {
    setMobileImagePanelOpen(false)
    setMobileLearningSidebarOpen(true)
  }

  const openImagePanel = () => {
    setMobileLearningSidebarOpen(false)
    setMobileImagePanelOpen(true)
  }

  // Hook para manejar galería de imágenes
  const {
    images,
    isModalOpen,
    selectedImage,
    currentImage,
    showAllImages,
    openModal,
    closeModal,
    setCurrentImageByTitle,
    toggleShowAll,
  } = useImageGallery({ sessionId })

  // Hook para rastrear salidas de página durante verificaciones
  // useSoftPageExitTracking({
  //   sessionId,
  //   enabled: true
  // })

  // Hook para reconocimiento de voz
  const { isRecording, toggleRecording, stopRecording } = useVoiceRecognition({
    onTranscript: (transcript) => setInput((prev) => prev + transcript),
    lang: 'es-ES',
  })

  // Manejar click en referencia de imagen desde el mensaje del instructor
  const handleImageRefClick = (imageTitle: string) => {
    const image = images.find((img) => img.title.toLowerCase() === imageTitle.toLowerCase())
    if (image) {
      openModal(image)
    }
  }

  // Manejar cuando el instructor menciona una imagen (automático)
  const handleImageMentioned = (imageTitle: string) => {
    setCurrentImageByTitle(imageTitle)
  }

  useEffect(() => {
    // Cargar info de sesión y historial
    loadSessionInfo()
    loadHistory()
  }, [sessionId])

  const loadSessionInfo = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/info`)
      if (response.ok) {
        const data = await response.json()
        setSessionInfo(data)
      }
    } catch (error) {
      console.error('Error loading session info:', error)
    }
  }

  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/messages`)
      if (response.ok) {
        const data = await response.json()
        if (data.messages && data.messages.length > 0) {
          setMessages(
            data.messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
            }))
          )
        }
      }
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    const userInput = input
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Detener grabación de voz si está activa
    if (isRecording) {
      stopRecording()
    }

    // Crear mensaje del asistente vacío para ir llenándolo
    const assistantMessageIndex = messages.length + 1
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      },
    ])

    // Función para throttle del streaming (20% más lento para mejor lectura)
    const throttleStream = (delayMs: number = 60) => {
      let lastTime = 0
      return async (): Promise<void> => {
        const now = Date.now()
        const timeSinceLastChunk = now - lastTime

        if (timeSinceLastChunk < delayMs) {
          await new Promise(resolve => setTimeout(resolve, delayMs - timeSinceLastChunk))
        }

        lastTime = Date.now()
      }
    }

    try {
      // Determinar endpoint según feature flag (mock o real)
      const endpoint = process.env.NEXT_PUBLIC_STREAM_MOCK_TEST === 'true'
        ? '/api/chat/stream-mock'
        : '/api/chat/stream'

      if (process.env.NEXT_PUBLIC_STREAM_MOCK_TEST === 'true') {
        console.log('🎭 [MOCK MODE] Usando endpoint mock para testing')
      }

      // STREAMING: Usar fetch con response.body.getReader()
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userInput,
        }),
      })

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No se pudo obtener el reader del stream')
      }

      const throttle = throttleStream(100) // 100ms entre actualizaciones (20% más lento)
      let fullContent = ''
      let chunkBuffer = ''
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone

        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'chunk') {
                  // Acumular chunks pequeños para evitar actualizaciones muy frecuentes
                  chunkBuffer += data.content

                  // Actualizar cada 3+ caracteres o en puntuación para mejor lectura
                  if (chunkBuffer.length >= 3 || /[.!?;,\n]$/.test(chunkBuffer)) {
                    await throttle() // Aplicar delay de throttle
                    fullContent += chunkBuffer
                    const contentToRender = fullContent
                    chunkBuffer = ''

                    // Actualizar el mensaje en tiempo real
                    setMessages((prev) => {
                      const updated = [...prev]
                      updated[assistantMessageIndex] = {
                        role: 'assistant',
                        content: contentToRender,
                        timestamp: new Date(),
                      }
                      return updated
                    })
                  }
                } else if (data.type === 'done') {
                  // Flush del buffer antes de terminar
                  if (chunkBuffer) {
                    fullContent += chunkBuffer
                    chunkBuffer = ''
                    setMessages((prev) => {
                      const updated = [...prev]
                      updated[assistantMessageIndex] = {
                        role: 'assistant',
                        content: fullContent,
                        timestamp: new Date(),
                      }
                      return updated
                    })
                  }

                  // Streaming completado
                  console.log('[STREAM] Completado:', data)
                  // Recargar info de sesión para actualizar progreso
                  loadSessionInfo()
                  done = true

                  // Auto-focus en textarea para continuar la conversación
                  setTimeout(() => {
                    textareaRef.current?.focus()
                  }, 150)
                } else if (data.type === 'guardrail') {
                  // Contenido bloqueado por moderación
                  fullContent = data.content
                  setMessages((prev) => {
                    const updated = [...prev]
                    updated[assistantMessageIndex] = {
                      role: 'assistant',
                      content: fullContent,
                      timestamp: new Date(),
                    }
                    return updated
                  })
                  alert('⚠️ Contenido inapropiado detectado')
                  done = true
                } else if (data.type === 'error') {
                  throw new Error(data.error)
                }
              } catch (e) {
                // Ignorar líneas que no son JSON válido
                console.debug('Línea no JSON:', line)
              }
            }
          }
        }
      }

      // Flush cualquier buffer restante
      if (chunkBuffer) {
        fullContent += chunkBuffer
        setMessages((prev) => {
          const updated = [...prev]
          updated[assistantMessageIndex] = {
            role: 'assistant',
            content: fullContent,
            timestamp: new Date(),
          }
          return updated
        })
      }
    } catch (error) {
      console.error('Error en streaming:', error)

      // Actualizar el mensaje del asistente con error
      setMessages((prev) => {
        const updated = [...prev]
        updated[assistantMessageIndex] = {
          role: 'assistant',
          content: 'Lo siento, hubo un error. Por favor intenta de nuevo.',
          timestamp: new Date(),
        }
        return updated
      })
    } finally {
      setLoading(false)

      // Auto-focus en textarea incluso si hubo error
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 150)
    }
  }

  const handleToggleVoice = () => {
    // Auto-cerrar modal de imagen cuando el estudiante empieza a grabar
    if (!isRecording && isModalOpen) {
      closeModal()
    }
    toggleRecording()
  }

  if (!sessionInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <Loader
                title="Cargando sesión de clase"
                subtitle="Preparando todos los recursos para tu aprendizaje"
                size="md"
              />
            </div>
    )
  }

  return (
    <div className="flex h-full bg-slate-100 relative">
      {/* Sidebar Izquierdo */}
      <LearningSidebar
        instructorName={sessionInfo.instructor.name}
        instructorAvatar={sessionInfo.instructor.avatar}
        instructorSpecialty={sessionInfo.instructor.specialty}
        objectives={sessionInfo.learningObjectives}
        keyPoints={sessionInfo.keyPoints}
        progress={sessionInfo.progress}
        onProgressClick={() => setShowProgressModal(true)}
        isMobileOpen={mobileLearningSidebarOpen}
        onMobileClose={() => setMobileLearningSidebarOpen(false)}
      />

      {/* Contenido principal: Chat | Imagen */}
      <div className="flex flex-1 overflow-hidden">

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatMessages
            messages={messages}
            loading={loading}
            sessionInfo={sessionInfo}
            onImageRefClick={handleImageRefClick}
            onImageMentioned={handleImageMentioned}
          />

          <ChatInput
            input={input}
            loading={loading}
            isRecording={isRecording}
            onInputChange={setInput}
            onSend={sendMessage}
            onToggleVoice={handleToggleVoice}
            isModalOpen={isModalOpen}
            onModalClose={closeModal}
            textareaRef={textareaRef}
          />
        </div>

        {/* Panel lateral de imágenes - Solo mostrar si hay una imagen actual o showAllImages */}
        {(currentImage || showAllImages) && (
          <ImageGalleryPanel
            images={images}
            onImageClick={openModal}
            isOpen={true}
            onClose={() => { }}
            currentImage={currentImage}
            showAllImages={showAllImages}
            onToggleShowAll={toggleShowAll}
            isMobileOpen={mobileImagePanelOpen}
            onMobileClose={() => setMobileImagePanelOpen(false)}
          />
        )}
      </div>

      {/* Overlays Mobile para cerrar sidebars */}
      {mobileLearningSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
          onClick={() => setMobileLearningSidebarOpen(false)}
        />
      )}
      {mobileImagePanelOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
          onClick={() => setMobileImagePanelOpen(false)}
        />
      )}

      {/* Botones Flotantes Mobile (FABs) */}
      <div className="sm:hidden">
        {/* Botón Panel Aprendizaje - Inferior Izquierda */}
        <button
          onClick={openLearningSidebar}
          className="absolute top-20 left-4 z-40 bg-slate-700/50 text-white py-3 px-2 rounded-full shadow-lg hover:bg-slate-700 active:scale-95 transition-transform"
          title="Panel de Aprendizaje"
        >
          <div className="text-xl flex gap-1">
            <span>📚</span>
            <ChevronRight />
          </div>
        </button>

        {/* Botón Panel Imágenes - Inferior Derecha (solo si hay imágenes activas) */}
        {images.length > 0 && (currentImage || showAllImages) && (
          <button
            onClick={openImagePanel}
            className="absolute top-20 right-4 z-40 bg-slate-700/50 text-white py-3 px-2 rounded-full shadow-lg hover:bg-slate-700 active:scale-95 transition-transform"
            title="Panel de Imágenes"
          >
            <div className="text-xl flex gap-1">
              <ChevronLeft />
              <span>🖼️</span>
            </div>
          </button>
        )}
      </div>

      {/* Modal de imagen */}
      <ImageModal image={selectedImage} isOpen={isModalOpen} onClose={closeModal} />

      {/* Modal de progreso */}
      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        progress={sessionInfo.progress}
        activities={sessionInfo.activities || []}
      />
    </div>
  )
}
