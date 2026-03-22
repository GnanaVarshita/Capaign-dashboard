# 🎯 Codespace Development Environment - Quick Start Summary

**Last Updated**: March 22, 2026  
**Project**: Ad Campaign Dashboard  
**Repository**: https://github.com/GnanaVarshita/Capaign-dashboard

---

## ⚡ 5-Minute Quick Start

### For Impatient Developers

```bash
# 1. Install pnpm (if not done)
npm install -g pnpm@latest

# 2. Install dependencies
pnpm install

# 3. Start frontend
pnpm -F @workspace/ad-campaign-dashboard run dev

# 4. Open browser
# Visit: http://localhost:5173
```

**Done!** 🚀 Your app is running.

---

## 📂 What You Have

### Project Structure
```
├── artifacts/
│   ├── ad-campaign-dashboard/    ← React Frontend (Vite)
│   ├── api-server/               ← Express Backend
│   └── mockup-sandbox/           ← Testing sandbox
├── lib/
│   ├── api-client-react/         ← API client
│   ├── api-spec/                 ← OpenAPI specs
│   ├── api-zod/                  ← Zod schemas
│   └── db/                       ← Database config
├── .devcontainer/                ← DevContainer config
├── scripts/                      ← Utility scripts
└── [config files]
```

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Radix UI
- **Backend**: Express, Node.js, Drizzle ORM
- **Package Manager**: pnpm (monorepo)
- **Development**: TypeScript, ESLint, Prettier

---

## 🛠️ Three Ways to Set Up

### Method 1: DevContainer (Recommended - Most Automatic)
**Time**: ~3-5 minutes (first time)

1. Open command palette: `Ctrl + Shift + P`
2. Search: **"Dev Containers: Reopen in Container"**
3. Wait for build
4. Everything is auto-configured ✅

**Advantages**:
- Consistent across all machines
- Auto-installs pnpm
- Auto-installs VS Code extensions
- Isolated environment

### Method 2: Manual Codespace Setup (Fastest to start)
**Time**: ~5-10 minutes

```bash
# Step 1: Install pnpm
npm install -g pnpm@latest

# Step 2: Install dependencies
cd /workspaces/Capaign-dashboard
pnpm install

# Step 3: Verify
pnpm run typecheck

# Done! Start developing
pnpm -F @workspace/ad-campaign-dashboard run dev
```

**Advantages**:
- Direct control
- Faster feedback
- See exactly what's happening

### Method 3: Docker Compose (For advanced users)
**Time**: ~5-10 minutes

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Or start specific service
docker-compose -f docker-compose.dev.yml up frontend
```

**Advantages**:
- Completely isolated
- Works same on any machine
- Production-like environment

---

## 📦 Package Installation

### Full Install (All packages at once)
```bash
pnpm install
```
- Installs everything: frontend, backend, shared libraries
- One command, everything ready
- **Time**: 2-5 minutes (depends on internet speed)

### Install Specific Package
```bash
# Frontend only
pnpm -F @workspace/ad-campaign-dashboard install

# Backend only
pnpm -F @workspace/api-server install

# Any workspace package
pnpm -F @workspace/db install
```

### Verify Installation
```bash
pnpm ls --depth 0
```

Should show all workspace packages. If you see errors, run:
```bash
pnpm clean && pnpm install  # Full clean reinstall
```

---

## 🚀 Running the Application

### Option 1: Frontend Only (Isolated Development)
```bash
pnpm -F @workspace/ad-campaign-dashboard run dev

# Opens at: http://localhost:5173
# Hot reload on file changes ✅
```

**Best for**: Frontend-only work, quick prototyping

### Option 2: Full Stack (Frontend + Backend)
```bash
# Terminal 1
pnpm -F @workspace/api-server run dev
# → Server at http://localhost:3001

# Terminal 2
pnpm -F @workspace/ad-campaign-dashboard run dev
# → App at http://localhost:5173
```

**Best for**: Full feature development, API integration

### Option 3: Production Build
```bash
# Build everything
pnpm run build

# Build specific package
pnpm -F @workspace/ad-campaign-dashboard run build

# Preview production build
pnpm -F @workspace/ad-campaign-dashboard run serve
# Opens at http://localhost:3000
```

**Best for**: Testing production build locally

---

## 🪟 Opening Multiple Terminals in Codespace

**Split Terminal (Recommended)**:
- `Ctrl + Shift + \` - Split terminal horizontally
- `Ctrl + Shift + J` - Focus on other terminal
- Run one server per terminal

**Or multiple terminals**:
- Use `+` button in terminal panel to create new terminal

---

## ✅ Common Commands at a Glance

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Start frontend | `pnpm -F @workspace/ad-campaign-dashboard run dev` |
| Start backend | `pnpm -F @workspace/api-server run dev` |
| Type check | `pnpm run typecheck` |
| Build all | `pnpm run build` |
| Build frontend | `pnpm -F @workspace/ad-campaign-dashboard run build` |
| View available scripts | `pnpm run` |
| Clean reinstall | `pnpm clean && pnpm install` |
| Check versions | `node -v && pnpm -v && git -v` |

---

## 🔍 Port Forwarding in Codespace

Ports are automatically forwarded:

| Port | Service | URL |
|------|---------|-----|
| 5173 | Vite Dev Server | http://localhost:5173 |
| 3001 | API Server | http://localhost:3001 |
| 3000 | Production Preview | http://localhost:3000 |

**To access from Codespace**:
- Ports tab in VS Code shows forwarded URLs
- Or click notification bell when server starts

---

## 📝 IDE Configuration (VS Code in Codespace)

**Already configured in DevContainer**:
- ✅ TypeScript support (latest)
- ✅ Prettier formatter (auto-format on save)
- ✅ ESLint integration (code quality)
- ✅ GitHub Copilot (if you have it)
- ✅ PR reviews (GitHub extension)
- ✅ Git integration

**Manual configuration** (if not using DevContainer):
```json
// settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## 🔄 Development Workflow

### Daily Workflow
```bash
# Start of day
pnpm install               # Update dependencies

# Open 2 terminals
# Terminal 1: Backend
pnpm -F @workspace/api-server run dev

# Terminal 2: Frontend
pnpm -F @workspace/ad-campaign-dashboard run dev

# Make code changes (auto-reloads)

# Before committing
pnpm run typecheck         # Check types

# Commit and push
git add .
git commit -m "Feature: Your feature"
git push
# → GitHub Actions auto-deploys! 🚀
```

### Key Features
- **Auto-reload**: Changes refresh instantly
- **Hot Module Replacement**: React updates without full page reload
- **Type safety**: Errors caught during development
- **Auto-format**: Code formatted on save

---

## 🐛 Troubleshooting

### Issue: "Use pnpm instead"
```bash
npm install -g pnpm@latest
pnpm install
```

### Issue: Port already in use (5173)
```bash
# Kill process
lsof -i :5173
kill -9 <PID>

# Or use different port
pnpm -F @workspace/ad-campaign-dashboard run dev -- --port 5174
```

### Issue: Dependencies not installing
```bash
# Complete clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: TypeScript errors after update
```bash
pnpm run typecheck:libs    # Rebuild types
pnpm run typecheck          # Check all errors
```

### Issue: DevContainer won't build
```bash
# Rebuild from scratch
# Cmd+Shift+P → "Dev Containers: Rebuild Container"
# Takes 5-10 minutes
```

**For more help**: See [CODESPACE_SETUP.md](CODESPACE_SETUP.md)

---

## 📚 Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| [CODESPACE_FIRST_TIME_SETUP.md](CODESPACE_FIRST_TIME_SETUP.md) | Step-by-step checklist | 20 min |
| [CODESPACE_SETUP.md](CODESPACE_SETUP.md) | Complete guide with details | 30 min |
| [QUICK_START.md](QUICK_START.md) | Quick git commands | 5 min |
| [GIT_DEPLOYMENT_GUIDE.md](GIT_DEPLOYMENT_GUIDE.md) | Git & deployment guide | 20 min |
| [INDEX.md](INDEX.md) | Documentation index | 5 min |

---

## 🎯 Setup Options by Experience Level

### "Just get me running" (5 minutes)
```bash
pnpm install
pnpm -F @workspace/ad-campaign-dashboard run dev
```
👉 [Read CODESPACE_FIRST_TIME_SETUP.md](CODESPACE_FIRST_TIME_SETUP.md)

### "I want DevContainer" (3-5 minutes first time)
Use VS Code's Dev Container feature. It handles everything.  
👉 [Read CODESPACE_SETUP.md](CODESPACE_SETUP.md#-devcontainer-setup)

### "I want to understand everything" (20 minutes)
Read the full setup guide with explanations and options.  
👉 [Read CODESPACE_SETUP.md](CODESPACE_SETUP.md)

### "Show me with Docker" (5-10 minutes)
Use docker-compose for isolated environment.  
👉 [Run CODESPACE_SETUP.md](CODESPACE_SETUP.md#manual-setup-codespace)

---

## 🚀 Ready to Code?

Pick your path:

**Path A: DevContainer (Recommended)**
- `Ctrl + Shift + P` → "Dev Containers: Reopen in Container"
- Wait 3-5 minutes
- Done! Everything is set up

**Path B: Manual (Fast)**
- Run: `npm install -g pnpm@latest`
- Run: `pnpm install`
- Run: `pnpm -F @workspace/ad-campaign-dashboard run dev`
- Open: http://localhost:5173

**Path C: Interactive Helper**
- Run: `./codespace-helper.sh`
- Select option from menu
- Guides you through setup

---

## ✨ What's Next?

After setup:
1. Start developing! Code changes auto-reload
2. Make commits: `git add . && git commit -m "message" && git push`
3. GitHub Actions auto-deploys on every push
4. Check deployment: GitHub Actions tab in repo

---

## 💬 Quick Reference

```bash
# Essential commands
pnpm install              # Install everything
pnpm run typecheck        # Check types
pnpm run build            # Build all

# Frontend development
pnpm -F @workspace/ad-campaign-dashboard run dev

# Backend development
pnpm -F @workspace/api-server run dev

# Help
./codespace-helper.sh     # Interactive menu
pnpm run                  # All available scripts
```

---

**You're all set! Start building! 🚀**

For detailed instructions, see the documentation files listed above.
