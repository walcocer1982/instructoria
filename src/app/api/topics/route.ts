import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const type = searchParams.get('type') as 'CAREER' | 'TRANSVERSAL' | null

    const where: any = { isPublished: true }

    if (courseId) {
      where.courseId = courseId
    }

    const topics = await prisma.topic.findMany({
      where,
      include: {
        course: {
          include: {
            career: true
          }
        },
        instructor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            avatar: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    // Filtrar por tipo de curso si se especifica
    const filteredTopics = type
      ? topics.filter(t => t.course.type === type)
      : topics

    return NextResponse.json({ topics: filteredTopics })
  } catch (error) {
    console.error('Error en /api/topics:', error)
    return NextResponse.json(
      { error: 'Error obteniendo temas' },
      { status: 500 }
    )
  }
}
