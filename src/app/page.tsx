import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Instructoria
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            Aprende con instructores IA especializados
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/topics"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Ver Cursos
            </Link>
            <Link
              href="/dashboard"
              className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Mi Dashboard
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">Instructores IA</h3>
            <p className="text-gray-600">
              Aprende con instructores especializados que se adaptan a tu ritmo
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">Conversacional</h3>
            <p className="text-gray-600">
              Haz preguntas, profundiza y aclara dudas en cualquier momento
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Seguimiento</h3>
            <p className="text-gray-600">
              Monitorea tu progreso y obtén certificados al completar
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para comenzar?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Explora nuestro catálogo de cursos y comienza tu viaje de aprendizaje
          </p>
          <Link
            href="/topics"
            className="inline-block bg-gradient-to-r from-instructor-500 to-learning-500 text-white px-10 py-4 rounded-lg font-semibold hover:shadow-xl transition-all text-lg"
          >
            Explorar Catálogo de Cursos →
          </Link>
        </div>
      </div>
    </main>
  )
}
