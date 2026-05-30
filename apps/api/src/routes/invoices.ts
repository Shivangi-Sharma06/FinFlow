import { Router } from 'express';
import type { InvoiceStatus } from '@prisma/client';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { assertBranchAccess, requireMinimumRole, scopeToBranch } from '../middleware/rbac.middleware.js';
import { calculateInvoiceTotals, calculateLineItemTax, getBranchSupplyStateCode, isInterStateSupply } from '../services/gst.service.js';
import { generateInvoiceNumber } from '../services/invoice-number.service.js';
import { renderInvoicePdf } from '../services/pdf.service.js';
import type { AuthRequest } from '../types/express.js';

export const invoicesRouter = Router();

invoicesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const status = typeof req.query.status === 'string' ? (req.query.status as InvoiceStatus) : undefined;
    const branchId = typeof req.query.branchId === 'string' && user.role === 'SUPER_ADMIN' ? req.query.branchId : undefined;
    const invoices = await prisma.invoice.findMany({
      where: {
        organisationId: user.organisationId,
        ...scopeToBranch(req as AuthRequest),
        ...(branchId ? { branchId } : {}),
        ...(status ? { status } : {})
      },
      include: { customer: true, branch: true },
      orderBy: { invoiceDate: 'desc' }
    });
    return res.json({ invoices });
  })
);

invoicesRouter.post(
  '/',
  requireMinimumRole('ACCOUNTANT'),
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const body = req.body as InvoiceCreateBody;

    if (!assertBranchAccess(req as AuthRequest, body.branchId)) {
      return res.status(403).json({ error: 'Branch access denied', code: 'FORBIDDEN' });
    }

    const [branch, customer, products] = await Promise.all([
      prisma.branch.findFirst({ where: { id: body.branchId, organisationId: user.organisationId } }),
      prisma.customer.findFirst({ where: { id: body.customerId, organisationId: user.organisationId } }),
      prisma.product.findMany({
        where: { id: { in: body.items.map((item) => item.productId) }, organisationId: user.organisationId }
      })
    ]);

    if (!branch || !customer) return res.status(400).json({ error: 'Invalid branch or customer', code: 'BAD_REQUEST' });

    const productMap = new Map(products.map((product) => [product.id, product]));
    const supplyStateCode = getBranchSupplyStateCode(branch);
    const interState = isInterStateSupply(supplyStateCode, customer.billingStateCode);
    const calculatedItems = body.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      const rate = item.rate ?? Number(product.sellingPrice);
      const tax = calculateLineItemTax(
        {
          quantity: item.quantity,
          rate,
          discount: item.discount ?? 0,
          gstRate: Number(product.gstRate),
          cessRate: Number(product.cessRate)
        },
        interState
      );
      return { item, product, rate, tax };
    });
    const totals = calculateInvoiceTotals(calculatedItems.map((item) => item.tax));
    const invoiceNumber = await generateInvoiceNumber(branch.id, branch.code, prisma);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        organisationId: user.organisationId,
        branchId: branch.id,
        customerId: customer.id,
        status: body.issue ? 'ISSUED' : 'DRAFT',
        invoiceDate: new Date(body.invoiceDate),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        placeOfSupply: customer.billingState,
        placeOfSupplyCode: customer.billingStateCode,
        isInterState: interState,
        subtotal: totals.subtotal,
        totalCgst: totals.totalCgst,
        totalSgst: totals.totalSgst,
        totalIgst: totals.totalIgst,
        totalCess: totals.totalCess,
        totalDiscount: calculatedItems.reduce((sum, line) => sum + (line.item.discount ?? 0), 0),
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        amountPaid: 0,
        balanceDue: totals.grandTotal,
        notes: body.notes,
        termsConditions: body.termsConditions,
        createdById: user.id,
        items: {
          create: calculatedItems.map(({ item, product, rate, tax }) => ({
            productId: product.id,
            description: item.description ?? product.name,
            hsnSacCode: product.hsnSacCode,
            quantity: item.quantity,
            unit: product.unit,
            rate,
            discount: item.discount ?? 0,
            taxableAmount: tax.taxableAmount,
            gstRate: Number(product.gstRate),
            cessRate: Number(product.cessRate),
            cgst: tax.cgst,
            sgst: tax.sgst,
            igst: tax.igst,
            cess: tax.cess,
            lineTotal: tax.lineTotal
          }))
        },
        auditLogs: {
          create: {
            userId: user.id,
            action: body.issue ? 'INVOICE_ISSUED' : 'INVOICE_CREATED',
            entityType: 'Invoice',
            entityId: invoiceNumber,
            after: { invoiceNumber, status: body.issue ? 'ISSUED' : 'DRAFT' }
          }
        }
      },
      include: { items: true, customer: true, branch: true }
    });

    return res.status(201).json({ invoice });
  })
);

invoicesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, organisationId: user.organisationId, ...scopeToBranch(req as AuthRequest) },
      include: { items: { include: { product: true } }, customer: true, branch: true, payments: true, creditNotes: true, debitNotes: true }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found', code: 'NOT_FOUND' });
    return res.json({ invoice });
  })
);

invoicesRouter.get(
  '/:id/pdf',
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, organisationId: user.organisationId, ...scopeToBranch(req as AuthRequest) },
      include: { items: true, customer: true, branch: true, organisation: true }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found', code: 'NOT_FOUND' });
    const stream = await renderInvoicePdf(invoice);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber.replaceAll('/', '-')}.pdf"`);
    stream.pipe(res);
    return undefined;
  })
);

invoicesRouter.put(
  '/:id',
  requireMinimumRole('ACCOUNTANT'),
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, organisationId: user.organisationId, ...scopeToBranch(req as AuthRequest) }
    });
    if (!existing) return res.status(404).json({ error: 'Invoice not found', code: 'NOT_FOUND' });
    if (existing.status !== 'DRAFT') return res.status(409).json({ error: 'Only draft invoices can be updated', code: 'INVALID_STATE' });
    const body = req.body as Partial<Pick<InvoiceCreateBody, 'invoiceDate' | 'dueDate' | 'notes' | 'termsConditions'>>;
    const invoice = await prisma.invoice.update({
      where: { id: existing.id },
      data: {
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        notes: body.notes,
        termsConditions: body.termsConditions
      }
    });
    return res.json({ invoice });
  })
);

invoicesRouter.post(
  '/:id/issue',
  requireMinimumRole('BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    if (!req.params.id) return res.status(400).json({ error: 'Invoice id is required', code: 'BAD_REQUEST' });
    return transitionInvoice(req as AuthRequest, res, req.params.id, 'ISSUED', 'INVOICE_ISSUED');
  })
);

invoicesRouter.post(
  '/:id/cancel',
  requireMinimumRole('BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    if (!req.params.id) return res.status(400).json({ error: 'Invoice id is required', code: 'BAD_REQUEST' });
    return transitionInvoice(req as AuthRequest, res, req.params.id, 'CANCELLED', 'INVOICE_CANCELLED');
  })
);

invoicesRouter.post(
  '/:id/payment',
  requireMinimumRole('ACCOUNTANT'),
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const body = req.body as { amount: number; paymentDate?: string; method?: string; reference?: string };
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, organisationId: user.organisationId, ...scopeToBranch(req as AuthRequest) }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found', code: 'NOT_FOUND' });
    const amountPaid = Number(invoice.amountPaid) + body.amount;
    const balanceDue = Math.max(0, Number(invoice.grandTotal) - amountPaid);
    const status: InvoiceStatus = balanceDue === 0 ? 'PAID' : 'PARTIALLY_PAID';
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: body.amount,
          paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
          method: body.method ?? 'Bank Transfer',
          reference: body.reference,
          recordedById: user.id
        }
      });
      const updated = await tx.invoice.update({
        where: { id: invoice.id },
        data: { amountPaid, balanceDue, status }
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'PAYMENT_RECORDED',
          entityType: 'Invoice',
          entityId: invoice.id,
          invoiceId: invoice.id,
          after: { amount: body.amount, amountPaid, balanceDue, status }
        }
      });
      return { payment, invoice: updated };
    });
    return res.status(201).json(result);
  })
);

type InvoiceCreateBody = {
  branchId: string;
  customerId: string;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  termsConditions?: string;
  issue?: boolean;
  items: Array<{
    productId: string;
    description?: string;
    quantity: number;
    rate?: number;
    discount?: number;
  }>;
};

async function transitionInvoice(req: AuthRequest, res: import('express').Response, id: string, status: InvoiceStatus, action: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, organisationId: req.user.organisationId, ...scopeToBranch(req) }
  });
  if (!invoice) return res.status(404).json({ error: 'Invoice not found', code: 'NOT_FOUND' });
  if (invoice.status === 'PAID') return res.status(409).json({ error: 'Paid invoices cannot be changed', code: 'INVALID_STATE' });
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status,
      auditLogs: {
        create: {
          userId: req.user.id,
          action,
          entityType: 'Invoice',
          entityId: invoice.id,
          before: { status: invoice.status },
          after: { status }
        }
      }
    }
  });
  return res.json({ invoice: updated });
}
