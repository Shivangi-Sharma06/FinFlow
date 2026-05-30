import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import type { AuthRequest } from '../types/express.js';

export const organisationsRouter = Router();

organisationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const organisation = await prisma.organisation.findUnique({
      where: { id: user.organisationId },
      include: { branches: true }
    });
    return res.json({ organisation });
  })
);

organisationsRouter.put(
  '/',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const body = req.body as {
      name?: string;
      gstin?: string;
      pan?: string;
      address?: string;
      city?: string;
      state?: string;
      stateCode?: string;
      pincode?: string;
      email?: string;
      phone?: string;
      logoUrl?: string;
    };
    const organisation = await prisma.organisation.update({
      where: { id: user.organisationId },
      data: body
    });
    return res.json({ organisation });
  })
);
