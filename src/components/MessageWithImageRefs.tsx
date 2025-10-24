'use client'

import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MessageWithImageRefsProps {
  content: string
  onImageClick: (imageTitle: string) => void
  onImageMentioned?: (imageTitle: string) => void
  variant?: 'plain' | 'bubble' // plain = sin burbuja (instructor), bubble = con burbuja (no usado ahora)
}

/**
 * Componente que detecta referencias a imágenes en el formato [VER IMAGEN: título]
 * y las convierte en links clickeables.
 * También renderiza Markdown (negrita, listas, líneas horizontales, etc.)
 * IMPORTANTE: Solo procesa la PRIMERA referencia de imagen por mensaje.
 *
 * @param variant - 'plain' para mensajes sin burbuja (instructor), 'bubble' para con burbuja
 */
export function MessageWithImageRefs({
  content,
  onImageClick,
  onImageMentioned,
  variant = 'plain'
}: MessageWithImageRefsProps) {
  // Regex para detectar [VER IMAGEN: título] (sin flag 'g' para solo encontrar la primera)
  const imageRefRegex = /\[VER IMAGEN:\s*([^\]]+)\]/

  // Ref para rastrear si ya se notificó esta imagen (evita múltiples llamadas en re-renders)
  const notifiedImageRef = useRef<string | null>(null)

  // Estilos según variant
  const textSizeClass = variant === 'plain' ? 'text-base' : 'text-sm'
  const textColorClass = variant === 'plain' ? 'text-gray-800' : 'text-gray-900'
  const leadingClass = variant === 'plain' ? 'leading-relaxed' : 'leading-normal'

  const parts: React.ReactNode[] = []

  // Solo procesar la PRIMERA referencia de imagen
  const match = content.match(imageRefRegex)
  const trimmedTitle = match ? match[1].trim() : null

  console.log('[MessageWithImageRefs] 🔍 Match result:', match ? 'FOUND' : 'NOT FOUND')

  // ✅ HOOK MOVIDO FUERA DEL CONDICIONAL - Siempre se llama en el mismo orden
  useEffect(() => {
    if (trimmedTitle && onImageMentioned && notifiedImageRef.current !== trimmedTitle) {
      notifiedImageRef.current = trimmedTitle
      onImageMentioned(trimmedTitle)
      console.log(`[MessageWithImageRefs] 📸 Image mentioned: ${trimmedTitle}`)
    }
  }, [trimmedTitle, onImageMentioned])

  if (match && trimmedTitle) {
    console.log('[MessageWithImageRefs] 🎯 Image detected:', match[1])
    const [fullMatch, imageTitle] = match
    const matchIndex = match.index!

    // Agregar texto antes del match (con markdown)
    if (matchIndex > 0) {
      parts.push(
        <ReactMarkdown
          key="before"
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="leading-7 mb-1.5 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            hr: () => <hr className="my-2 border-gray-300" />,
            ul: ({ children }) => <ul className="list-disc list-inside my-1.5 space-y-0.5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside my-1.5 space-y-0.5">{children}</ol>,
            li: ({ children }) => <li className="ml-2">{children}</li>,
          }}
        >
          {content.substring(0, matchIndex)}
        </ReactMarkdown>
      )
    }

    // Agregar el link a la imagen
    parts.push(
      <button
        key="image-ref"
        onClick={() => onImageClick(trimmedTitle)}
        className="inline-flex items-center gap-1 px-2 py-1 mx-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition font-medium text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Ver: {trimmedTitle}
      </button>
    )

    // Agregar texto después del match (con markdown)
    const afterMatchIndex = matchIndex + fullMatch.length
    if (afterMatchIndex < content.length) {
      parts.push(
        <ReactMarkdown
          key="after"
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            hr: () => <hr className="my-2 border-gray-300" />,
            ul: ({ children }) => <ul className="list-disc list-inside my-1.5 space-y-0.5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside my-1.5 space-y-0.5">{children}</ol>,
            li: ({ children }) => <li className="ml-2">{children}</li>,
          }}
        >
          {content.substring(afterMatchIndex)}
        </ReactMarkdown>
      )
    }

    return <div className={`${textSizeClass} ${textColorClass} ${leadingClass}`}>{parts}</div>
  }

  // Si no hay matches, retornar el contenido con renderizado de markdown
  console.log('[MessageWithImageRefs] ❌ No image in this message')
  return (
    <div className={`${textSizeClass} ${textColorClass} ${leadingClass}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          hr: () => <hr className="my-2 border-gray-300" />,
          ul: ({ children }) => <ul className="list-disc list-inside my-1.5 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-1.5 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="ml-2">{children}</li>,
          code: ({ children }) => (
            <code className="px-1 py-0.5 bg-gray-100 rounded text-sm font-mono">{children}</code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
