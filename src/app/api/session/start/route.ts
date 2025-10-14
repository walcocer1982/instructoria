import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseTopicContent } from '@/lib/type-helpers'
import { TopicContent } from '@/types/topic-content'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId, topicId } = await request.json()

    if (!userId || !topicId) {
      return NextResponse.json(
        { error: 'userId y topicId son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el topic existe
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { course: true, instructor: true }
    })

    if (!topic) {
      return NextResponse.json(
        { error: 'Tema no encontrado' },
        { status: 404 }
      )
    }

    // Buscar o crear CourseEnrollment
    let courseEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: topic.courseId
        }
      }
    })

    if (!courseEnrollment) {
      courseEnrollment = await prisma.courseEnrollment.create({
        data: {
          userId,
          courseId: topic.courseId
        }
      })
    }

    // Buscar o crear TopicEnrollment
    let topicEnrollment = await prisma.topicEnrollment.findUnique({
      where: {
        userId_topicId: {
          userId,
          topicId
        }
      }
    })

    if (!topicEnrollment) {
      topicEnrollment = await prisma.topicEnrollment.create({
        data: {
          userId,
          topicId,
          courseEnrollmentId: courseEnrollment.id
        }
      })
    }

    // Parsear contenido para obtener actividad inicial
    const content = parseTopicContent(topic.contentJson)
    let initialClassId: string | null = null
    let initialMomentId: string
    let initialActivityId: string

    if (content.topic.classes && content.topic.classes.length > 0) {
      initialClassId = content.topic.classes[0].id
      initialMomentId = content.topic.classes[0].moments[0].id
      initialActivityId = content.topic.classes[0].moments[0].activities[0].id
    } else if (content.topic.moments && content.topic.moments.length > 0) {
      initialMomentId = content.topic.moments[0].id
      initialActivityId = content.topic.moments[0].activities[0].id
    } else {
      return NextResponse.json(
        { error: 'Estructura de contenido inválida' },
        { status: 400 }
      )
    }

    // Crear sesión de aprendizaje
    const session = await prisma.learningSession.create({
      data: {
        topicEnrollmentId: topicEnrollment.id,
        userId,
        currentClassId: initialClassId,
        currentMomentId: initialMomentId,
        currentActivityId: initialActivityId
      }
    })

    // Actualizar fecha de inicio si es primera sesión
    if (!topicEnrollment.startedAt) {
      await prisma.topicEnrollment.update({
        where: { id: topicEnrollment.id },
        data: { startedAt: new Date() }
      })
    }

    // Mensaje de bienvenida del instructor
    const welcomeMessage = `¡Hola! Soy ${topic.instructor.name}, tu instructor de ${topic.title}.

${content.topic.learning_objective}

Vamos a trabajar juntos de forma conversacional. Puedes hacerme preguntas en cualquier momento y yo te guiaré paso a paso.

¿Estás listo para comenzar?`

    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: welcomeMessage,
        activityId: initialActivityId,
        momentId: initialMomentId,
        classId: initialClassId
      }
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      topic: {
        id: topic.id,
        title: topic.title,
        description: topic.description
      },
      instructor: {
        name: topic.instructor.name,
        specialty: topic.instructor.specialty,
        avatar: topic.instructor.avatar
      },
      welcomeMessage
    })
  } catch (error) {
    console.error('Error en /api/session/start:', error)
    return NextResponse.json(
      { error: 'Error iniciando sesión' },
      { status: 500 }
    )
  }
}
