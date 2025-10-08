import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma Client para entornos serverless
 * Evita crear múltiples instancias en cada request
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
