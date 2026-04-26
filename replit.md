# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend API**: Hono v4 running on Node.js (via @hono/node-server) for local dev; deployable to Cloudflare Workers
- **Database**: Neon PostgreSQL + Drizzle ORM (node-postgres driver for local dev)
- **Auth**: Custom JWT (HS256/PBKDF2 password hashing, Web Crypto API)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── ad-campaign-dashboard/   # React + Vite frontend (port 5000)
│   └── api-worker/              # Hono backend API (port 8000, Node.js in dev)
├── scripts/                     # Utility scripts
│   └── src/seed-db.ts           # DB seeder (pnpm --filter @workspace/scripts run seed-db)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Running Locally

Two workflows must be running:
1. **`artifacts/ad-campaign-dashboard: web`** — Vite frontend on port 5000
2. **`Backend API`** — Hono API server on port 8000

The Vite dev server proxies all `/api/*` requests to `http://localhost:8000`, so the frontend doesn't need `VITE_API_URL`.

## Architecture

### `artifacts/ad-campaign-dashboard` (`@workspace/ad-campaign-dashboard`)

React + Vite frontend. Full-featured Advertising Campaign Dashboard.

- **Port**: 5000 (`PORT=5000` workflow env)
- **Preview**: Root web artifact at `/`
- **API**: All calls go to `/api/*` which Vite proxies to `http://localhost:8000`
- **API client**: `src/lib/api.ts` — fetch wrapper with auto Bearer token injection
- **Auth**: `src/hooks/useAuth.ts` — JWT login via API
- **Stack**: React 18, TypeScript, Tailwind CSS, Recharts, lucide-react

**Tabs** (role-gated):
1. Overview — KPI cards, product/region charts
2. Purchase Orders — region/product/activity breakdowns with live spend
3. Hierarchy — org tree with expandable regions/zones; vendor cards
4. Activities — budget vs spend bar charts
5. Vendors — vendor-grouped entry view
6. Billing — create bills from approved entries, submit/mark paid
7. Activity Sheet — submit entries (AM/ZM/RM), view own entries
8. Approvals — approve/reject pending entries
9. PO Approvals — approve/reject POs
10. PO Master — create/edit POs (3-step wizard)
11. Users — full CRUD user management
12. Territory — manage region > zone > area hierarchy
13. Quick View — PO summary with charts
14. Transactions — full ledger with multi-filter support
15. Settings — profile, password change, manage products/activities

### `artifacts/api-worker` (Hono API)

Backend API built with Hono framework.

- **Local dev**: Runs via `@hono/node-server` on port 8000 using `tsx src/server.ts`
- **Deploy target**: Cloudflare Workers (use `pnpm --filter api-worker run dev:worker` for wrangler dev)
- **Framework**: Hono v4
- **Auth**: JWT HS256 sign/verify (`src/auth/jwt.ts`), PBKDF2 password hashing (`src/auth/password.ts`)
- **DB driver**: `drizzle-orm/node-postgres` + `pg` Pool (local dev); can switch to `neon-http` for Workers
- **Schema**: `src/db/schema.ts` — users, entries, pos, regions, products, crops, activities, bills, serviceReceivers, budgetRequestGroups, budgetRequests, vendorProfiles
- **Routes**: `src/routes/` — auth, users, entries, pos, bills, budgetRequests, config, regions, vendorProfiles, serviceReceivers
- **Middleware**: `src/middleware/authMiddleware.ts` — JWT verification + role guards

**Important**: `db/index.ts` hardcodes the Neon URL to avoid Replit's injected `DATABASE_URL` (which points to a local `helium` PostgreSQL instance, not Neon).

### `scripts` (`@workspace/scripts`)

Utility scripts package.

- `seed-db`: Seeds the Neon database with initial users, regions, POs, entries, config data
  - Run: `pnpm --filter @workspace/scripts run seed-db`
  - Only seeds if DB is empty (idempotent)

## Database

**Neon PostgreSQL**: `ep-wild-butterfly-am3ofjd5.c-5.us-east-1.aws.neon.tech/neondb`

Schema pushed via: `pnpm --filter api-worker exec drizzle-kit push` (from `artifacts/api-worker/drizzle.config.ts`)

## Test Credentials

| Role | Login ID | Password |
|------|----------|----------|
| Owner | abc | Abc@123 |
| All India Manager | arjun.aim | AIM@2026 |
| Regional Manager | rajesh.north | North@123 |
| Zonal Manager | amit.up | Zone@123 |
| Area Manager | ravi.lko | Area@123 |
| Vendor | mahesh.vendor | Vendor@123 |
