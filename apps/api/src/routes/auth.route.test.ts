import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { compareMock, prismaMock } = vi.hoisted(() => {
  const compare = vi.fn();
  return {
    compareMock: compare,
    prismaMock: {
      user: { findUnique: vi.fn() },
      organisation: { findMany: vi.fn(), findUnique: vi.fn() },
      session: { create: vi.fn(), deleteMany: vi.fn() },
      $transaction: vi.fn()
    }
  };
});

vi.mock('bcrypt', () => ({
  default: { compare: compareMock }
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: prismaMock
}));

import { authRouter } from './auth.js';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

describe('authRouter /login platform admin flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns organisation selection required for platform admin without organisation', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Platform Admin',
      email: 'platform@example.com',
      passwordHash: 'hash',
      role: 'PLATFORM_ADMIN',
      organisationId: null,
      branchId: null,
      isActive: true,
      branch: null,
      organisation: null
    });
    compareMock.mockResolvedValue(true);
    prismaMock.organisation.findMany.mockResolvedValue([
      { id: 'org-1', name: 'Org One' },
      { id: 'org-2', name: 'Org Two' }
    ]);

    const response = await request(makeApp()).post('/api/auth/login').send({
      email: 'platform@example.com',
      password: 'secret'
    });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('ORGANISATION_REQUIRED');
    expect(response.body.organisations).toHaveLength(2);
  });

  it('rejects non-platform user requesting another organisation', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-2',
      name: 'Org Admin',
      email: 'org@example.com',
      passwordHash: 'hash',
      role: 'SUPER_ADMIN',
      organisationId: 'org-1',
      branchId: null,
      isActive: true,
      branch: null,
      organisation: { id: 'org-1', name: 'Org One' }
    });
    compareMock.mockResolvedValue(true);

    const response = await request(makeApp()).post('/api/auth/login').send({
      email: 'org@example.com',
      password: 'secret',
      organisationId: 'org-2'
    });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
  });

  it('creates session with selected organisation for platform admin', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-3',
      name: 'Platform Admin',
      email: 'platform@example.com',
      passwordHash: 'hash',
      role: 'PLATFORM_ADMIN',
      organisationId: null,
      branchId: null,
      isActive: true,
      branch: null,
      organisation: null
    });
    compareMock.mockResolvedValue(true);
    prismaMock.organisation.findUnique.mockResolvedValue({ id: 'org-2', name: 'Org Two' });
    prismaMock.session.create.mockResolvedValue({ id: 'session-1' });

    const response = await request(makeApp()).post('/api/auth/login').send({
      email: 'platform@example.com',
      password: 'secret',
      organisationId: 'org-2'
    });

    expect(response.status).toBe(200);
    expect(response.body.user.organisationId).toBe('org-2');
    expect(response.body.sessionToken).toBeTypeOf('string');
    expect(prismaMock.session.create).toHaveBeenCalledTimes(1);
    const firstCall = prismaMock.session.create.mock.calls.at(0);
    expect(firstCall?.[0]?.data.organisationId).toBe('org-2');
  });
});
