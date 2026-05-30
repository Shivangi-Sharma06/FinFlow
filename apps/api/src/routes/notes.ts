import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { assertBranchAccess, requireMinimumRole, scopeToBranch } from '../middleware/rbac.middleware.js';
import { calculateInvoiceTotals, calculateLineItemTax, getBranchSupplyStateCode, isInterStateSupply } from '../services/gst.service.js';
import { generateNoteNumber } from '../services/invoice-number.service.js';
import type { AuthRequest } from '../types/express.js';

export const creditNotesRouter = buildNotesRouter('credit');
export const debitNotesRouter = buildNotesRouter('debit');

function buildNotesRouter(kind: 'credit' | 'debit') {
  const router = Router();
  const label = kind === 'credit' ? 'CreditNote' : 'DebitNote';
  const notePrefix = kind === 'credit' ? 'CN' : 'DN';

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const user = (req as AuthRequest).user;
      const notes =
        kind === 'credit'
          ? await prisma.creditNote.findMany({
              where: { organisationId: user.organisationId, ...scopeToBranch(req as AuthRequest) },
              include: { customer: true, branch: true, invoice: true },
              orderBy: { noteDate: 'desc' }
            })
          : await prisma.debitNote.findMany({
              where: { organisationId: user.organisationId, ...scopeToBranch(req as AuthRequest) },
              include: { customer: true, branch: true, invoice: true },
              orderBy: { noteDate: 'desc' }
            });
      return res.json({ notes });
    })
  );

  router.post(
    '/',
    requireMinimumRole('ACCOUNTANT'),
    asyncHandler(async (req, res) => {
      const user = (req as AuthRequest).user;
      const body = req.body as NoteCreateBody;
      if (!assertBranchAccess(req as AuthRequest, body.branchId)) {
        return res.status(403).json({ error: 'Branch access denied', code: 'FORBIDDEN' });
      }
      const [branch, customer] = await Promise.all([
        prisma.branch.findFirst({ where: { id: body.branchId, organisationId: user.organisationId } }),
        prisma.customer.findFirst({ where: { id: body.customerId, organisationId: user.organisationId } })
      ]);
      if (!branch || !customer) return res.status(400).json({ error: 'Invalid branch or customer', code: 'BAD_REQUEST' });
      const interState = isInterStateSupply(getBranchSupplyStateCode(branch), customer.billingStateCode);
      const taxes = body.items.map((item) => calculateLineItemTax(item, interState));
      const totals = calculateInvoiceTotals(taxes);
      const noteNumber = await generateNoteNumber(notePrefix, branch.id, branch.code, prisma);
      const createData = {
        noteNumber,
        organisationId: user.organisationId,
        branchId: branch.id,
        customerId: customer.id,
        invoiceId: body.invoiceId,
        reason: body.reason,
        noteDate: new Date(body.noteDate),
        isInterState: interState,
        subtotal: totals.subtotal,
        totalCgst: totals.totalCgst,
        totalSgst: totals.totalSgst,
        totalIgst: totals.totalIgst,
        totalCess: totals.totalCess,
        grandTotal: totals.grandTotal,
        status: body.issue ? 'ISSUED' : 'DRAFT',
        createdById: user.id
      } as const;
      const itemData = body.items.map((item, index) => ({
        description: item.description,
        hsnSacCode: item.hsnSacCode,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        taxableAmount: taxes[index]?.taxableAmount ?? 0,
        gstRate: item.gstRate,
        cessRate: item.cessRate,
        cgst: taxes[index]?.cgst ?? 0,
        sgst: taxes[index]?.sgst ?? 0,
        igst: taxes[index]?.igst ?? 0,
        cess: taxes[index]?.cess ?? 0,
        lineTotal: taxes[index]?.lineTotal ?? 0
      }));
      const note =
        kind === 'credit'
          ? await prisma.creditNote.create({ data: { ...createData, items: { create: itemData } }, include: { items: true } })
          : await prisma.debitNote.create({ data: { ...createData, items: { create: itemData } }, include: { items: true } });
      return res.status(201).json({ note });
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const user = (req as AuthRequest).user;
      const note =
        kind === 'credit'
          ? await prisma.creditNote.findFirst({
              where: { id: req.params.id, organisationId: user.organisationId, ...scopeToBranch(req as AuthRequest) },
              include: { items: true, customer: true, branch: true, invoice: true }
            })
          : await prisma.debitNote.findFirst({
              where: { id: req.params.id, organisationId: user.organisationId, ...scopeToBranch(req as AuthRequest) },
              include: { items: true, customer: true, branch: true, invoice: true }
            });
      if (!note) return res.status(404).json({ error: `${label} not found`, code: 'NOT_FOUND' });
      return res.json({ note });
    })
  );

  router.post(
    '/:id/issue',
    requireMinimumRole('BRANCH_MANAGER'),
    asyncHandler(async (req, res) => {
      if (!req.params.id) return res.status(400).json({ error: 'Note id is required', code: 'BAD_REQUEST' });
      return transitionNote(req as AuthRequest, res, req.params.id, kind, 'ISSUED');
    })
  );

  router.post(
    '/:id/cancel',
    requireMinimumRole('BRANCH_MANAGER'),
    asyncHandler(async (req, res) => {
      if (!req.params.id) return res.status(400).json({ error: 'Note id is required', code: 'BAD_REQUEST' });
      return transitionNote(req as AuthRequest, res, req.params.id, kind, 'CANCELLED');
    })
  );

  router.get('/:id/pdf', (_req, res) => {
    return res.status(501).json({ error: 'Note PDF generation is not implemented yet', code: 'NOT_IMPLEMENTED' });
  });

  return router;
}

type NoteCreateBody = {
  branchId: string;
  customerId: string;
  invoiceId?: string;
  reason: string;
  noteDate: string;
  issue?: boolean;
  items: Array<{
    description: string;
    hsnSacCode: string;
    quantity: number;
    unit: string;
    rate: number;
    discount: number;
    gstRate: number;
    cessRate: number;
  }>;
};

async function transitionNote(
  req: AuthRequest,
  res: import('express').Response,
  id: string,
  kind: 'credit' | 'debit',
  status: 'ISSUED' | 'CANCELLED'
) {
  const tx = prisma as PrismaClient;
  const note =
    kind === 'credit'
      ? await tx.creditNote.findFirst({ where: { id, organisationId: req.user.organisationId, ...scopeToBranch(req) } })
      : await tx.debitNote.findFirst({ where: { id, organisationId: req.user.organisationId, ...scopeToBranch(req) } });
  if (!note) return res.status(404).json({ error: 'Note not found', code: 'NOT_FOUND' });
  const updated =
    kind === 'credit'
      ? await tx.creditNote.update({ where: { id: note.id }, data: { status } })
      : await tx.debitNote.update({ where: { id: note.id }, data: { status } });
  return res.json({ note: updated });
}
