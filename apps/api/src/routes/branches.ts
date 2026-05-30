import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import type { AuthRequest } from '../types/express.js';

export const branchesRouter = Router();

branchesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const branches = await prisma.branch.findMany({
      where: user.role === 'SUPER_ADMIN' || user.isPlatformAdmin ? { organisationId: user.organisationId } : { id: user.branchId ?? '' },
      orderBy: { name: 'asc' }
    });
    return res.json({ branches });
  })
);

branchesRouter.post(
  '/',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const branch = await prisma.branch.create({
      data: { ...(req.body as BranchBody), organisationId: user.organisationId }
    });
    return res.status(201).json({ branch });
  })
);

branchesRouter.put(
  '/:id',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const branch = await prisma.branch.update({
      where: { id: req.params.id, organisationId: user.organisationId },
      data: req.body as Partial<BranchBody>
    });
    return res.json({ branch });
  })
);

type BranchBody = {
  name: string;
  code: string;
  gstin?: string | null;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
};
