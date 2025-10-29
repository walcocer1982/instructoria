import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Configuración de logs de Prisma
 * Por defecto solo muestra errores para no llenar la consola
 * Activar debugging con PRISMA_DEBUG=true en .env
 */
const getPrismaLogLevel = (): Prisma.LogLevel[] => {
  // En producción solo errores
  if (process.env.NODE_ENV === 'production') {
    return ['error']
  }

  // En desarrollo, verificar PRISMA_DEBUG
  const prismaDebug = process.env.PRISMA_DEBUG === 'true' || process.env.PRISMA_DEBUG === '1'

  if (prismaDebug) {
    // Debug activado: mostrar queries, errores y warnings
    console.log('[Prisma] 🔍 DEBUG MODE activado - Mostrando todas las queries')
    return ['query', 'error', 'warn']
  }

  // Debug desactivado: solo errores
  return ['error']
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: getPrismaLogLevel(),
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
