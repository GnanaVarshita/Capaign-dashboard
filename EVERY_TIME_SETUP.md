# ⚡ Codespace Opening Checklist (Every Time)

**TL;DR**: Do this EVERY time you open the codespace to avoid "pnpm not recognized" errors.

---

## 🎯 EASIEST: Automated Setup (Recommended)

Just run this ONE command:
```bash
bash SETUP_CODESPACE.sh
```

✅ This automatically:
- Installs Node.js (if needed)
- Installs npm (if needed)
- Configures npm permissions
- Installs pnpm
- Installs all dependencies
- Verifies everything works

---

## 🔧 Alternative: Manual Setup (2 minutes)

If you prefer doing it manually:

```bash
npm install -g pnpm@latest && cd /workspaces/Capaign-dashboard && pnpm install
```

---

## ⚙️ Or Use Helper Script

```bash
bash codespace-helper.sh
# Then select option 1 for "Full Setup"
```

---

### Quick Check (30 seconds)
```bash
node --version  # Must work
npm --version   # Must work
pnpm --version  # Must exist
```

### If any command fails:

**Node/npm not found?**
```bash
# Install pnpm (this requires npm to work)
npm install -g pnpm@latest
```

**pnpm not found?**
```bash
npm install -g pnpm@latest
```

### Install Dependencies (3 minutes)
```bash
cd /workspaces/Capaign-dashboard
pnpm install
```

### Verify everything
```bash
pnpm ls --depth 0  # Should show all packages
```

---

## 🚀 Ready to Code? Run the App

### Start Frontend (Port 5173)
```bash
pnpm -F @workspace/ad-campaign-dashboard run dev
```

### Start Backend (Port 3001)
```bash
pnpm -F @workspace/api-server run dev
```

### Start Both (Open 2 terminals)
**Terminal 1:**
```bash
pnpm -F @workspace/ad-campaign-dashboard run dev
```

**Terminal 2:** (Ctrl + Shift + `)
```bash
pnpm -F @workspace/api-server run dev
```

---

## ❌ Troubleshooting

### "pnpm: command not found"
```bash
npm install -g pnpm@latest
pnpm --version  # Verify
```

### "node: command not found"
Your Node.js installation is broken. Try:
```bash
# For Alpine Linux (rare)
apk add nodejs npm

# For Debian/Ubuntu
apt update && apt install -y nodejs npm
```

### Dependencies not installed
```bash
cd /workspaces/Capaign-dashboard
pnpm install --force  # Force reinstall
pnpm ls --depth 0     # Verify
```

### Still getting errors?
Run the helper script:
```bash
bash codespace-helper.sh
# Select option 8: Clean & Reinstall Dependencies
```

---

## 📚 More Info

- Full setup guide: [CODESPACE_FIRST_TIME_SETUP.md](CODESPACE_FIRST_TIME_SETUP.md)
- Git/Deploy: [QUICK_START.md](QUICK_START.md)
- All commands: [CODESPACE_SETUP.md](CODESPACE_SETUP.md)
