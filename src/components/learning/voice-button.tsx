'use client'

import { Mic, MicOff } from 'lucide-react'

interface VoiceButtonProps {
  isRecording: boolean
  loading: boolean
  onToggle: () => void
}

export function VoiceButton({ isRecording, loading, onToggle }: VoiceButtonProps) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`p-2 rounded-full transition-all ${
        isRecording
          ? 'bg-red-50 text-red-600 hover:bg-red-100 ring-2 ring-red-200 animate-pulse'
          : loading
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'hover:bg-gray-100 text-gray-600'
      }`}
      title={isRecording ? 'Detener grabacion' : 'Iniciar dictado por voz'}
      type="button"
    >
      {isRecording ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  )
}
