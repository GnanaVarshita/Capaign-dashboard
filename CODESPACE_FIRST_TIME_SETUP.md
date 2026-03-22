## ✅ First-Time Codespace Setup Checklist

Complete this checklist to ensure your development environment is properly configured.

---

### 📋 Phase 1: Prerequisites (5 minutes)

- [ ] **Node.js installed**
  ```bash
  node --version  # Should be v18 or higher
  npm --version   # Should be v8 or higher
  ```

- [ ] **Terminal access in Codespace**
  - View → Terminal (or Ctrl + `)

- [ ] **Files visible in explorer**
  - Should see: `package.json`, `pnpm-workspace.yaml`, `artifacts/`, `lib/` folders

---

### 📋 Phase 2: Install Package Manager (2 minutes)

- [ ] **Install pnpm globally**
  ```bash
  npm install -g pnpm@latest
  ```

- [ ] **Verify pnpm installation**
  ```bash
  pnpm --version  # Should show v9.x or higher
  ```

**✅ Success indicator**: pnpm version displays correctly

---

### 📋 Phase 3: Install Dependencies (3-5 minutes)

- [ ] **Navigate to project root**
  ```bash
  cd /workspaces/Capaign-dashboard
  ```

- [ ] **Run pnpm install**
  ```bash
  pnpm install
  ```
  Wait for completion. This should install ~1000+ packages across all workspaces.

- [ ] **Verify installation**
  ```bash
  pnpm ls --depth 0
  ```
  Should show list of workspace packages:
  ```
  @workspace/ad-campaign-dashboard
  @workspace/api-server
  @workspace/db
  @workspace/api-client-react
  @workspace/api-zod
  ...
  ```

**✅ Success indicator**: Command completes without errors

---

### 📋 Phase 4: Build Type Definitions (1-2 minutes)

- [ ] **Generate TypeScript type definitions**
  ```bash
  pnpm run typecheck:libs
  ```

- [ ] **Full project type check**
  ```bash
  pnpm run typecheck
  ```
  Should complete without major errors

**✅ Success indicator**: Type-checking completes

---

### 📋 Phase 5: Frontend Setup (2 minutes)

- [ ] **Navigate to frontend package**
  ```bash
  cd artifacts/ad-campaign-dashboard
  ```

- [ ] **Verify frontend dependencies**
  ```bash
  ls node_modules | head -20  # Should show React, Vite, etc.
  ```

- [ ] **Check build files**
  ```bash
  ls public/  # Should have images
  ls src/     # Should have components, pages, etc.
  ```

**✅ Success indicator**: All files and dependencies present

---

### 📋 Phase 6: Backend Setup (1 minute)

- [ ] **Navigate to backend**
  ```bash
  cd ../../artifacts/api-server
  ```

- [ ] **Verify backend structure**
  ```bash
  ls src/  # Should have index.ts, app.ts, routes/, etc.
  ```

- [ ] **Check dependencies**
  ```bash
  ls node_modules | grep express  # Should find express
  ```

**✅ Success indicator**: Backend files visible

---

### 📋 Phase 7: Git Configuration (1 minute)

- [ ] **Configure Git user (first time only)**
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your@email.com"
  ```

- [ ] **Verify Git configuration**
  ```bash
  git config --global --list | grep user
  ```

- [ ] **Check git status**
  ```bash
  git status
  ```
  Should show branch and any uncommitted changes

**✅ Success indicator**: Git user info configured and visible

---

### 📋 Phase 8: Test Frontend (3 minutes)

- [ ] **Go back to project root**
  ```bash
  cd /workspaces/Capaign-dashboard
  ```

- [ ] **Start frontend dev server**
  ```bash
  pnpm -F @workspace/ad-campaign-dashboard run dev
  ```

- [ ] **Wait for server to start**
  Look for output:
  ```
  VITE v7.3.0  ready in XXX ms
  ➜  Local:   http://localhost:5173/
  ```

- [ ] **Open frontend in browser**
  - Click the terminal notification, or
  - Visit: http://localhost:5173

- [ ] **Verify app loads**
  - Should see login page or dashboard
  - No console errors (check DevTools F12)

- [ ] **Stop server**
  - Press `Ctrl + C` in terminal

**✅ Success indicator**: App loads in browser without errors

---

### 📋 Phase 9: Test Backend (2 minutes)

- [ ] **Start backend server**
  ```bash
  pnpm -F @workspace/api-server run dev
  ```

- [ ] **Wait for server to start**
  Look for output:
  ```
  Server running on http://localhost:3001
  ```

- [ ] **Test health endpoint**
  ```bash
  curl http://localhost:3001/health
  ```
  Should return JSON response (or in new terminal/browser)

- [ ] **Stop server**
  - Press `Ctrl + C` in terminal

**✅ Success indicator**: Server starts and responds to requests

---

### 📋 Phase 10: Run Both Servers (2 minutes)

- [ ] **Open two terminals** (Ctrl + Shift + \)

- [ ] **Terminal 1: Start Backend**
  ```bash
  pnpm -F @workspace/api-server run dev
  ```

- [ ] **Terminal 2: Start Frontend**
  ```bash
  pnpm -F @workspace/ad-campaign-dashboard run dev
  ```

- [ ] **Both servers running**
  - Backend: http://localhost:3001
  - Frontend: http://localhost:5173

- [ ] **Verify frontend loads**
  - Open http://localhost:5173
  - Check console for any API errors

**✅ Success indicator**: Both servers run simultaneously without conflicts

---

### 📋 Phase 11: DevContainer Setup (Optional but Recommended)

- [ ] **Open command palette**
  - Press `Ctrl + Shift + P` (Windows/Linux) or `Cmd + Shift + P` (Mac)

- [ ] **Search for "Dev Containers: Reopen in Container"**
  - Select and click

- [ ] **Wait for container to build**
  - First build takes 3-5 minutes
  - Subsequent opens are faster

- [ ] **Verify you're in container**
  - Look for indicator in bottom left: Should show "Dev Container"

- [ ] **Verify automated setup**
  - pnpm should already be installed globally
  - Dependencies should be installed
  - Type definitions should be built

**✅ Success indicator**: DevContainer built successfully

---

### 📋 Phase 12: First Commit (Optional but Recommended)

- [ ] **Check git status**
  ```bash
  git status
  ```

- [ ] **Stage all changes**
  ```bash
  git add .
  ```

- [ ] **Create initial commit**
  ```bash
  git commit -m "Initial setup: Development environment configured"
  ```

- [ ] **Push to GitHub** (if remote is set up)
  ```bash
  git push
  ```

**✅ Success indicator**: Commit succeeds without errors

---

## 🎯 Final Verification

Run this command to verify everything:

```bash
# Check all versions and installations
echo "Node:" && node --version
echo "npm:" && npm --version
echo "pnpm:" && pnpm --version
echo "Git:" && git --version
echo ""
echo "Workspace packages:"
pnpm ls --depth 0
echo ""
echo "✅ All systems go!"
```

---

## 📊 Summary

**Time to completion**: ~20-30 minutes (first time)
**Subsequent setup**: ~5 minutes

**What's ready to use:**
- ✅ pnpm monorepo with all packages
- ✅ Frontend dev server (Vite)
- ✅ Backend API server (Express)
- ✅ TypeScript type checking
- ✅ Git configured for commits
- ✅ DevContainer configured (optional)
- ✅ VS Code extensions configured

---

## 🚀 Next Steps

Choose one option to continue:

### Option A: Quick Development
```bash
pnpm -F @workspace/ad-campaign-dashboard run dev
# Frontend opens at http://localhost:5173
```

### Option B: Full Stack Development
```bash
# Terminal 1:
pnpm -F @workspace/api-server run dev

# Terminal 2:
pnpm -F @workspace/ad-campaign-dashboard run dev
```

### Option C: Production Build
```bash
pnpm run build
pnpm -F @workspace/ad-campaign-dashboard run serve
```

### Option D: Use Interactive Helper
```bash
./codespace-helper.sh
```

---

## ❓ Issues?

If something doesn't work, check [CODESPACE_SETUP.md](CODESPACE_SETUP.md) → Troubleshooting section.

Common issues:
- **Port already in use**: Use different port with `--port 5174`
- **Dependencies not installing**: Run `pnpm clean && pnpm install`
- **TypeScript errors**: Run `pnpm run typecheck:libs`
- **DevContainer fails**: Rebuild with "Dev Containers: Rebuild Container"

---

**🎉 You're ready to develop!**
