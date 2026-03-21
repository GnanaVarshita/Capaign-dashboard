# Quick Start: Git & Deploy Guide

## ⚡ TL;DR - Just Get It Done

### First Time Setup (5 minutes)

```bash
# 1. Configure Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 2. Add GitHub remote
git remote add origin https://github.com/GnanaVarshita/Capaign-dashboard.git

# 3. Stage and commit
git add .
git commit -m "Initial commit: Ad Campaign Dashboard"

# 4. Push to GitHub
git branch -M main
git push -u origin main

# 5. Enable GitHub Pages (go to repo settings, select gh-pages branch)
# Done! 🎉
```

---

## 📋 Step-by-Step Instructions

### Step 1: Generate GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` and `workflow`
4. Copy the token (save it safely!)

### Step 2: Initial Setup

```bash
# Navigate to project
cd ~/Gnana-Dev/Campaign-Dashboard

# Configure Git (first time only)
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# Verify configuration
git config --global --list
```

### Step 3: Initialize Git Remote

```bash
# Check if remote exists
git remote -v

# If not, add it
git remote add origin https://github.com/GnanaVarshita/Capaign-dashboard.git

# If exists, update it
git remote set-url origin https://github.com/GnanaVarshita/Capaign-dashboard.git
```

### Step 4: Push Code to Repository

```bash
# Check status
git status

# Stage all files
git add .

# Commit
git commit -m "Initial commit: Project setup with new features"

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main

# For future pushes, just use
git push
```

### Step 5: Set Up GitHub Pages Deployment

**Option A: Automatic (Recommended)**

1. Go to your repository: https://github.com/GnanaVarshita/Capaign-dashboard
2. Click **Settings** → **Pages**
3. Select source: **Deploy from a branch**
4. Branch: **gh-pages**, Folder: **/root**
5. Click **Save**
6. Workflow runs automatically on every push!

**Option B: Manual**

```bash
# Build locally
cd artifacts/ad-campaign-dashboard
pnpm install
pnpm build
cd ../../

# Create gh-pages branch
git checkout --orphan gh-pages

# Clear history
git rm -rf .

# Copy build files
cp -r artifacts/ad-campaign-dashboard/dist/* .

# Create .nojekyll file
touch .nojekyll

# Add and push
git add .
git commit -m "Deploy to GitHub Pages"
git push -u origin gh-pages

# Go back to main
git checkout main
```

---

## 🚀 Daily Workflow

### Make Changes & Push

```bash
# 1. Make your code changes
# 2. Check what changed
git status

# 3. Stage changes
git add .

# 4. Commit with clear message
git commit -m "Feat: Add new feature or fix"

# 5. Push to GitHub
git push
```

### Create Branches for Features

```bash
# Create new branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add my feature"
git push -u origin feature/my-feature

# Create Pull Request on GitHub
# Merge when ready, then delete branch
```

---

## 🔍 Verify Deployment

### Check Deployment Status

1. Go to repository → **Actions** tab
2. Look for "Deploy to GitHub Pages" workflow
3. Check status (✓ = success, ✗ = failed)

### View Your Deployed App

- **URL**: https://GnanaVarshita.github.io/Capaign-dashboard/
- Note: Takes 1-2 minutes after push to deploy

### Check Logs

```bash
# View commit history
git log --oneline -10

# View what's committed
git show --stat

# View changes not yet pushed
git status
```

---

## ⚠️ Troubleshooting

### Push Fails with "fatal: 'origin' does not appear to be a 'git' repository"

```bash
# Add remote
git remote add origin https://github.com/GnanaVarshita/Capaign-dashboard.git
git push -u origin main
```

### Authentication Failed

```bash
# Store credentials
git config --global credential.helper store

# Or use token-based:
# When prompted for password, paste your Personal Access Token

# Or configure git to use SSH (advanced)
# https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

### Deployment Not Updating

```bash
# Clear browser cache (Ctrl+Shift+R on Windows/Linux, Cmd+Shift+R on Mac)
# Or try incognito mode

# Check if build command works
cd artifacts/ad-campaign-dashboard
pnpm build

# Check if dist folder exists
ls -la artifacts/ad-campaign-dashboard/dist/
```

### GitHub Pages Not Showing

1. Go to **Settings** → **Pages**
2. Ensure branch is set to **gh-pages** or **main**
3. Ensure folder is **/root** or **/docs**
4. Check that GitHub Pages is enabled
5. Wait 2-3 minutes for deployment

### Dist Folder is Empty

```bash
# Ensure you're building the right app
cd artifacts/ad-campaign-dashboard

# Install dependencies
pnpm install

# Build
pnpm build

# Check output
ls -la dist/

# Should have index.html, assets/, etc.
```

---

## 📝 Useful Git Commands

```bash
# Check status
git status

# View commit history
git log
git log --oneline

# See what changed in last commit
git show

# See diff (uncommitted changes)
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Stash changes temporarily
git stash

# Restore stashed changes
git stash pop

# Create a new branch
git checkout -b feature-name

# Switch branches
git checkout main

# Delete branch
git branch -d branch-name
```

---

## 🔐 Security Notes

1. **Never push secrets** to GitHub
2. Create `.env.local` files for local development only
3. Use GitHub Secrets for sensitive data in Actions
4. Keep access tokens safe and rotate them regularly

---

## 📚 Full Documentation

For more details, see: `GIT_DEPLOYMENT_GUIDE.md`

---

## ✅ Checklist

- [ ] Git configured locally
- [ ] Remote URL set correctly
- [ ] All files staged and committed
- [ ] Pushed main branch to GitHub
- [ ] GitHub Pages enabled in Settings
- [ ] GitHub Actions workflow running
- [ ] App deployed at GitHub Pages URL
- [ ] Can see your app online

---

## 🆘 Need Help?

- **GitHub Docs**: https://docs.github.com/
- **Git Docs**: https://git-scm.com/doc
- **Vite Build Issues**: https://vitejs.dev/guide/

Good luck! 🚀
