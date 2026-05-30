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
    const { email, password, organisationId } = req.body as {
      email?: string;
      password?: string;
      organisationId?: string;
    };
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

    const isPlatformAdmin = user.role === 'PLATFORM_ADMIN';
    const resolvedOrganisationId = organisationId ?? user.organisationId;

    if (isPlatformAdmin && !resolvedOrganisationId) {
      const organisations = await prisma.organisation.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      });
      return res.status(409).json({
        error: 'Organisation selection required for platform admin',
        code: 'ORGANISATION_REQUIRED',
        organisations
      });
    }

    if (!isPlatformAdmin && organisationId && organisationId !== user.organisationId) {
      return res.status(403).json({ error: 'Access denied for requested organisation', code: 'FORBIDDEN' });
    }

    if (!resolvedOrganisationId) {
      return res.status(400).json({ error: 'No organisation is mapped to this user', code: 'BAD_REQUEST' });
    }

    const organisation =
      user.organisationId === resolvedOrganisationId
        ? user.organisation
        : await prisma.organisation.findUnique({ where: { id: resolvedOrganisationId } });

    if (!organisation) {
      return res.status(404).json({ error: 'Organisation not found', code: 'NOT_FOUND' });
    }

    const sessionToken = randomBytes(32).toString('base64url');
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        organisationId: organisation.id,
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
        organisationId: organisation.id,
        branchId: user.branchId,
        branch: user.branch,
        organisation,
        isPlatformAdmin
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

authRouter.get(
  '/organisations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;

    if (user.isPlatformAdmin) {
      const organisations = await prisma.organisation.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      });
      return res.json({ organisations });
    }

    if (!user.organisation) {
      return res.status(404).json({ error: 'Organisation not found', code: 'NOT_FOUND' });
    }

    return res.json({ organisations: [{ id: user.organisation.id, name: user.organisation.name }] });
  })
);

authRouter.post(
  '/switch-organisation',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;
    const { organisationId } = req.body as { organisationId?: string };
    if (!organisationId) {
      return res.status(400).json({ error: 'Organisation ID is required', code: 'BAD_REQUEST' });
    }

    const header = req.headers.authorization;
    const currentToken = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

    if (!currentToken) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
    }

    if (!user.isPlatformAdmin && user.organisationId !== organisationId) {
      return res.status(403).json({ error: 'Access denied for requested organisation', code: 'FORBIDDEN' });
    }

    const organisation = await prisma.organisation.findUnique({ where: { id: organisationId } });
    if (!organisation) {
      return res.status(404).json({ error: 'Organisation not found', code: 'NOT_FOUND' });
    }

    const sessionToken = randomBytes(32).toString('base64url');
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { sessionToken: currentToken } }),
      prisma.session.create({
        data: {
          sessionToken,
          userId: user.id,
          organisationId,
          expires: addDays(new Date(), 30)
        }
      })
    ]);

    return res.json({
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organisationId,
        branchId: user.branchId,
        branch: user.branch,
        organisation,
        isPlatformAdmin: user.isPlatformAdmin
      }
    });
  })
);

authRouter.get('/me', requireAuth, (req, res) => {
  return res.json({ user: (req as AuthRequest).user });
});
