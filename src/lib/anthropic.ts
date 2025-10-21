import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY no está definida en las variables de entorno')
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Modelos optimizados por caso de uso
export const DEFAULT_MODEL = 'claude-haiku-4-5' // Para razonamiento y chat (instructor, verificación)
export const HAIKU_BASIC_MODEL = 'claude-3-5-haiku-20241022' // Para tareas básicas (moderación, clasificación)
export const DEFAULT_MAX_TOKENS = 2048
export const DEFAULT_TEMPERATURE = 0.7
