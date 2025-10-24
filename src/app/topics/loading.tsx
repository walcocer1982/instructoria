import Loader from '@/components/ui/loader'

/**
 * Loading UI para /topics
 * Se muestra automáticamente durante la navegación desde / hacia /topics
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader
        title="Cargando catálogo"
        subtitle="Preparando las clases disponibles para ti"
        size="md"
      />
    </div>
  )
}
