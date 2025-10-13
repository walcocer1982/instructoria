import { Prisma } from '@prisma/client'
import { TopicContent } from '@/types/topic-content'

/**
 * Helper para castear de forma segura el contentJson de Topic a TopicContent
 */
export function parseTopicContent(contentJson: Prisma.JsonValue): TopicContent {
  return contentJson as unknown as TopicContent
}

/**
 * Helper para castear de forma segura datos de evidencia
 */
export function parseEvidenceData(evidenceData: Prisma.JsonValue | null): any {
  if (!evidenceData) {
    return { attempts: [] }
  }
  return evidenceData as any
}

/**
 * Helper para crear datos de evidencia
 */
export function createEvidenceData(data: any): Prisma.InputJsonValue {
  return data as Prisma.InputJsonValue
}
