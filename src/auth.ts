import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Microsoft from 'next-auth/providers/microsoft-entra-id'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth - DESHABILITADO (solo usuarios corporativos con Microsoft)
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    Microsoft({
      // NextAuth v5 busca automáticamente estas variables:
      // - AUTH_MICROSOFT_ENTRA_ID_ID (clientId)
      // - AUTH_MICROSOFT_ENTRA_ID_SECRET (clientSecret)
      // - AUTH_MICROSOFT_ENTRA_ID_ISSUER (issuer)
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Use JWT for middleware compatibility
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl

      // Rutas públicas que no requieren autenticación
      const publicRoutes = ['/login', '/api/auth']
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

      if (isPublicRoute) {
        return true
      }

      // Todas las demás rutas requieren autenticación
      return !!auth?.user
    },
  },
  pages: {
    signIn: '/login',
  },
})
