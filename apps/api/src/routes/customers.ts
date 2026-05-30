import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { requireMinimumRole } from '../middleware/rbac.middleware.js';
import type { AuthRequest } from '../types/express.js';

export const customersRouter = Router();

customersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const customers = await prisma.customer.findMany({
      where: { organisationId: user.organisationId, isActive: true },
      include: { invoices: { select: { balanceDue: true } } },
      orderBy: { name: 'asc' }
    });
    return res.json({
      customers: customers.map((customer) => ({
        ...customer,
        outstandingBalance: customer.invoices.reduce((sum, invoice) => sum + Number(invoice.balanceDue), 0)
      }))
    });
  })
);

customersRouter.post(
  '/',
  requireMinimumRole('ACCOUNTANT'),
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const customer = await prisma.customer.create({ data: { ...(req.body as CustomerBody), organisationId: user.organisationId } });
    return res.status(201).json({ customer });
  })
);

customersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, organisationId: user.organisationId },
      include: {
        invoices: { orderBy: { invoiceDate: 'desc' } },
        creditNotes: { orderBy: { noteDate: 'desc' } },
        debitNotes: { orderBy: { noteDate: 'desc' } }
      }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found', code: 'NOT_FOUND' });
    return res.json({ customer });
  })
);

customersRouter.put(
  '/:id',
  requireMinimumRole('ACCOUNTANT'),
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const customer = await prisma.customer.update({
      where: { id: req.params.id, organisationId: user.organisationId },
      data: req.body as Partial<CustomerBody>
    });
    return res.json({ customer });
  })
);

type CustomerBody = {
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
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingStateCode?: string | null;
  shippingPincode?: string | null;
};
