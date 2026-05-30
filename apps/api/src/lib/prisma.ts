import { PrismaClient } from '@prisma/client';

const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var ledgerxPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.ledgerxPrisma ??
  new PrismaClient({
    datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.ledgerxPrisma = prisma;
}
