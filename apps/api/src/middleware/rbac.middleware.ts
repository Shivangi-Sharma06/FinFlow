import type { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import type { AuthRequest, BranchScope } from '../types/express.js';

const rank: Record<Role, number> = {
  VIEWER: 1,
  ACCOUNTANT: 2,
  BRANCH_MANAGER: 3,
  SUPER_ADMIN: 4
};

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
    }
    return next();
  };
}

export function requireMinimumRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (rank[user.role] < rank[role]) {
      return res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
    }
    return next();
  };
}

export function scopeToBranch(req: AuthRequest): BranchScope {
  if (req.user.role === 'SUPER_ADMIN') return {};
  return { branchId: req.user.branchId ?? undefined };
}

export function assertBranchAccess(req: AuthRequest, branchId: string) {
  return req.user.role === 'SUPER_ADMIN' || req.user.branchId === branchId;
}
