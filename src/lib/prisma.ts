import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Only initialize Prisma if DATABASE_URL is available (not during build without env vars)
export const prisma = globalForPrisma.prisma ?? (
  process.env.DATABASE_URL
    ? new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      })
    : {} as PrismaClient // Return empty object during build if no DATABASE_URL
)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
