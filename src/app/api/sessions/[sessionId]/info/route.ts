import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateTopicProgress } from '@/services/progress'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await prisma.learningSession.findUnique({
      where: { id: params.sessionId },
      include: {
        topicEnrollment: {
          include: {
            topic: {
              include: {
                instructor: true,
              },
            },
            activities: {
              select: {
                activityId: true,
                status: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatar: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const topic = session.topicEnrollment.topic
    const contentJson = topic.contentJson as any

    // Extraer learning objective (singular) y convertir a array para el componente
    const learningObjective = contentJson.topic?.learning_objective || ''
    const learningObjectives = learningObjective ? [learningObjective] : []

    // Extraer key points directamente del nivel topic
    const keyPoints = contentJson.topic?.key_points || []

    // Crear un mapa de actividades completadas para búsqueda rápida
    const activityStatusMap = new Map(
      session.topicEnrollment.activities.map(a => [
        a.activityId,
        a.status.toLowerCase() as 'completed' | 'in_progress' | 'pending'
      ])
    )

    // Extraer todas las actividades de todos los momentos
    const activities: any[] = []

    // Soportar ambas estructuras: con classes y sin classes
    if (contentJson.topic?.classes && Array.isArray(contentJson.topic.classes)) {
      // Estructura con clases
      contentJson.topic.classes.forEach((clase: any, classIndex: number) => {
        if (clase.moments && Array.isArray(clase.moments)) {
          clase.moments.forEach((moment: any, momentIndex: number) => {
            if (moment.activities && Array.isArray(moment.activities)) {
              moment.activities.forEach((activity: any, activityIndex: number) => {
                const activityTitle = activity.title || activity.instruction || moment.title || `Actividad ${activityIndex + 1}`
                const activityId = activity.id || `class-${classIndex}-moment-${momentIndex}-activity-${activityIndex}`

                // Obtener el estado real desde la base de datos
                const status = activityStatusMap.get(activityId) || 'pending'

                activities.push({
                  id: activityId,
                  title: activityTitle,
                  description: activity.description || '',
                  type: activity.type || 'unknown',
                  classTitle: clase.title || `Clase ${classIndex + 1}`,
                  momentTitle: moment.title || `Momento ${momentIndex + 1}`,
                  status,
                })
              })
            }
          })
        }
      })
    } else if (contentJson.topic?.moments && Array.isArray(contentJson.topic.moments)) {
      // Estructura sin clases (directamente momentos)
      contentJson.topic.moments.forEach((moment: any, momentIndex: number) => {
        if (moment.activities && Array.isArray(moment.activities)) {
          moment.activities.forEach((activity: any, activityIndex: number) => {
            const activityTitle = activity.title || activity.instruction || moment.title || `Actividad ${activityIndex + 1}`
            const activityId = activity.id || `moment-${momentIndex}-activity-${activityIndex}`

            // Obtener el estado real desde la base de datos
            const status = activityStatusMap.get(activityId) || 'pending'

            activities.push({
              id: activityId,
              title: activityTitle,
              description: activity.description || '',
              type: activity.type || 'unknown',
              momentTitle: moment.title || `Momento ${momentIndex + 1}`,
              status,
            })
          })
        }
      })
    }

    // Calcular progreso en tiempo real
    const progressData = await calculateTopicProgress(session.topicEnrollmentId)
    const progress = progressData.progress

    return NextResponse.json({
      session: {
        id: session.id,
        startedAt: session.startedAt,
      },
      instructor: {
        name: topic.instructor.name,
        avatar: topic.instructor.avatar,
        specialty: topic.instructor.specialty,
      },
      user: {
        name: session.user.name || 'Usuario',
        avatar: session.user.image || session.user.avatar, // Priorizar 'image' (NextAuth) sobre 'avatar' (custom)
      },
      topic: {
        title: topic.title,
        description: topic.description,
      },
      learningObjectives,
      keyPoints,
      activities,
      progress,
    })
  } catch (error) {
    console.error('Error fetching session info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
