/**
 * API Route para Agente Checker
 */

import { NextRequest, NextResponse } from 'next/server';
import { runCheckerAgent, CheckerInputSchema } from '@/lib/agents/checker';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar input
    const input = CheckerInputSchema.parse(body);

    // Ejecutar agente
    const result = await runCheckerAgent(input);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error en Checker Agent:', error);

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