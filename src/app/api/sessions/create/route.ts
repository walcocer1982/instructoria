/**
 * POST /api/sessions/create
 * Crea una nueva sesión de aprendizaje
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, topicId, continueSession } = body

    console.log(`[Sessions] Creating/continuing session - userId: ${userId}, topicId: ${topicId}, continueSession: ${continueSession}`)

    if (!userId || !topicId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or topicId' },
        { status: 400 }
      )
    }

    // Si se solicita continuar sesión, buscar la sesión más reciente activa
    if (continueSession) {
      const existingSession = await prisma.learningSession.findFirst({
        where: {
          userId,
          topicEnrollment: {
            topicId
          },
          endedAt: null // Solo sesiones no finalizadas
        },
        orderBy: {
          lastActivityAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          topicEnrollment: {
            include: {
              topic: {
                include: {
                  instructor: true,
                  course: {
                    include: {
                      career: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (existingSession) {
        console.log(`[Sessions] ♻️ Continuing existing session ${existingSession.id} for user ${userId} (${existingSession.user?.name || 'unknown'})`)
        return NextResponse.json({
          success: true,
          sessionId: existingSession.id,
          continued: true,
          topic: {
            id: existingSession.topicEnrollment.topic.id,
            title: existingSession.topicEnrollment.topic.title,
            slug: existingSession.topicEnrollment.topic.slug
          },
          instructor: {
            name: existingSession.topicEnrollment.topic.instructor.name,
            specialty: existingSession.topicEnrollment.topic.instructor.specialty
          }
        })
      }
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    console.log(`[Sessions] Creating session for user: ${user.name} (${user.email})`)

    // Verificar que el tema existe y está publicado
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        instructor: true,
        course: {
          include: {
            career: true
          }
        }
      }
    })

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      )
    }

    if (!topic.isPublished) {
      return NextResponse.json(
        { success: false, error: 'Topic is not published' },
        { status: 400 }
      )
    }

    // Crear o obtener CourseEnrollment
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
          courseId: topic.courseId,
          startedAt: new Date()
        }
      })
    }

    // Crear o obtener TopicEnrollment
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
          courseEnrollmentId: courseEnrollment.id,
          startedAt: new Date()
        }
      })
    }

    // Crear la sesión
    const session = await prisma.learningSession.create({
      data: {
        topicEnrollmentId: topicEnrollment.id,
        userId
      }
    })

    // Crear mensaje de bienvenida del instructor
    const welcomeMessage = `¡Hola! Soy ${topic.instructor.name}, tu instructor especializado en ${topic.instructor.specialty}.

Bienvenido al tema: "${topic.title}"

Este tema forma parte del curso "${topic.course.title}" de la carrera de ${topic.course.career?.name || 'tu carrera'}.

Duración estimada: ${topic.estimatedMinutes} minutos.

${topic.description}

Estoy aquí para guiarte paso a paso en este aprendizaje. Puedes hacer preguntas en cualquier momento y avanzaremos juntos a tu ritmo.

¿Estás listo para comenzar?`

    await prisma.message.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: welcomeMessage
      }
    })

    console.log(`[Sessions] ✅ Created NEW session ${session.id} for user ${userId} (${user.name}) on topic ${topic.title}`)

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      topic: {
        id: topic.id,
        title: topic.title,
        slug: topic.slug
      },
      instructor: {
        name: topic.instructor.name,
        specialty: topic.instructor.specialty
      }
    })
  } catch (error) {
    console.error('[API] Error creating session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
