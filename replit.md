# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `artifacts/api-worker` (Cloudflare Worker)

Backend API built with Hono framework, targeting Cloudflare Workers for free hosting.

- **Framework**: Hono v4
- **Auth**: Custom JWT (HS256) via Web Crypto API — no external libraries needed
- **Database**: Neon PostgreSQL (serverless). Currently uses in-memory store; swap with Drizzle queries when Neon DB URL is configured.
- **Deploy**: `wrangler deploy` (Cloudflare free tier)
- **Entry**: `src/index.ts` — all routes
- **Seed data**: `src/data/seed.ts` — full mock users, entries, POs, regions
- **Auth layer**: `src/auth/jwt.ts` (sign/verify), `src/middleware/authMiddleware.ts` (Hono middleware + role guards)
- **API docs**: `API_DOCS.md` at project root — full endpoint reference with request/response shapes
- Set `VITE_API_URL` in the frontend `.env.local` to enable API mode: `VITE_API_URL=https://...workers.dev`

### `artifacts/ad-campaign-dashboard` (`@workspace/ad-campaign-dashboard`)

React + Vite frontend. Full-featured Advertising Campaign Dashboard.

- **Port**: `20289` (reads `PORT` env var)
- **Auth**: `src/hooks/useAuth.ts` — JWT login via API, falls back to localStorage mock
- **Persistence**: All state in `localStorage` under key `ad_campaign_db` (fallback when no API)
- **Stack**: React 18, TypeScript, Tailwind CSS, Recharts, lucide-react, clsx, tailwind-merge
- **Context**: `src/context/AppContext.tsx` — orchestrates domain hooks, provides single API surface
- **Domain hooks** (`src/hooks/`):
  - `useAuth.ts` — login/logout with JWT + localStorage fallback
  - `useEntries.ts` — activity entry CRUD + role-scoped queries
  - `usePOs.ts` — PO CRUD + visibility scoping
  - `useBills.ts` — bill creation, submission, payment tracking
  - `useUsers.ts` — user management CRUD
  - `useConfig.ts` — products, activities, crops, regions
  - `useVendors.ts` — vendor profiles + service receivers
  - `useBudgetRequests.ts` — budget request groups + sequential approval
- **API client**: `src/lib/api.ts` — fetch wrapper with auto Bearer token injection
- **Mock data**: `src/lib/mock-data.ts` — 9 users, 4 POs (2 active, 1 expiring, 1 draft), 4 entries, 4 regions with zones/areas

**15 Tabs** (role-gated):
1. Overview — KPI cards, product/region charts
2. Purchase Orders — region/product/activity breakdowns with live spend
3. Hierarchy — org tree with expandable regions/zones; vendor cards
4. Activities — budget vs spend bar charts, breakdown table
5. Vendors — vendor-grouped entry view
6. Billing — create bills from approved entries, submit/mark paid
7. Activity Sheet — submit entries (AM/ZM/RM), view own entries
8. Approvals — approve/reject pending entries (ZM/RM/AIM/Owner)
9. PO Approvals — approve/reject POs (Owner/AIM only)
10. PO Master — create/edit POs (3-step wizard), distribute budgets
11. Users — full CRUD user management with role/territory/perms
12. Territory — manage region > zone > area hierarchy
13. Quick View — PO summary with pie chart + region progress bars
14. Transactions — full ledger with multi-filter support
15. Settings — profile, password change, manage products/activities, export/reset

**Credentials**: abc/Abc@123 (Owner), arjun.aim/AIM@2026 (AIM), rajesh.north/North@123 (RM), amit.up/Zone@123 (ZM), ravi.lko/Area@123 (AM), mahesh.vendor/Vendor@123 (Vendor)

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
