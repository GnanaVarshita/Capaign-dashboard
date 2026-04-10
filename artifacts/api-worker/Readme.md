Backend (Cloudflare Worker — api-worker)

A complete Hono-based API worker is ready at artifacts/api-worker/ with:

    Custom JWT authentication built on the Web Crypto API (no external libs needed for Workers)
    Role-scoped middleware — every endpoint enforces access based on the user's role
    35+ endpoints across 10 resource groups:
        POST /api/auth/login — returns JWT + user profile
        Users CRUD (Owner only for mutations)
        Entries CRUD + /pending + /mine (all role-filtered)
        POs CRUD + /approve, /reject, /lapse
        Bills with /submit and /pay transitions
        Budget Requests with sequential ZM → RM → AIM approval
        Config (products/activities/crops/regions)
        Vendor profiles and service receivers
        In-memory store seeded with all your mock data, ready to be swapped with Neon PostgreSQL
        wrangler.toml configured for wrangler deploy

        Frontend Refactor

        Logic is now separated into 8 clean domain hooks in src/hooks/:

            useAuth — JWT login with localStorage fallback when no API is configured
            useEntries, usePOs, useBills, useUsers, useConfig, useVendors, useBudgetRequests

        Each hook tries the API first (if VITE_API_URL is set in .env.local) and silently falls back to local mock data — so the app works today without any backend changes.

        AppContext now just orchestrates these hooks, keeping the same interface so none of your tabs needed changes.

        API Documentation — API_DOCS.md at the project root has the full spec with request/response shapes, role requirements, and Neon deployment instructions.

        Next steps when you're ready:

            Deploy the worker: cd artifacts/api-worker && npx wrangler deploy
            Create a Neon DB and replace the in-memory store with Drizzle queries
            Set VITE_API_URL=https://your-worker.workers.dev in the frontend