import bcrypt from 'bcrypt';
import { Router } from 'express';
import type { Role } from '@prisma/client';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import type { AuthRequest } from '../types/express.js';

export const usersRouter = Router();

usersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const users = await prisma.user.findMany({
      where:
        user.role === 'SUPER_ADMIN'
          ? { organisationId: user.organisationId }
          : { organisationId: user.organisationId, branchId: user.branchId },
      include: { branch: true },
      orderBy: { name: 'asc' }
    });
    return res.json({ users: users.map(stripPassword) });
  })
);

usersRouter.post(
  '/',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const actor = (req as AuthRequest).user;
    const { name, email, password, role, branchId } = req.body as UserCreateBody;
    const passwordHash = await bcrypt.hash(password ?? 'LedgerX@1234', 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, branchId, organisationId: actor.organisationId },
      include: { branch: true }
    });
    return res.status(201).json({ user: stripPassword(user), temporaryPassword: password ? undefined : 'LedgerX@1234' });
  })
);

usersRouter.put(
  '/:id',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const actor = (req as AuthRequest).user;
    const user = await prisma.user.update({
      where: { id: req.params.id, organisationId: actor.organisationId },
      data: req.body as Partial<Pick<UserCreateBody, 'name' | 'role' | 'branchId'> & { isActive: boolean }>,
      include: { branch: true }
    });
    return res.json({ user: stripPassword(user) });
  })
);

usersRouter.delete(
  '/:id',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const actor = (req as AuthRequest).user;
    await prisma.user.update({ where: { id: req.params.id, organisationId: actor.organisationId }, data: { isActive: false } });
    return res.status(204).send();
  })
);

type UserCreateBody = {
  name: string;
  email: string;
  password?: string;
  role: Role;
  branchId?: string | null;
};

function stripPassword<T extends { passwordHash: string }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
