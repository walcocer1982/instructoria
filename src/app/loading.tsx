import Loader from '@/components/ui/loader'

/**
 * Loading UI global
 * Se muestra automáticamente durante la navegación entre páginas principales
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <Loader
        title="Cargando Instructoria"
        subtitle="Preparando tu plataforma de aprendizaje"
        size="lg"
      />
    </div>
  )
}
