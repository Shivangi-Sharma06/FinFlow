import type { Branch, Organisation, Role, User } from '@prisma/client';
import type { Request } from 'express';

export type AuthUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'organisationId' | 'branchId'> & {
  branch?: Branch | null;
  organisation?: Organisation;
};

export type AuthRequest = Request & {
  user: AuthUser;
};

export type BranchScope = { branchId?: string };

export type MinimumRole = Role;
