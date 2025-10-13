/**
 * Admin endpoint para refrescar manualmente las imágenes de un tema desde MCP Server
 * POST /api/admin/topics/[slug]/refresh-images
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTopicImagesFromMCP } from '@/services/mcp-client'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // 1. Verificar que el tema existe
    const topic = await prisma.topic.findUnique({
      where: { slug },
      select: { id: true, title: true, slug: true }
    })

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      )
    }

    console.log(`[Admin] Refreshing images for topic: ${slug}`)

    // 2. Obtener imágenes actualizadas desde MCP
    const images = await getTopicImagesFromMCP(slug)

    // 3. Actualizar en base de datos
    const updatedTopic = await prisma.topic.update({
      where: { slug },
      data: {
        images: images as any,
        imagesLoadedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        slug: true,
        imagesLoadedAt: true
      }
    })

    console.log(
      `[Admin] ✅ Refreshed ${images.length} images for ${topic.title}`
    )

    return NextResponse.json({
      success: true,
      topic: {
        id: updatedTopic.id,
        title: updatedTopic.title,
        slug: updatedTopic.slug
      },
      imagesCount: images.length,
      imagesLoadedAt: updatedTopic.imagesLoadedAt
    })
  } catch (error) {
    console.error('[Admin] Error refreshing images:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
