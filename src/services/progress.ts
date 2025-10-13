import { prisma } from '@/lib/prisma'
import { parseTopicContent } from '@/lib/type-helpers'

/**
 * Calcula y actualiza el progreso de un TopicEnrollment basándose en las actividades completadas
 */
export async function updateTopicProgress(topicEnrollmentId: string): Promise<number> {
  // Obtener el enrollment con el topic y las actividades
  const enrollment = await prisma.topicEnrollment.findUnique({
    where: { id: topicEnrollmentId },
    include: {
      topic: true,
      activities: {
        where: { status: 'COMPLETED' },
        select: { activityId: true }
      }
    }
  })

  if (!enrollment) {
    throw new Error('TopicEnrollment not found')
  }

  // Parsear contenido del tema para obtener total de actividades
  const content = parseTopicContent(enrollment.topic.contentJson)

  // Contar total de actividades en el tema
  let totalActivities = 0

  if (content.topic.classes && content.topic.classes.length > 0) {
    // Estructura con clases
    for (const clase of content.topic.classes) {
      for (const moment of clase.moments) {
        totalActivities += moment.activities.length
      }
    }
  } else if (content.topic.moments && content.topic.moments.length > 0) {
    // Estructura sin clases (directamente momentos)
    for (const moment of content.topic.moments) {
      totalActivities += moment.activities.length
    }
  }

  // Contar actividades completadas
  const completedActivities = enrollment.activities.length

  console.log(`[Progress] 🔍 Completed activity IDs:`, enrollment.activities.map(a => a.activityId))
  console.log(`[Progress] 📊 Total activities in topic: ${totalActivities}`)
  console.log(`[Progress] ✅ Completed activities: ${completedActivities}`)

  // Calcular porcentaje (0-100)
  const progress = totalActivities > 0
    ? Math.round((completedActivities / totalActivities) * 100)
    : 0

  // Actualizar en la base de datos
  await prisma.topicEnrollment.update({
    where: { id: topicEnrollmentId },
    data: {
      progress,
      // Actualizar startedAt si es la primera actividad
      startedAt: enrollment.startedAt || (completedActivities > 0 ? new Date() : null),
      // Marcar como completado si llegó al 100%
      completedAt: progress >= 100 ? new Date() : null
    }
  })

  console.log(`[Progress] ✅ Updated progress for enrollment ${topicEnrollmentId}: ${progress}% (${completedActivities}/${totalActivities} activities)`)

  return progress
}

/**
 * Calcula el progreso sin actualizar la base de datos
 */
export async function calculateTopicProgress(topicEnrollmentId: string): Promise<{
  progress: number
  completed: number
  total: number
}> {
  const enrollment = await prisma.topicEnrollment.findUnique({
    where: { id: topicEnrollmentId },
    include: {
      topic: true,
      activities: {
        where: { status: 'COMPLETED' },
        select: { activityId: true }
      }
    }
  })

  if (!enrollment) {
    throw new Error('TopicEnrollment not found')
  }

  const content = parseTopicContent(enrollment.topic.contentJson)

  let totalActivities = 0

  if (content.topic.classes && content.topic.classes.length > 0) {
    for (const clase of content.topic.classes) {
      for (const moment of clase.moments) {
        totalActivities += moment.activities.length
      }
    }
  } else if (content.topic.moments && content.topic.moments.length > 0) {
    for (const moment of content.topic.moments) {
      totalActivities += moment.activities.length
    }
  }

  const completedActivities = enrollment.activities.length
  const progress = totalActivities > 0
    ? Math.round((completedActivities / totalActivities) * 100)
    : 0

  return {
    progress,
    completed: completedActivities,
    total: totalActivities
  }
}
