# FinFlow / LedgerX

Multi-branch GST accounting platform for Indian retail and trading businesses.

## Quick Start

1. Copy `.env.example` to `.env` and fill `DATABASE_URL`, `DIRECT_URL`, and auth secrets.
2. Install dependencies with `npm install`.
3. Generate Prisma client with `npm run prisma:generate`.
4. Run migrations with `npm run prisma:migrate`.
5. Seed demo data with `npm run seed`.
6. Start both apps with `npm run dev`.

Default demo credentials after seeding:

- `admin@democorp.com` / `Admin@1234`
- `accountant@democorp.com` / `Account@1234`

The Next.js app runs on `http://localhost:3000`; the Express API runs on `http://localhost:4000`.
