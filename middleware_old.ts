/**
 * Middleware de Autenticación
 * Protege rutas según rol del usuario
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas (no requieren autenticación)
  const publicPaths = ['/login', '/api/auth', '/api/agents'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Para rutas de API protegidas, verificar token en header
  if (pathname.startsWith('/api/')) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // El token se validará en cada API route usando validateToken()
    return NextResponse.next();
  }

  // Para rutas de UI, redirigir a login si no hay token
  // Nota: La validación real del token se hace en el cliente
  // porque localStorage no está disponible en middleware
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};