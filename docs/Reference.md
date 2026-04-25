 Summary of Changes

   1. Database Implementation & Seeding:
       * Created a local PostgreSQL database named api_worker.
       * Applied the database schema using drizzle-kit push.
       * Developed and executed a local seeding script (artifacts/api-worker/src/seed-local.ts) to populate the database with initial users, purchase orders, entries, and configuration
         data (products, crops, activities).

   2. Backend Configuration:
       * Created a .env file for the backend (artifacts/api-worker/.env) to ensure it connects to the local PostgreSQL instance and uses the correct JWT secret.
       * Verified that the backend server is running on http://localhost:8000 and correctly handles CORS and authentication.

   3. Frontend & Backend Connection:
       * Updated the frontend's .env file to set VITE_API_URL=http://localhost:8000, directing all API calls to the backend.
       * Refactored all frontend hooks (useAuth, useEntries, useUsers, usePOs, useBills, useBudgetRequests, useConfig, useVendors, useQuotations) to remove the conditional if (API_URL)
         checks.
       * The hooks now prioritize the backend API for all data operations, with the existing mock data logic serving as a robust fallback in case of API failure.

   4. System Verification:
       * Confirmed the backend health endpoint is operational.
       * Verified the database contains the seeded records (e.g., confirmed 4 entries in the entries table).
       * Restarted both applications in the background to ensure all configuration and code changes are active.

  The frontend is now fully integrated with the backend API, and both are supported by a live PostgreSQL database. You can now log in using the seeded credentials (e.g., abc / Abc@123
  for the Owner role).
