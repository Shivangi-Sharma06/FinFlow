import type { DefaultSession } from 'next-auth';
import type { Role } from './index';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: Role;
      organisationId: string;
      branchId: string | null;
    };
  }

  interface User {
    role?: Role;
    organisationId?: string;
    branchId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: Role;
    organisationId?: string;
    branchId?: string | null;
  }
}
