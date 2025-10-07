import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    } & DefaultSession['user'];
  }

  interface User {
    role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  }
}
