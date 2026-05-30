import type { PrismaClient } from '@prisma/client';

export function getCurrentFinancialYear(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;
  return `${String(startYear).slice(2)}${String(endYear).slice(2)}`;
}

export function branchCodeFromName(name: string): string {
  return name.replace(/[^a-zA-Z]/g, '').slice(0, 3).padEnd(3, 'X').toUpperCase();
}

export async function generateInvoiceNumber(branchId: string, branchCode: string, prisma: PrismaClient): Promise<string> {
  const fy = getCurrentFinancialYear();
  const prefix = `${branchCode.toUpperCase()}/${fy}/`;
  const count = await prisma.invoice.count({ where: { branchId, invoiceNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

export async function generateNoteNumber(
  type: 'CN' | 'DN',
  branchId: string,
  branchCode: string,
  prisma: PrismaClient
): Promise<string> {
  const fy = getCurrentFinancialYear();
  const prefix = `${type}-${branchCode.toUpperCase()}/${fy}/`;
  const count =
    type === 'CN'
      ? await prisma.creditNote.count({ where: { branchId, noteNumber: { startsWith: prefix } } })
      : await prisma.debitNote.count({ where: { branchId, noteNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}
