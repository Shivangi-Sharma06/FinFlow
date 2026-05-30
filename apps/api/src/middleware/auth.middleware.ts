import type { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from '../types/express.js';

export const requireAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : queryToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHENTICATED' });
  }

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

  (req as AuthRequest).user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    organisationId: session.user.organisationId,
    branchId: session.user.branchId,
    branch: session.user.branch,
    organisation: session.user.organisation
  };

  return next();
});
