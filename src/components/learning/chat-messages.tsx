'use client'

import { useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AvatarInstructor } from './avatar-instructor'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageWithImageRefs } from '@/components/MessageWithImageRefs'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
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
  activities: any[]
  progress: number
}

interface ChatMessagesProps {
  messages: Message[]
  loading: boolean
  sessionInfo: SessionInfo
  onImageRefClick: (imageTitle: string) => void
  onImageMentioned: (imageTitle: string) => void
}

export function ChatMessages({
  messages,
  loading,
  sessionInfo,
  onImageRefClick,
  onImageMentioned
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <ScrollArea className="flex-1 h-[70vh]">
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {messages.map((msg, idx) => {
          // No mostrar mensajes del asistente vacios mientras esta loading (se muestra el typing indicator)
          if (msg.role === 'assistant' && msg.content === '' && loading) {
            return null
          }

          // Detectar si es lastMessage:
          const isLastMessage = idx === messages.length - 1

          // Mensaje del Instructor (sin burbuja)
          if (msg.role === 'assistant') {
            // No mostrar mensajes vacios (zombie messages)
            if (!msg.content || msg.content.trim() === '') {
              return null
            }

            return (
              <div key={idx} className="flex flex-col gap-2 w-[90%] group me-auto">

                {isLastMessage && (
                  <AvatarInstructor
                    name={sessionInfo.instructor.name}
                    avatar={sessionInfo.instructor.avatar}
                    state="speaking"
                  />
                )}

                <div
                  className="flex-1 select-none"
                  onCopy={(e) => {
                    e.preventDefault()
                    console.log('[Security] Intento de copiar mensaje del instructor bloqueado')
                  }}
                  onCut={(e) => {
                    e.preventDefault()
                    console.log('[Security] Intento de cortar mensaje del instructor bloqueado')
                  }}
                >
                  <MessageWithImageRefs
                    content={msg.content}
                    onImageClick={onImageRefClick}
                    onImageMentioned={onImageMentioned}
                    variant="plain"
                  />
                  
                </div>

                <span className={cn('text-xs text-gray-400 mt-0 block' ,  (!isLastMessage) ? 'scale-0 group-hover:scale-100' : 'text-slate-500')}>
                    {new Date(msg.timestamp).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
              </div>
            )
          }

          // Mensaje del Estudiante (con burbuja blanca)
          return (
            <div key={idx} className="flex gap-2 justify-end items-center max-w-4xl ml-auto mb-6 group">
              <div className='flex flex-col gap-2'>
                <div className="bg-white border border-slate-300 px-5 py-3 rounded-3xl rounded-br-none max-w-xl">
                  <div className="text-gray-800 text-base whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
                <div className="text-xs text-gray-400 text-right scale-0 group-hover:scale-100">
                  {new Date(msg.timestamp).toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={sessionInfo.user.avatar || undefined} alt={sessionInfo.user.name || 'Usuario'} />
                <AvatarFallback className="bg-slate-300 text-gray-700 text-sm">
                  {sessionInfo.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          )
        })}

        {/* Typing indicator */}
        {loading && messages[messages.length - 1]?.content === '' && (
          <div className="flex items-center gap-4 max-w-4xl mb-6">
            <AvatarInstructor
              name={sessionInfo.instructor.name}
              avatar={sessionInfo.instructor.avatar}
              state="thinking"
            />
            <div className="flex-1">
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
                <span className="text-sm text-gray-500">{sessionInfo.instructor.name} esta escribiendo...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}
