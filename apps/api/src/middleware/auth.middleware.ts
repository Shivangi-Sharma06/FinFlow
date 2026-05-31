import type { NextFunction, Request, Response } from 'express';
import { jwtVerify } from 'jose';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../types/express.js';

const AUTH_SECRET = process.env.AUTH_SECRET ?? process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-auth-secret';
const AUTH_ISSUER = 'finflow';

export const requireAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : queryToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
  }

  if (token.split('.').length === 3) {
    try {
      const verified = await jwtVerify(token, new TextEncoder().encode(AUTH_SECRET), { issuer: AUTH_ISSUER });
      const payload = verified.payload as {
        sub?: string;
        name?: string;
        email?: string;
        role?: string;
        organisationId?: string;
        branchId?: string | null;
        isPlatformAdmin?: boolean;
        availableOrganisations?: Array<{ id: string; name: string }>;
      };

      if (!payload.sub || !payload.name || !payload.email || !payload.role || !payload.organisationId) {
        return res.status(401).json({ error: 'Invalid or expired session', code: 'UNAUTHENTICATED' });
      }

      (req as AuthRequest).user = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role as AuthRequest['user']['role'],
        organisationId: payload.organisationId,
        branchId: payload.branchId ?? null,
        organisation: undefined,
        branch: undefined,
        isPlatformAdmin: Boolean(payload.isPlatformAdmin),
        availableOrganisations: payload.availableOrganisations ?? []
      };

      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session', code: 'UNAUTHENTICATED' });
    }
  }

  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: {
        user: {
          include: {
            branch: true,
            organisation: true
          }
        }
      }
    });

    if (!session || session.expires < new Date() || !session.user.isActive) {
      return res.status(401).json({ error: 'Invalid or expired session', code: 'UNAUTHENTICATED' });
    }

    const organisationId = session.organisationId ?? session.user.organisationId;
    if (!organisationId) {
      return res.status(401).json({ error: 'No organisation is selected for this session', code: 'UNAUTHENTICATED' });
    }

    const organisation = await prisma.organisation.findUnique({ where: { id: organisationId } });
    if (!organisation) {
      return res.status(401).json({ error: 'Organisation not found for this session', code: 'UNAUTHENTICATED' });
    }

    (req as AuthRequest).user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      organisationId,
      branchId: session.user.branchId,
      branch: session.user.branch,
      organisation,
      isPlatformAdmin: session.user.role === 'PLATFORM_ADMIN',
      availableOrganisations: [{ id: organisation.id, name: organisation.name }]
    };

    return next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication service unavailable';
    return res.status(503).json({ error: message, code: 'SERVICE_UNAVAILABLE' });
  }
});
