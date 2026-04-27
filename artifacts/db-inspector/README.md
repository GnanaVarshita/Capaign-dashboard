# DB Inspector

A simple tool to pull all data from your Neon database and save it as local JSON files for inspection.

## Setup

1.  Navigate to this directory:
    ```bash
    cd artifacts/db-inspector
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Create a `.env` file in this directory and add your `DATABASE_URL`:
    ```env
    DATABASE_URL=postgresql://your_user:your_password@your_host/neondb?sslmode=require
    ```
    *(Note: This `.env` file is ignored by Git to protect your credentials.)*

## Usage

To pull data from all tables defined in the schema:

```bash
pnpm pull
```

The data will be saved as JSON files in the `artifacts/db-inspector/data/` directory.

## Security

-   The `.env` file is listed in `.gitignore` and will not be pushed to Git.
-   The `data/` directory is listed in `.gitignore` to ensure database exports are kept local and private.
