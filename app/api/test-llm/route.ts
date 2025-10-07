/**
 * API Route para probar conexión con OpenAI
 */

import { NextResponse } from 'next/server';
import { getLLMClient } from '@/lib/llm';

export async function GET() {
  try {
    const llmClient = getLLMClient();

    // Probar conexión
    const isConnected = await llmClient.testConnection();

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Conexión exitosa con OpenAI',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No se pudo conectar con OpenAI',
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Error al conectar con OpenAI',
      error: error.message,
    }, { status: 500 });
  }
}