import { startOfMonth } from 'date-fns';
import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { scopeToBranch } from '../middleware/rbac.middleware.js';
import type { AuthRequest } from '../types/express.js';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const branchId = (user.role === 'SUPER_ADMIN' || user.isPlatformAdmin) && typeof req.query.branchId === 'string' ? req.query.branchId : undefined;
    const where = {
      organisationId: user.organisationId,
      ...scopeToBranch(req as AuthRequest),
      ...(branchId ? { branchId } : {})
    };
    const invoices = await prisma.invoice.findMany({ where, include: { branch: true } });
    const monthStart = startOfMonth(new Date());
    const invoicesThisMonth = invoices.filter((invoice) => invoice.invoiceDate >= monthStart).length;
    const totalRevenue = invoices
      .filter((invoice) => invoice.status !== 'CANCELLED')
      .reduce((sum, invoice) => sum + Number(invoice.amountPaid), 0);
    const totalOutstanding = invoices
      .filter((invoice) => invoice.status !== 'CANCELLED')
      .reduce((sum, invoice) => sum + Number(invoice.balanceDue), 0);
    const branchRows = new Map<string, { branchId: string; branchName: string; invoices: number; revenue: number; outstanding: number }>();
    for (const invoice of invoices) {
      const row = branchRows.get(invoice.branchId) ?? {
        branchId: invoice.branchId,
        branchName: invoice.branch.name,
        invoices: 0,
        revenue: 0,
        outstanding: 0
      };
      row.invoices += 1;
      row.revenue += Number(invoice.amountPaid);
      row.outstanding += Number(invoice.balanceDue);
      branchRows.set(invoice.branchId, row);
    }
    return res.json({
      stats: { invoicesThisMonth, totalRevenue, totalOutstanding },
      branches: Array.from(branchRows.values()),
      recentInvoices: invoices.slice(0, 8)
    });
  })
);
