/**
 * Utilidades para manejo de streaming de respuestas
 * Diseñado para ser modular y reutilizable
 */

/**
 * Tipos de respuesta del streaming
 */
export type StreamEventType = 'chunk' | 'done' | 'guardrail' | 'error'

export interface StreamEvent {
  type: StreamEventType
  content?: string
  error?: string
}

/**
 * Parser de Server-Sent Events (SSE)
 * Extrae y parsea líneas de datos SSE
 */
export function parseSSELine(line: string): StreamEvent | null {
  if (!line.startsWith('data: ')) return null

  try {
    const data = JSON.parse(line.slice(6))
    return data as StreamEvent
  } catch (error) {
    console.debug('[SSE Parser] Línea no JSON:', line)
    return null
  }
}

/**
 * Crea una función throttle para controlar la velocidad de actualizaciones
 * @param delayMs Delay en milisegundos entre actualizaciones
 * @returns Función async que aplica el throttle
 */
export function createThrottledUpdater(delayMs: number = 60) {
  let lastTime = 0

  return async (): Promise<void> => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastTime

    if (timeSinceLastUpdate < delayMs) {
      await new Promise(resolve =>
        setTimeout(resolve, delayMs - timeSinceLastUpdate)
      )
    }

    lastTime = Date.now()
  }
}

/**
 * Buffer para acumular chunks de texto antes de actualizar la UI
 * Mejora la experiencia de lectura evitando actualizaciones muy frecuentes
 */
export class ChunkBuffer {
  private buffer = ''
  private accumulated = ''

  constructor(
    private chunkSize: number = 8,
    private onFlush: (content: string, total: string) => void
  ) {}

  /**
   * Agrega contenido al buffer
   * Hace flush automáticamente cuando se alcanza el tamaño o se detecta puntuación
   */
  add(content: string): void {
    this.buffer += content

    // Flush cuando:
    // 1. Se alcanza el tamaño mínimo del chunk
    // 2. Se detecta puntuación final (mejora la lectura)
    if (this.buffer.length >= this.chunkSize || /[.!?;,\n]$/.test(this.buffer)) {
      this.flush()
    }
  }

  /**
   * Fuerza el flush del buffer actual
   */
  flush(): void {
    if (this.buffer) {
      this.accumulated += this.buffer
      this.onFlush(this.buffer, this.accumulated)
      this.buffer = ''
    }
  }

  /**
   * Obtiene el contenido total acumulado
   */
  getAccumulated(): string {
    return this.accumulated
  }

  /**
   * Reinicia el buffer y el contenido acumulado
   */
  reset(): void {
    this.buffer = ''
    this.accumulated = ''
  }
}

/**
 * Configuración para el procesador de streaming
 */
export interface StreamProcessorConfig {
  chunkSize?: number
  throttleDelayMs?: number
  onChunk?: (content: string, total: string) => void
  onComplete?: (fullContent: string) => void
  onGuardrail?: (message: string) => void
  onError?: (error: string) => void
}

/**
 * Procesador de streaming que combina todas las utilidades
 * Maneja el ciclo completo de procesamiento de un stream SSE
 */
export class StreamProcessor {
  private throttle: () => Promise<void>
  private chunkBuffer: ChunkBuffer
  private decoder = new TextDecoder()

  constructor(private config: StreamProcessorConfig) {
    // Inicializar throttle
    this.throttle = createThrottledUpdater(config.throttleDelayMs || 60)

    // Inicializar buffer con callback
    this.chunkBuffer = new ChunkBuffer(
      config.chunkSize || 8,
      async (chunk, total) => {
        await this.throttle()
        if (this.config.onChunk) {
          this.config.onChunk(chunk, total)
        }
      }
    )
  }

  /**
   * Procesa un stream completo desde un ReadableStream
   */
  async processStream(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
    let done = false

    while (!done) {
      const { value, done: readerDone } = await reader.read()
      done = readerDone

      if (value) {
        const chunk = this.decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          const event = parseSSELine(line)
          if (!event) continue

          switch (event.type) {
            case 'chunk':
              if (event.content) {
                this.chunkBuffer.add(event.content)
              }
              break

            case 'done':
              this.chunkBuffer.flush()
              if (this.config.onComplete) {
                this.config.onComplete(this.chunkBuffer.getAccumulated())
              }
              done = true
              break

            case 'guardrail':
              if (event.content && this.config.onGuardrail) {
                this.config.onGuardrail(event.content)
              }
              done = true
              break

            case 'error':
              if (event.error && this.config.onError) {
                this.config.onError(event.error)
              }
              done = true
              break
          }

          if (done) break
        }
      }
    }

    // Flush cualquier contenido restante
    this.chunkBuffer.flush()
    return this.chunkBuffer.getAccumulated()
  }

  /**
   * Reinicia el procesador para un nuevo streaming
   */
  reset(): void {
    this.chunkBuffer.reset()
  }
}

/**
 * Constantes de configuración por defecto
 */
export const STREAMING_DEFAULTS = {
  CHUNK_SIZE: 8,
  THROTTLE_DELAY_MS: 60,
} as const