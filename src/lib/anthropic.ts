import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY no está definida en las variables de entorno')
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'
export const HAIKU_MODEL = 'claude-3-5-haiku-20241022' // Modelo económico para tareas simples
export const DEFAULT_MAX_TOKENS = 2048
export const DEFAULT_TEMPERATURE = 0.7
