# 🪟 Windows Local Run Guide

**Last Updated**: March 23, 2026  
**Project**: Ad Campaign Dashboard  
**Platform**: Windows 10/11 (CMD, PowerShell, or Git Bash)

---

## ⚡ Quick Start (Windows)

If you already have Node.js and pnpm installed:

```powershell
# 1. Install dependencies
pnpm install

# 2. Start backend (Terminal 1)
pnpm -F @workspace/api-server run dev

# 3. Start frontend (Terminal 2)
pnpm -F @workspace/ad-campaign-dashboard run dev

# 4. Open browser
# Visit: http://localhost:5173
```

#

---

## 🛠️ Prerequisites

Before running the project, ensure your Windows machine has:

1.  **Node.js**: [Download and install](https://nodejs.org/) (LTS version recommended).
2.  **pnpm**: Open PowerShell and run:
    ```powershell
    npm install -g pnpm
    ```
3.  **PowerShell Execution Policy**: If `pnpm` is blocked, run this as **Administrator**:
    ```powershell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```

---

## 📦 Installation

This project is a **monorepo**. You only need to run install once at the root.

```powershell
# From the project root (Campaign-Dashboard/)
pnpm install
```

> **Note**: I have updated the `pnpm-workspace.yaml` and `package.json` to ensure Windows-compatible binaries (like `esbuild` and `tailwindcss`) are correctly downloaded.

---

## 🚀 Running the Application

For the full experience, you need both the **API Server** and the **Frontend** running.

### Step 1: Start the Backend (API Server)

Open a terminal and run:

```powershell
cd artifacts/api-server
pnpm run dev
```

- **Default Port**: `3001`
- **URL**: `http://localhost:3001`

### Step 2: Start the Frontend (Dashboard)

Open a **second** terminal and run:

```powershell
cd artifacts/ad-campaign-dashboard
pnpm run dev
```

- **Default Port**: `5173`
- **URL**: `http://localhost:5173`

---

## ✅ Common Commands (Windows)

| Task             | Command                                                  |
| ---------------- | -------------------------------------------------------- |
| Install all deps | `pnpm install`                                           |
| Start Frontend   | `pnpm -F @workspace/ad-campaign-dashboard run dev`       |
| Start Backend    | `pnpm -F @workspace/api-server run dev`                  |
| Build All        | `pnpm run build`                                         |
| Type Check       | `pnpm run typecheck`                                     |
| Clean Reinstall  | `Remove-Item -Recurse -Force node_modules; pnpm install` |

---

## 🐛 Troubleshooting Windows Issues

### 1. "Scripts are disabled on this system"

If you get a security error when running `pnpm`, run this in PowerShell as Administrator:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Port already in use (3001 or 5173)

If a port is blocked, you can use a custom port using `cross-env` (already integrated):

```powershell
# Change backend port
cross-env PORT=3002 pnpm run dev

# Change frontend port
pnpm run dev -- --port 5174
```

### 3. Environment Variables

Windows CMD and PowerShell handle variables differently. To solve this, I've added `cross-env` to the project. You can now use the same syntax everywhere:

```powershell
cross-env NODE_ENV=development pnpm run dev
```

### 4. Node Version Errors

Ensure you are using Node 18 or higher. Check with:

```powershell
node -v
```

---

## 📂 Project Structure (Local)

- `artifacts/ad-campaign-dashboard`: React Frontend
- `artifacts/api-server`: Express Backend
- `lib/`: Shared libraries (API clients, Database schemas)
- `package.json`: Root configuration with cross-platform scripts

---

saved changes
**Happy Coding! 🚀**
