/**
 * Capa LLM Base - Cliente OpenAI
 * Sistema SOPHI - Fase 0.2
 */

import OpenAI from 'openai';
import { ImageRef, LLMMessage } from '@/types';

let openaiInstance: OpenAI | null = null;

function getOpenAIInstance(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no esta configurada en las variables de entorno');
  }

  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey });
  }

  return openaiInstance;
}

/**
 * Cliente LLM con metodos base
 */
export class LLMClient {
  public client: OpenAI; // Public para acceso a embeddings API

  constructor() {
    this.client = getOpenAIInstance();
  }

  /**
   * Realiza una llamada básica al LLM
   */
  async chat(
    messages: LLMMessage[],
    options?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || 'gpt-4o-mini',
        messages: messages as any,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 2000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error en llamada LLM:', error);
      throw error;
    }
  }

  /**
   * Realiza una llamada con structured output usando Zod schema
   */
  async chatStructured<T>(
    messages: LLMMessage[],
    jsonSchema: any,
    options?: {
      model?: string;
      temperature?: number;
    }
  ): Promise<T> {
    try {
      console.log('[LLM] 🔄 Llamando a OpenAI...');
      console.log('[LLM] Model:', options?.model || 'gpt-4o-mini');
      console.log('[LLM] Schema name:', jsonSchema?.name);

      const response = await this.client.chat.completions.create({
        model: options?.model || 'gpt-4o-mini',
        messages: messages as any,
        temperature: options?.temperature || 0.7,
        response_format: {
          type: 'json_schema',
          json_schema: jsonSchema,
        },
      });

      console.log('[LLM] ✅ Respuesta recibida');
      const content = response.choices[0]?.message?.content || '{}';
      console.log('[LLM] Content length:', content.length);

      return JSON.parse(content) as T;
    } catch (error: any) {
      console.error('[LLM] ❌ ERROR en llamada LLM estructurada:');
      console.error('[LLM] Error type:', error?.constructor?.name);
      console.error('[LLM] Error message:', error?.message);
      console.error('[LLM] Error code:', error?.code);
      console.error('[LLM] Full error:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Verifica la conexión con OpenAI
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.chat([
        {
          role: 'user',
          content: 'Responde solo con "OK" si puedes leerme.',
        },
      ]);
      return response.toLowerCase().includes('ok');
    } catch (error) {
      console.error('Error al probar conexión:', error);
      return false;
    }
  }
}

/**
 * Mezcla texto e imágenes en formato de mensaje LLM
 * Útil para enviar contexto visual a los agentes
 */
export function mixTextAndImages(
  text: string,
  images: ImageRef[] = []
): Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> {
  const content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }> = [
    {
      type: 'text',
      text,
    },
  ];

  const SUPPORTED_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  const SUPPORTED_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

  const isSupportedImage = (url: string): boolean => {
    if (!url) return false;
    if (url.startsWith('data:')) {
      const match = url.match(/^data:([^;]+);/i);
      if (!match) return false;
      return SUPPORTED_MIME.includes(match[1].toLowerCase());
    }
    const lower = url.toLowerCase();
    return SUPPORTED_EXT.some(ext => lower.includes(ext));
  };

  images.forEach((img) => {
    if (!isSupportedImage(img.url)) {
      console.warn('[mixTextAndImages] Imagen no compatible, se omitirá:', img.url?.slice(0, 60));
      return;
    }

    content.push({
      type: 'image_url',
      image_url: {
        url: img.url,
      },
    });
  });

  return content;
}

/**
 * Reglas de tipo de imagen permitido por momento pedagógico
 */
const MOMENTO_IMAGE_RULES: Record<string, string[]> = {
  M0: ['contexto'],                           // Solo contexto general
  M1: ['contexto', 'diagrama'],               // Activar conocimientos previos
  M2: ['ejemplo', 'recurso', 'diagrama'],     // Modelado completo
  M3: ['ejemplo', 'recurso'],                 // Práctica guiada
  M4: ['recurso'],                            // Autónomo (opcional)
  M5: [],                                     // Evaluación sin imágenes
};

/**
 * Filtra imágenes según el momento pedagógico actual
 *
 * @param images - Array de imágenes de la lección
 * @param momentId - ID del momento actual (M0-M5)
 * @returns Array de imágenes filtradas según las reglas del momento
 */
export function filterImagesByMoment(
  images: ImageRef[],
  momentId: string
): ImageRef[] {
  if (!images || images.length === 0) return [];

  const allowedTypes = MOMENTO_IMAGE_RULES[momentId] || [];

  // Si el momento no permite imágenes, retornar vacío
  if (allowedTypes.length === 0) {
    return [];
  }

  // Filtrar imágenes
  return images.filter((img) => {
    // Si la imagen tiene momento_id explícito, verificar que coincida
    if (img.momento_id) {
      return img.momento_id === momentId;
    }

    // Si no tiene momento_id, filtrar por tipo
    return img.tipo ? allowedTypes.includes(img.tipo) : false;
  });
}

/**
 * Instancia global del cliente LLM (singleton)
 */
let llmClientInstance: LLMClient | null = null;

export function getLLMClient(): LLMClient {
  if (!llmClientInstance) {
    llmClientInstance = new LLMClient();
  }
  return llmClientInstance;
}

/**
 * Verifica si un mensaje contiene contenido inapropiado usando OpenAI Moderation API
 *
 * @param message - Mensaje del estudiante a verificar
 * @returns Objeto con flagged (true si inapropiado) y categorías detectadas
 */
export async function checkModeration(message: string): Promise<{
  flagged: boolean;
  categories?: {
    sexual: boolean;
    hate: boolean;
    harassment: boolean;
    'self-harm': boolean;
    'sexual/minors': boolean;
    'hate/threatening': boolean;
    'violence/graphic': boolean;
    'self-harm/intent': boolean;
    'self-harm/instructions': boolean;
    'harassment/threatening': boolean;
    violence: boolean;
  };
}> {
  try {
    const client = getOpenAIInstance();

    const response = await client.moderations.create({
      model: 'omni-moderation-latest',
      input: message,
    });

    const result = response.results[0];

    console.log('[Moderation] 🛡️  Verificación de contenido:', {
      flagged: result.flagged,
      categories: result.categories,
    });

    return {
      flagged: result.flagged,
      categories: result.categories,
    };
  } catch (error) {
    console.error('[Moderation] ❌ Error en verificación:', error);
    // En caso de error, permitir el mensaje (fail-open)
    return { flagged: false };
  }
}