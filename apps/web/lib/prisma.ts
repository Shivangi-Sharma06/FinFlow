import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var ledgerxWebPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.ledgerxWebPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.ledgerxWebPrisma = prisma;
}
