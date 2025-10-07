/**
 * API Route Dinámica para Agentes
 * Maneja llamadas a cualquier agente: planner, tutor, checker, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Importar agentes
import { runPlannerAgent, PlannerInputSchema } from '@/lib/agents/planner';
import { runTutorAgent, TutorInputSchema } from '@/lib/agents/tutor';
import { runCheckerAgent, CheckerInputSchema } from '@/lib/agents/checker';

/**
 * Mapeo de agentes a sus funciones y schemas
 */
const AGENT_MAP = {
  planner: {
    handler: runPlannerAgent,
    schema: PlannerInputSchema,
    description: 'Genera estructura de lección con 6 momentos pedagógicos',
  },
  tutor: {
    handler: runTutorAgent,
    schema: TutorInputSchema,
    description: 'Genera preguntas socráticas y pistas graduales',
  },
  checker: {
    handler: runCheckerAgent,
    schema: CheckerInputSchema,
    description: 'Evalúa respuestas de estudiantes',
  },
} as const;

type AgentName = keyof typeof AGENT_MAP;

/**
 * GET: Obtener información sobre agentes disponibles
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { agent: string } }
) {
  const agentName = params.agent;

  // Si se pide listar todos los agentes
  if (agentName === 'list') {
    return NextResponse.json({
      success: true,
      agents: Object.entries(AGENT_MAP).map(([name, config]) => ({
        name,
        description: config.description,
        endpoint: `/api/agents/${name}`,
      })),
    });
  }

  // Si se especifica agente, mostrar info
  const agentConfig = AGENT_MAP[agentName as AgentName];

  if (!agentConfig) {
    return NextResponse.json({
      success: false,
      error: `Agente '${agentName}' no encontrado`,
      available_agents: Object.keys(AGENT_MAP),
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    agent: {
      name: agentName,
      description: agentConfig.description,
      endpoint: `/api/agents/${agentName}`,
    },
  });
}

/**
 * POST: Ejecutar un agente
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { agent: string } }
) {
  const agentName = params.agent;

  try {
    // Validar que el agente existe
    const agentConfig = AGENT_MAP[agentName as AgentName];

    if (!agentConfig) {
      return NextResponse.json({
        success: false,
        error: `Agente '${agentName}' no encontrado`,
        available_agents: Object.keys(AGENT_MAP),
      }, { status: 404 });
    }

    // Parsear body
    const body = await request.json();

    // Validar input con el schema del agente
    const validatedInput = agentConfig.schema.parse(body);

    // Ejecutar agente
    const startTime = Date.now();
    const result = await agentConfig.handler(validatedInput as any);
    const executionTime = Date.now() - startTime;

    // Retornar resultado
    return NextResponse.json({
      success: true,
      agent: agentName,
      data: result,
      metadata: {
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error(`Error en agente ${agentName}:`, error);

    // Error de validación Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validación de input fallida',
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      }, { status: 400 });
    }

    // Error de OpenAI
    if (error.message?.includes('OpenAI') || error.message?.includes('API')) {
      return NextResponse.json({
        success: false,
        error: 'Error en la API de OpenAI',
        message: error.message,
      }, { status: 502 });
    }

    // Error genérico
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message || 'Error desconocido',
    }, { status: 500 });
  }
}