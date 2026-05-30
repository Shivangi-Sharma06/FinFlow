import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { addDays } from 'date-fns';
import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import type { AuthRequest } from '../types/express.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required', code: 'BAD_REQUEST' });
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { branch: true, organisation: true } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const sessionToken = randomBytes(32).toString('base64url');
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: addDays(new Date(), 30)
      }
    });

    return res.json({
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organisationId: user.organisationId,
        branchId: user.branchId,
        branch: user.branch,
        organisation: user.organisation
      }
    });
  })
);

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    if (token) {
      await prisma.session.deleteMany({ where: { sessionToken: token } });
    }
    return res.status(204).send();
  })
);

authRouter.get('/me', requireAuth, (req, res) => {
  return res.json({ user: (req as AuthRequest).user });
});
