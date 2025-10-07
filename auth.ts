import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import authConfig from './auth.config';
import { prisma } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  ...authConfig,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Assign role based on email domain or first-time login
      if (user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser && user.id) {
          // First time login - determine role
          let role: 'STUDENT' | 'TEACHER' | 'ADMIN' = 'STUDENT';

          // Assign TEACHER role to specific domains (customize as needed)
          const teacherDomains = ['teacher.com', 'educador.com', 'sophi.edu'];
          const emailDomain = user.email.split('@')[1];

          if (teacherDomains.includes(emailDomain)) {
            role = 'TEACHER';
          }

          // Update user role in database
          await prisma.user.update({
            where: { id: user.id },
            data: { role },
          });
        }
      }

      return true;
    },

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;

        // Fetch user role from database
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });

        if (dbUser) {
          session.user.role = dbUser.role;
        }
      }

      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
});
