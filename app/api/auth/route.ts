/**
 * API de Autenticación
 * Maneja registro, login y logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createUser,
  verifyCredentials,
  createSession,
  deleteSession,
  validateToken
} from '@/lib/auth';

// Schema para registro
const RegisterSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
  rol: z.enum(['profesor', 'estudiante']),
});

// Schema para login
const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password requerido'),
});

/**
 * POST /api/auth?action=register
 * Registrar nuevo usuario
 */
async function handleRegister(body: any) {
  // Validar input
  const data = RegisterSchema.parse(body);

  // Crear usuario
  const user = await createUser(data);

  // Crear sesión automáticamente
  const session = await createSession(user);

  return NextResponse.json({
    success: true,
    message: 'Usuario registrado exitosamente',
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    },
    session: {
      token: session.token,
      expiresAt: session.expiresAt,
    },
  }, { status: 201 });
}

/**
 * POST /api/auth?action=login
 * Iniciar sesión
 */
async function handleLogin(body: any) {
  // Validar input
  const data = LoginSchema.parse(body);

  // Verificar credenciales
  const user = await verifyCredentials(data.email, data.password);

  if (!user) {
    return NextResponse.json({
      success: false,
      error: 'Credenciales inválidas',
    }, { status: 401 });
  }

  // Crear sesión
  const session = await createSession(user);

  return NextResponse.json({
    success: true,
    message: 'Login exitoso',
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    },
    session: {
      token: session.token,
      expiresAt: session.expiresAt,
    },
  });
}

/**
 * POST /api/auth?action=logout
 * Cerrar sesión
 */
async function handleLogout(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({
      success: false,
      error: 'Token no proporcionado',
    }, { status: 400 });
  }

  await deleteSession(token);

  return NextResponse.json({
    success: true,
    message: 'Sesión cerrada exitosamente',
  });
}

/**
 * GET /api/auth?action=me
 * Obtener información del usuario actual
 */
async function handleMe(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({
      success: false,
      error: 'Token no proporcionado',
    }, { status: 401 });
  }

  const session = await validateToken(token);

  if (!session) {
    return NextResponse.json({
      success: false,
      error: 'Sesión inválida o expirada',
    }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: session.userId,
      email: session.email,
      rol: session.rol,
    },
    session: {
      expiresAt: session.expiresAt,
    },
  });
}

/**
 * POST Handler
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'register') {
      const body = await request.json();
      return await handleRegister(body);
    }

    if (action === 'login') {
      const body = await request.json();
      return await handleLogin(body);
    }

    if (action === 'logout') {
      return await handleLogout(request);
    }

    return NextResponse.json({
      success: false,
      error: 'Acción no válida. Use: register, login, o logout',
    }, { status: 400 });

  } catch (error: any) {
    console.error('Error en auth:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validación fallida',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
    }, { status: 500 });
  }
}

/**
 * GET Handler
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'me') {
      return await handleMe(request);
    }

    return NextResponse.json({
      success: false,
      error: 'Acción no válida. Use: me',
    }, { status: 400 });

  } catch (error: any) {
    console.error('Error en auth:', error);

    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
    }, { status: 500 });
  }
}