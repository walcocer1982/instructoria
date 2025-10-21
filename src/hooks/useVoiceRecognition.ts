import { useEffect, useRef, useState } from 'react'

interface UseVoiceRecognitionProps {
  onTranscript?: (transcript: string) => void
  lang?: string
}

export function useVoiceRecognition({ onTranscript, lang = 'es-ES' }: UseVoiceRecognitionProps = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)
  const networkRetryCount = useRef(0)
  const maxNetworkRetries = 3

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = lang
        recognitionRef.current.maxAlternatives = 1

        recognitionRef.current.onstart = () => {
          setIsRecording(true)
          networkRetryCount.current = 0
        }

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript

            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' '
            }
          }

          if (finalTranscript && onTranscript) {
            onTranscript(finalTranscript)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setIsRecording(false)
            networkRetryCount.current = 0
            alert('⚠️ Permiso de micrófono denegado. Por favor, permite el acceso al micrófono en tu navegador.')
          } else if (event.error === 'network') {
            if (networkRetryCount.current < maxNetworkRetries) {
              networkRetryCount.current++

              setTimeout(() => {
                if (recognitionRef.current && isRecording) {
                  try {
                    recognitionRef.current.start()
                  } catch (error) {
                    setIsRecording(false)
                    networkRetryCount.current = 0
                  }
                }
              }, 1000)
            } else {
              setIsRecording(false)
              networkRetryCount.current = 0
              alert('⚠️ No se pudo conectar al servicio de reconocimiento de voz. Por favor intenta de nuevo.')
            }
          } else {
            setIsRecording(false)
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
  }, [lang, onTranscript])

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert('⚠️ Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.')
      return
    }

    try {
      recognitionRef.current.start()
    } catch (error) {
      setIsRecording(false)
      alert('⚠️ Error al iniciar el micrófono. Intenta de nuevo.')
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return {
    isRecording,
    startRecording,
    stopRecording,
    toggleRecording,
    isSupported: !!recognitionRef.current,
  }
}
