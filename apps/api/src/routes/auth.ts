import bcrypt from 'bcrypt';
import { Router } from 'express';
import { SignJWT } from 'jose';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import type { AuthRequest } from '../types/express.js';

export const authRouter = Router();

const AUTH_SECRET = process.env.AUTH_SECRET ?? process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-auth-secret';
const AUTH_ISSUER = 'finflow';

type OrganisationClaim = { id: string; name: string };

async function signSessionToken(input: {
  userId: string;
  name: string;
  email: string;
  role: string;
  organisationId: string;
  branchId: string | null;
  isPlatformAdmin: boolean;
  availableOrganisations: OrganisationClaim[];
}) {
  return new SignJWT({
    name: input.name,
    email: input.email,
    role: input.role,
    organisationId: input.organisationId,
    branchId: input.branchId,
    isPlatformAdmin: input.isPlatformAdmin,
    availableOrganisations: input.availableOrganisations
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.userId)
    .setIssuer(AUTH_ISSUER)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(AUTH_SECRET));
}

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
    const availableOrganisations: OrganisationClaim[] = isPlatformAdmin
      ? (await prisma.organisation.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }))
      : [{ id: user.organisationId, name: user.organisation.name }];

    const resolvedOrganisationId = organisationId ?? user.organisationId;

    if (isPlatformAdmin && !resolvedOrganisationId) {
      return res.status(409).json({
        error: 'Organisation selection required for platform admin',
        code: 'ORGANISATION_REQUIRED',
        organisations: availableOrganisations
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

    const sessionToken = await signSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organisationId: organisation.id,
      branchId: user.branchId,
      isPlatformAdmin,
      availableOrganisations
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
        isPlatformAdmin,
        availableOrganisations
      }
    });
  })
);

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    return res.status(204).send();
  })
);

authRouter.get(
  '/organisations',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = (req as AuthRequest).user;

    if (user.isPlatformAdmin) {
      return res.json({ organisations: user.availableOrganisations ?? [] });
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

    if (!user.isPlatformAdmin && user.organisationId !== organisationId) {
      return res.status(403).json({ error: 'Access denied for requested organisation', code: 'FORBIDDEN' });
    }

    const organisation = user.availableOrganisations?.find((entry) => entry.id === organisationId);
    if (!organisation) {
      return res.status(404).json({ error: 'Organisation not found', code: 'NOT_FOUND' });
    }

    const sessionToken = await signSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organisationId,
      branchId: user.branchId,
      isPlatformAdmin: user.isPlatformAdmin,
      availableOrganisations: user.availableOrganisations ?? [organisation]
    });

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
