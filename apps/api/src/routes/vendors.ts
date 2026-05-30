import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { requireMinimumRole } from '../middleware/rbac.middleware.js';
import type { AuthRequest } from '../types/express.js';

export const vendorsRouter = Router();

vendorsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const vendors = await prisma.vendor.findMany({
      where: { organisationId: user.organisationId, isActive: true },
      orderBy: { name: 'asc' }
    });
    return res.json({ vendors });
  })
);

vendorsRouter.post(
  '/',
  requireMinimumRole('ACCOUNTANT'),
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const vendor = await prisma.vendor.create({ data: { ...(req.body as VendorBody), organisationId: user.organisationId } });
    return res.status(201).json({ vendor });
  })
);

vendorsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const vendor = await prisma.vendor.findFirst({ where: { id: req.params.id, organisationId: user.organisationId } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found', code: 'NOT_FOUND' });
    return res.json({ vendor, statement: [] });
  })
);

vendorsRouter.put(
  '/:id',
  requireMinimumRole('ACCOUNTANT'),
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id, organisationId: user.organisationId },
      data: req.body as Partial<VendorBody>
    });
    return res.json({ vendor });
  })
);

type VendorBody = {
  name: string;
  gstin?: string | null;
  pan?: string | null;
  email?: string | null;
  phone?: string | null;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingStateCode: string;
  billingPincode: string;
};
