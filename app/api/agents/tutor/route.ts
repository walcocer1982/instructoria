/**
 * API Route para Agente Tutor
 */

import { NextRequest, NextResponse } from 'next/server';
import { runTutorAgent, TutorInputSchema } from '@/lib/agents/tutor';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar input
    const input = TutorInputSchema.parse(body);

    // Ejecutar agente
    const result = await runTutorAgent(input);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error en Tutor Agent:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validación fallida',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
    }, { status: 500 });
  }
}