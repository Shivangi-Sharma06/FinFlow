import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcrypt';
import NextAuth from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import type { Role } from '@/types';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email : undefined;
        const password = typeof credentials?.password === 'string' ? credentials.password : undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email }, include: { branch: true } });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organisationId: user.organisationId,
          branchId: user.branchId
        };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organisationId = user.organisationId;
        token.branchId = user.branchId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === 'string' ? token.id : '';
        session.user.role = isRole(token.role) ? token.role : 'VIEWER';
        session.user.organisationId = typeof token.organisationId === 'string' ? token.organisationId : '';
        session.user.branchId = typeof token.branchId === 'string' ? token.branchId : null;
      }
      return session;
    }
  },
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' }
});

function isRole(value: unknown): value is Role {
  return value === 'SUPER_ADMIN' || value === 'BRANCH_MANAGER' || value === 'ACCOUNTANT' || value === 'VIEWER';
}
