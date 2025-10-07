import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnStudent = nextUrl.pathname.startsWith('/student');
      const isOnTeacher = nextUrl.pathname.startsWith('/teacher');
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

      // Protected routes - require authentication
      if (isOnStudent || isOnTeacher || isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
