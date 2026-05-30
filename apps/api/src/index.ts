import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { logger } from './lib/logger.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { authRouter } from './routes/auth.js';
import { branchesRouter } from './routes/branches.js';
import { customersRouter } from './routes/customers.js';
import { dashboardRouter } from './routes/dashboard.js';
import { invoicesRouter } from './routes/invoices.js';
import { creditNotesRouter, debitNotesRouter } from './routes/notes.js';
import { organisationsRouter } from './routes/organisations.js';
import { productsRouter } from './routes/products.js';
import { usersRouter } from './routes/users.js';
import { vendorsRouter } from './routes/vendors.js';

dotenv.config({ path: '../../.env' });
dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('tiny'));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'ledgerx-api' }));
app.use('/api/auth', authRouter);
app.use('/api/organisation', requireAuth, organisationsRouter);
app.use('/api/branches', requireAuth, branchesRouter);
app.use('/api/users', requireAuth, usersRouter);
app.use('/api/customers', requireAuth, customersRouter);
app.use('/api/vendors', requireAuth, vendorsRouter);
app.use('/api/products', requireAuth, productsRouter);
app.use('/api/invoices', requireAuth, invoicesRouter);
app.use('/api/credit-notes', requireAuth, creditNotesRouter);
app.use('/api/debit-notes', requireAuth, debitNotesRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error(message);
  return res.status(500).json({ error: message, code: 'INTERNAL_ERROR' });
});

app.listen(port, () => {
  logger.info(`API listening on ${port}`);
});
