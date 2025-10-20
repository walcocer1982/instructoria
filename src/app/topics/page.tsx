'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Topic {
  id: string
  title: string
  description: string
  slug: string
  estimatedMinutes: number
  course: {
    title: string
    career: {
      name: string
    }
  }
}

export default function TopicsPage() {
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopics()
  }, [])

  const loadTopics = async () => {
    try {
      const response = await fetch('/api/topics')
      const data = await response.json()
      setTopics(data.topics || [])
    } catch (error) {
      console.error('Error cargando temas:', error)
    } finally {
      setLoading(false)
    }
  }

  const startTopic = async (topicId: string, continueSession = true) => {
    try {
      // Obtener el usuario de prueba
      const userResponse = await fetch('/api/user')
      const userData = await userResponse.json()

      if (!userData.user) {
        alert('Error: Usuario no encontrado')
        return
      }

      // Crear nueva sesión o continuar existente
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.user.id,
          topicId,
          continueSession
        })
      })

      const data = await response.json()

      if (data.success && data.sessionId) {
        router.push(`/learn/${data.sessionId}`)
      } else {
        alert('Error creando sesión: ' + (data.error || 'Unknown'))
      }
    } catch (error) {
      console.error('Error iniciando tema:', error)
      alert('Error iniciando tema')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando temas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Temas Disponibles</h1>
          <p className="text-gray-600">Selecciona un tema para comenzar tu aprendizaje</p>
        </div>

        {/* Topics Grid */}
        {topics.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No hay temas disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map(topic => (
              <div
                key={topic.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                {/* Topic header */}
                <div className="mb-4">
                  <div className="text-sm text-blue-600 font-semibold mb-2">
                    {topic.course.career.name} → {topic.course.title}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{topic.title}</h2>
                  <p className="text-gray-600 text-sm line-clamp-3">{topic.description}</p>
                </div>

                {/* Topic info */}
                <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {topic.estimatedMinutes} min
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {topic.slug}
                  </span>
                </div>

                {/* Start buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => startTopic(topic.id, true)}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Continuar
                  </button>
                  <button
                    onClick={() => startTopic(topic.id, false)}
                    className="px-4 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                    title="Iniciar nueva sesión"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
