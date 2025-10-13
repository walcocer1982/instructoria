/**
 * Cache en memoria para contexto de sesión
 * Evita queries repetitivos a BD para datos que no cambian
 */

interface CachedTopicContext {
  topic: any
  content: any
  images: any[]
  instructor: any
  timestamp: number
}

interface CachedSessionContext {
  topicContext: CachedTopicContext
  lastAccessed: number
}

// Cache en memoria simple (en producción usar Redis)
const sessionCache = new Map<string, CachedSessionContext>()

const CACHE_TTL = 60 * 60 * 1000 // 1 hora
const CLEANUP_INTERVAL = 5 * 60 * 1000 // Limpiar cada 5 minutos

/**
 * Obtener contexto del topic desde cache
 */
export function getCachedTopicContext(topicId: string): CachedTopicContext | null {
  const cached = sessionCache.get(`topic:${topicId}`)

  if (!cached) return null

  // Verificar si expiró
  if (Date.now() - cached.topicContext.timestamp > CACHE_TTL) {
    sessionCache.delete(`topic:${topicId}`)
    return null
  }

  // Actualizar último acceso
  cached.lastAccessed = Date.now()

  return cached.topicContext
}

/**
 * Guardar contexto del topic en cache
 */
export function setCachedTopicContext(
  topicId: string,
  topic: any,
  content: any,
  images: any[],
  instructor: any
): void {
  sessionCache.set(`topic:${topicId}`, {
    topicContext: {
      topic,
      content,
      images,
      instructor,
      timestamp: Date.now()
    },
    lastAccessed: Date.now()
  })
}

/**
 * Limpiar entradas expiradas del cache
 */
function cleanupCache(): void {
  const now = Date.now()
  const entriesToDelete: string[] = []

  for (const [key, value] of sessionCache.entries()) {
    // Eliminar si no se ha accedido en 1 hora
    if (now - value.lastAccessed > CACHE_TTL) {
      entriesToDelete.push(key)
    }
  }

  entriesToDelete.forEach(key => sessionCache.delete(key))

  if (entriesToDelete.length > 0) {
    console.log(`[Cache] Limpiadas ${entriesToDelete.length} entradas expiradas`)
  }
}

/**
 * Invalidar cache de un topic específico
 */
export function invalidateTopicCache(topicId: string): void {
  sessionCache.delete(`topic:${topicId}`)
}

/**
 * Limpiar todo el cache
 */
export function clearAllCache(): void {
  sessionCache.clear()
  console.log('[Cache] Cache completamente limpiado')
}

/**
 * Obtener estadísticas del cache
 */
export function getCacheStats() {
  return {
    size: sessionCache.size,
    entries: Array.from(sessionCache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.topicContext.timestamp,
      lastAccessed: Date.now() - value.lastAccessed
    }))
  }
}

// Iniciar limpieza periódica
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupCache, CLEANUP_INTERVAL)
}
