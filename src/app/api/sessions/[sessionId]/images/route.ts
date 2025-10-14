/**
 * GET /api/sessions/[sessionId]/images
 * Retorna las imágenes educativas para el tema de la sesión
 * Lee desde la base de datos (enfoque híbrido)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    // 1. Obtener la sesión con el tema relacionado a través de topicEnrollment
    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        topicEnrollment: {
          include: {
            topic: {
              select: {
                id: true,
                title: true,
                slug: true,
                images: true,
                imagesLoadedAt: true
              }
            }
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      )
    }

    const topic = session.topicEnrollment.topic

    // 2. Verificar si el tema tiene imágenes
    const images = topic.images as any[] | null

    if (!images || images.length === 0) {
      // Degradación graceful: retornar array vacío, no error
      return NextResponse.json({
        success: true,
        images: [],
        count: 0,
        topic: {
          id: topic.id,
          title: topic.title,
          slug: topic.slug
        }
      })
    }

    // 3. Retornar imágenes
    return NextResponse.json({
      success: true,
      images,
      count: images.length,
      topic: {
        id: topic.id,
        title: topic.title,
        slug: topic.slug
      },
      loadedAt: topic.imagesLoadedAt
    })
  } catch (error) {
    console.error('[API] Error fetching session images:', error)

    // Degradación graceful: retornar array vacío en vez de error 500
    return NextResponse.json({
      success: true,
      images: [],
      count: 0,
      error: 'Failed to load images'
    })
  }
}
