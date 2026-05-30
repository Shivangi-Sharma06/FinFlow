import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { requireMinimumRole } from '../middleware/rbac.middleware.js';
import type { AuthRequest } from '../types/express.js';

export const productsRouter = Router();

productsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const products = await prisma.product.findMany({
      where: { organisationId: user.organisationId, isActive: true },
      orderBy: { name: 'asc' }
    });
    return res.json({ products });
  })
);

productsRouter.post(
  '/',
  requireMinimumRole('ACCOUNTANT'),
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const product = await prisma.product.create({ data: { ...(req.body as ProductBody), organisationId: user.organisationId } });
    return res.status(201).json({ product });
  })
);

productsRouter.put(
  '/:id',
  requireMinimumRole('ACCOUNTANT'),
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const product = await prisma.product.update({
      where: { id: req.params.id, organisationId: user.organisationId },
      data: req.body as Partial<ProductBody>
    });
    return res.json({ product });
  })
);

type ProductBody = {
  name: string;
  description?: string | null;
  hsnSacCode: string;
  type: 'GOODS' | 'SERVICE';
  unit: string;
  gstRate: number;
  cessRate: number;
  purchasePrice: number;
  sellingPrice: number;
};
