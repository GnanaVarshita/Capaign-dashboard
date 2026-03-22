# 🚀 Complete Development Setup Guide for Codespace

A comprehensive guide to set up and run the Ad Campaign Dashboard in your GitHub Codespace with DevContainer support.

---

## 📋 Table of Contents

1. [Environment Overview](#environment-overview)
2. [DevContainer Setup](#devcontainer-setup)
3. [Manual Setup (Codespace)](#manual-setup-codespace)
4. [Package Installation](#package-installation)
5. [Running the Application](#running-the-application)
6. [Common Commands](#common-commands)
7. [Troubleshooting](#troubleshooting)

---

## 🔍 Environment Overview

This is a **pnpm monorepo** with multiple packages:

```
Packages:
├── artifacts/
│   ├── ad-campaign-dashboard   (React + Vite Frontend)
│   ├── api-server              (Express Backend)
│   └── mockup-sandbox          (Development sandbox)
├── lib/
│   ├── api-client-react        (API client library)
│   ├── api-spec                (OpenAPI specifications)
│   ├── api-zod                 (Zod schemas)
│   └── db                      (Database configuration)
└── scripts/
    └── src/                    (Utility scripts)
```

**Key Technologies:**
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Express, Node.js
- **Package Manager**: pnpm (faster and more efficient than npm)
- **Build Tool**: TypeScript, Vite
- **Database**: Drizzle ORM

---

## 🐳 DevContainer Setup

### What is a DevContainer?

A DevContainer ensures consistent development environments across all machines. It includes all necessary tools, extensions, and configurations.

### Using DevContainer in Codespace

**Option 1: Automatic Setup (Recommended)**

1. **Reopen in Container** (VS Code will suggest this automatically):
   - Press `Ctrl + Shift + P` (or `Cmd + Shift + P` on Mac)
   - Search and select: **"Dev Containers: Reopen in Container"**
   - Wait for the container to build (~2-3 minutes on first run)

2. **Automatic post-setup runs**:
   - pnpm is installed globally
   - All dependencies are installed
   - Type definitions are generated
   - Extensions are configured

**Option 2: Manual Container Creation**

```bash
# In terminal
code --folder-uri vscode-remote://dev-container+/workspaces/Capaign-dashboard
```

### DevContainer Configuration

📁 **.devcontainer/devcontainer.json** includes:

```json
Features:
- Node.js 22 (LTS)
- Git integration
- GitHub CLI tools

VS Code Extensions:
- TypeScript support
- Prettier (code formatter)
- ESLint (linter)
- GitHub Copilot
- Pull Request tools

Port Forwarding:
- 3000: Frontend app
- 5173: Vite dev server
- 3001: API server
```

---

## 🛠️ Manual Setup (Codespace)

If you prefer manual setup or DevContainer isn't available:

### Step 1: Verify Node.js and npm

```bash
node --version      # Should be v18+
npm --version       # Should be v8+
```

### Step 2: Install pnpm Globally

```bash
npm install -g pnpm@latest

# Verify installation
pnpm --version      # Should be v9+
```

### Step 3: Clone and Navigate

```bash
cd /workspaces/Capaign-dashboard

# Verify you're in the right directory
ls -la | grep package.json
```

### Step 4: Configure Git (First Time Only)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@gmail.com"

# Verify
git config --global --list | grep user
```

---

## 📦 Package Installation

### Full Installation (All Packages)

```bash
# Install all workspace dependencies
pnpm install

# This installs:
# ✅ Root workspace dependencies
# ✅ Frontend app dependencies
# ✅ Backend server dependencies
# ✅ Shared library dependencies
```

**Expected output:**
```
WARN  The current package manager is pnpm. Only pnpm is allowed here. [use strict-package-manager policy]
Progress message...
Done: 1234 packages installed
```

### Installation Time: ~2-5 minutes (first time)

### Install Specific Package

```bash
# Frontend only
pnpm -F @workspace/ad-campaign-dashboard install

# Backend only
pnpm -F @workspace/api-server install

# Database package
pnpm -F @workspace/db install
```

### Verify Installation

```bash
# Check all dependencies
pnpm ls --depth 0

# Expected output shows workspace packages:
${WORKSPACES_DETAILS}  0.0.0  private
├─ @workspace/ad-campaign-dashboard  0.0.0  private
├─ @workspace/api-server  0.0.0  private
├─ @workspace/db  0.0.0  private
├─ @workspace/api-client-react  0.0.0  private
└─ ...
```

---

## 🚀 Running the Application

### Option 1: Run Frontend Only

```bash
# Terminal 1: Start Vite dev server
pnpm -F @workspace/ad-campaign-dashboard run dev

# Output should show:
# VITE v7.3.0  ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://<IP>:5173/
```

**Access the app:**
- Local: http://localhost:5173 (inside codespace)
- Or use the port forwarded URL provided by GitHub Codespace

### Option 2: Run Frontend + Backend

**Terminal 1: Start the API server**

```bash
pnpm -F @workspace/api-server run dev

# Output should show:
# Server running on http://localhost:3001
```

**Terminal 2: Start the frontend**

```bash
pnpm -F @workspace/ad-campaign-dashboard run dev

# Output should show:
# ➜  Local:   http://localhost:5173/
```

### Access the Application

- **Frontend**: http://localhost:5173 (or Codespace URL)
- **API Server**: http://localhost:3001 (internal use)
- **Health Check**: http://localhost:3001/health

### Option 3: Build for Production

```bash
# Build all packages
pnpm run build

# Build specific package
pnpm -F @workspace/ad-campaign-dashboard run build

# Serve production build
pnpm -F @workspace/ad-campaign-dashboard run serve
```

---

## 📚 Common Commands

### Project Management

```bash
# Check all packages and their status
pnpm ls

# List installed scripts
pnpm run

# Typecheck entire project
pnpm run typecheck

# Typecheck specific package
pnpm -F @workspace/ad-campaign-dashboard run typecheck
```

### Frontend Development

```bash
# Start development server
pnpm -F @workspace/ad-campaign-dashboard run dev

# Build production bundle
pnpm -F @workspace/ad-campaign-dashboard run build

# Preview production build
pnpm -F @workspace/ad-campaign-dashboard run serve

# Type checking
pnpm -F @workspace/ad-campaign-dashboard run typecheck
```

### Backend Development

```bash
# Start API server (development mode with hot-reload)
pnpm -F @workspace/api-server run dev

# Build production bundle
pnpm -F @workspace/api-server run build

# Type checking
pnpm -F @workspace/api-server run typecheck
```

### Dependency Management

```bash
# Add a new dependency to frontend
pnpm -F @workspace/ad-campaign-dashboard add package-name

# Add dev dependency
pnpm -F @workspace/ad-campaign-dashboard add --save-dev package-name

# Update all dependencies
pnpm update

# Clean node_modules and reinstall
pnpm clean && pnpm install
```

### Git & Deployment

```bash
# Check git status
git status

# Commit changes
git add .
git commit -m "Your message"

# Push to GitHub (triggers automatic deployment)
git push

# View deployment status
# Go to: https://github.com/GnanaVarshita/Capaign-dashboard/actions
```

---

## 🔧 Troubleshooting

### Issue 1: "Use pnpm instead" Error

**Problem**: Using npm or yarn causes this error.

**Solution**:
```bash
# Make sure pnpm is installed globall
npm install -g pnpm@latest

# Verify
pnpm --version

# Try installation again
pnpm install
```

### Issue 2: Port Already in Use

**Problem**: Port 5173 or 3001 is already in use.

**Solution**:
```bash
# Find process using port 5173
lsof -i :5173

# Kill the process
kill -9 <PID>

# Or start on a different port
pnpm -F @workspace/ad-campaign-dashboard run dev -- --port 5174
```

### Issue 3: Dependencies not installing

**Problem**: `pnpm install` fails or seems stuck.

**Solution**:
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm install

# Or complete clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue 4: TypeScript Errors

**Problem**: Type checking failures after update.

**Solution**:
```bash
# Rebuild type definitions
pnpm run typecheck:libs

# Type check entire project
pnpm run typecheck

# View errors in detail
pnpm run typecheck 2>&1 | head -50
```

### Issue 5: DevContainer Not Building

**Problem**: DevContainer build fails or hangs.

**Solution**:
1. **Rebuild container**:
   - Press `Ctrl + Shift + P` → search "Dev Containers: Rebuild Container"
   - Wait 5-10 minutes

2. **Force rebuild from scratch**:
   - Press `Ctrl + Shift + P` → search "Dev Containers: Remove Container"
   - Then "Dev Containers: Reopen in Container"

3. **Check logs**:
   - Click the notification bell icon
   - View "Dev Container" logs for errors

---

## 📱 Development Workflow

### Typical Daily Workflow

```bash
# 1. Start of day - update dependencies
pnpm install

# 2. Open two terminals
# Terminal 1: Backend
pnpm -F @workspace/api-server run dev

# Terminal 2: Frontend
pnpm -F @workspace/ad-campaign-dashboard run dev

# 3. Make code changes
# (Both dev servers auto-reload on file changes)

# 4. Type check before committing
pnpm run typecheck

# 5. Commit and push
git add .
git commit -m "Feature: Add new campaign filter"
git push
# GitHub Actions automatically builds and deploys!
```

### Development Tips

1. **Auto-reload enabled**: Changes to code automatically reload in browser
2. **Hot Module Replacement (HMR)**: React components update without full reload
3. **TypeScript strict mode**: Errors caught during development, not production
4. **ESLint integration**: Code quality checks on save

---

## 📖 Additional Resources

- **Quick Start**: See [QUICK_START.md](QUICK_START.md)
- **Git Guide**: See [GIT_DEPLOYMENT_GUIDE.md](GIT_DEPLOYMENT_GUIDE.md)
- **Project Structure**: See [INDEX.md](INDEX.md)
- **Deployment**: See [README_DEPLOYMENT.md](README_DEPLOYMENT.md)

---

## ✅ Quick Verification Checklist

After setup, verify everything works:

- [ ] `pnpm --version` shows v9+ version
- [ ] `pnpm install` completes without errors
- [ ] `pnpm run typecheck` passes without errors
- [ ] `pnpm -F @workspace/ad-campaign-dashboard run dev` starts without errors
- [ ] Frontend is accessible at http://localhost:5173
- [ ] API server starts at http://localhost:3001
- [ ] `git config user.name` shows your name
- [ ] `git config user.email` shows your email

---

## 🎯 You're All Set!

Your development environment is configured and ready. Pick any of the "Running the Application" options above and start building! 🚀

For questions, check the troubleshooting section or review the other documentation files.
