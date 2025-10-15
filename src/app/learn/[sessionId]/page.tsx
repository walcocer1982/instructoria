'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Mic, MicOff } from 'lucide-react'
import { ImagePanel } from '@/components/ImagePanel'
import { ImageModal } from '@/components/ImageModal'
import { useImageGallery } from '@/hooks/useImageGallery'
import { MessageWithImageRefs } from '@/components/MessageWithImageRefs'
import { LearningSidebar } from '@/components/learning/LearningSidebar'
import { InstructorHeader } from '@/components/learning/InstructorHeader'
import { ProgressModal } from '@/components/learning/ProgressModal'

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
  const [isRecording, setIsRecording] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
        console.log('[LearnPage] Session info loaded:', data)
        console.log('[LearnPage] Learning objectives:', data.learningObjectives)
        console.log('[LearnPage] Key points:', data.keyPoints)
        console.log('[LearnPage] Progress:', data.progress)
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

    try {
      // STREAMING: Usar fetch con response.body.getReader()
      const response = await fetch('/api/chat/stream', {
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

      let fullContent = ''
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
                  // Agregar chunk al contenido
                  fullContent += data.content

                  // Actualizar el mensaje en tiempo real
                  setMessages((prev) => {
                    const updated = [...prev]
                    updated[assistantMessageIndex] = {
                      role: 'assistant',
                      content: fullContent,
                      timestamp: new Date(),
                    }
                    return updated
                  })
                } else if (data.type === 'done') {
                  // Streaming completado
                  console.log('[STREAM] Completado:', data)
                  // Recargar info de sesión para actualizar progreso
                  loadSessionInfo()
                  done = true
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
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Inicializar Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'es-PE' // Español de Perú

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            } else {
              interimTranscript += transcript
            }
          }

          // Actualizar input con la transcripción
          if (finalTranscript) {
            setInput((prev) => prev + finalTranscript)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('[Voice] Error:', event.error)
          setIsRecording(false)

          if (event.error === 'not-allowed') {
            alert('⚠️ Permiso de micrófono denegado. Por favor, permite el acceso al micrófono en tu navegador.')
          }
        }

        recognitionRef.current.onend = () => {
          setIsRecording(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      alert('⚠️ Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.')
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  if (!sessionInfo) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-instructor-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header - Todo el ancho superior */}
      <InstructorHeader
        instructorName={sessionInfo.instructor.name}
        instructorAvatar={sessionInfo.instructor.avatar}
        instructorSpecialty={sessionInfo.instructor.specialty}
        userName={sessionInfo.user.name}
        userAvatar={sessionInfo.user.avatar}
      />

      {/* Contenido debajo del header: Sidebar | Chat | Imagen */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Izquierdo */}
        <LearningSidebar
          objectives={sessionInfo.learningObjectives}
          keyPoints={sessionInfo.keyPoints}
          progress={sessionInfo.progress}
          onProgressClick={() => setShowProgressModal(true)}
        />

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex gap-3 max-w-2xl">
                    {msg.role === 'assistant' && (
                      <Avatar className="h-8 w-8 border-2 border-instructor-200 flex-shrink-0">
                        <AvatarImage src={sessionInfo.instructor.avatar} />
                        <AvatarFallback className="bg-instructor-100 text-instructor-700 text-xs">
                          {sessionInfo.instructor.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-student-500 text-white'
                          : 'bg-instructor-50 text-gray-900 border border-instructor-200 select-none'
                      }`}
                      onCopy={(e) => {
                        if (msg.role === 'assistant') {
                          e.preventDefault()
                          console.log('[Security] Intento de copiar mensaje del instructor bloqueado')
                        }
                      }}
                      onCut={(e) => {
                        if (msg.role === 'assistant') {
                          e.preventDefault()
                          console.log('[Security] Intento de cortar mensaje del instructor bloqueado')
                        }
                      }}
                    >
                      {msg.role === 'assistant' ? (
                        <MessageWithImageRefs
                          content={msg.content}
                          onImageClick={handleImageRefClick}
                          onImageMentioned={handleImageMentioned}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      )}
                      <div
                        className={`text-xs mt-2 ${msg.role === 'user' ? 'text-student-100' : 'text-gray-400'}`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <Avatar className="h-8 w-8 border-2 border-student-200 flex-shrink-0">
                        <AvatarImage src={sessionInfo.user.avatar} />
                        <AvatarFallback className="bg-student-100 text-student-700 text-xs">
                          {sessionInfo.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}

              {loading && messages[messages.length - 1]?.content === '' && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 border-2 border-instructor-200">
                      <AvatarImage src={sessionInfo.instructor.avatar} />
                      <AvatarFallback className="bg-instructor-100 text-instructor-700 text-xs">
                        {sessionInfo.instructor.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-instructor-50 border border-instructor-200 px-4 py-3 rounded-2xl">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div
                            className="w-2 h-2 bg-instructor-500 rounded-full animate-bounce"
                            style={{ animationDelay: '0ms' }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-instructor-500 rounded-full animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-instructor-500 rounded-full animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{sessionInfo.instructor.name} está escribiendo...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t bg-white p-4">
            <div className="max-w-4xl mx-auto">
              {/* Indicador de grabación sobre el textarea */}
              {isRecording && (
                <div className="mb-2 flex items-center gap-2 text-red-600 text-sm">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                  <span className="font-medium">Grabando... Habla ahora</span>
                </div>
              )}

              {/* Contenedor con posición relativa para íconos flotantes */}
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    // Auto-expandir hasta 4 líneas (~120px), luego scroll
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                  onKeyDown={handleKeyPress}
                  onPaste={(e) => {
                    e.preventDefault()
                    console.log('[Security] Intento de pegar bloqueado - usa tus propias palabras o el micrófono')
                  }}
                  placeholder="Escribe o usa el micrófono..."
                  className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-instructor-500 resize-none text-sm"
                  style={{
                    minHeight: '52px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin'
                  }}
                  rows={1}
                  disabled={loading}
                />

                {/* Íconos flotantes FUERA del área de scroll */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white">
                  {/* Botón de micrófono */}
                  <button
                    onClick={toggleVoiceRecognition}
                    disabled={loading}
                    className={`p-2 rounded-full transition-colors ${
                      isRecording
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title={isRecording ? 'Detener grabación' : 'Iniciar dictado por voz'}
                    type="button"
                  >
                    {isRecording ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>

                  {/* Botón de enviar */}
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className={`p-2 rounded-full transition-all ${
                      input.trim() && !loading
                        ? 'bg-instructor-600 text-white hover:bg-instructor-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    title="Enviar mensaje"
                    type="button"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel lateral de imágenes - Solo mostrar si hay una imagen actual o showAllImages */}
        {(currentImage || showAllImages) && (
          <ImagePanel
            images={images}
            onImageClick={openModal}
            isOpen={true}
            onClose={() => {}}
            currentImage={currentImage}
            showAllImages={showAllImages}
            onToggleShowAll={toggleShowAll}
          />
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
