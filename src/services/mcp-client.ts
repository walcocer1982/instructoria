/**
 * Cliente para MCP Server (Model Context Protocol)
 * Obtiene imágenes educativas desde Azure
 */

const MCP_SERVER_URL = process.env.MCP_SERVER_URL ||
  'http://instructoria-mcp.eastus.azurecontainer.io:8080'

export interface TopicImage {
  id: string
  title: string
  url: string
  priority: 'critical' | 'practical' | 'optional'
  when_to_show: string
  usage_contexts?: string[]
  description: string
  keywords: string[]
}

interface MCPResponse {
  success: boolean
  topic: string
  count: number
  breakdown: {
    critical: number
    practical: number
    optional: number
  }
  images: TopicImage[]
}

/**
 * Obtiene todas las imágenes de un tema desde el MCP Server
 */
export async function getTopicImagesFromMCP(
  topicSlug: string
): Promise<TopicImage[]> {
  try {
    console.log(`[MCP] Fetching images for topic: ${topicSlug}`)

    const response = await fetch(`${MCP_SERVER_URL}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'get_images_by_topic',
        params: { topic: topicSlug }
      }),
      signal: AbortSignal.timeout(5000) // 5 segundos timeout
    })

    if (!response.ok) {
      throw new Error(`MCP Server error: ${response.status}`)
    }

    const data: MCPResponse = await response.json()

    if (!data.success) {
      throw new Error('MCP returned success: false')
    }

    console.log(`[MCP] ✅ Found ${data.count} images for ${topicSlug}`)
    console.log(`[MCP] Breakdown: ${JSON.stringify(data.breakdown)}`)

    return data.images
  } catch (error) {
    console.error(`[MCP] ❌ Error fetching images for ${topicSlug}:`, error)

    // Degradación graceful: retornar array vacío
    // El curso puede continuar sin imágenes
    return []
  }
}

/**
 * Busca imágenes por keywords en el MCP Server
 */
export async function searchImagesInMCP(query: string): Promise<TopicImage[]> {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'search_images',
        params: { query }
      }),
      signal: AbortSignal.timeout(3000)
    })

    if (!response.ok) {
      throw new Error(`MCP Server error: ${response.status}`)
    }

    const data = await response.json()
    return data.images || []
  } catch (error) {
    console.error(`[MCP] Error searching images:`, error)
    return []
  }
}

/**
 * Verifica que el MCP Server esté disponible
 */
export async function checkMCPHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`, {
      signal: AbortSignal.timeout(2000)
    })
    return response.ok
  } catch {
    return false
  }
}
