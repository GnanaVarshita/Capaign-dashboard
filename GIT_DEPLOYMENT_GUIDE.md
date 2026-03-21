# Git Setup & GitHub Pages Deployment Guide

## Table of Contents
1. [Initial Git Setup](#initial-git-setup)
2. [Pushing Code to GitHub](#pushing-code-to-github)
3. [GitHub Pages Deployment (Frontend)](#github-pages-deployment-frontend)
4. [Troubleshooting](#troubleshooting)

---

## Initial Git Setup

### Step 1: Configure Git Locally (First Time Only)

```bash
# Set your global Git configuration
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --global --list
```

### Step 2: Initialize Repository (If Not Already Done)

```bash
# Navigate to your project root
cd ~/Gnana-Dev/Campaign-Dashboard

# Check if git is already initialized
git status

# If not initialized, initialize it
git init
```

### Step 3: Add Remote Repository

```bash
# Remove old remote if exists
git remote remove origin 2>/dev/null || true

# Add your GitHub repository (HTTPS)
git remote add origin https://github.com/GnanaVarshita/Capaign-dashboard.git

# Verify remote is added
git remote -v
# Output should show:
# origin  https://github.com/GnanaVarshita/Capaign-dashboard.git (fetch)
# origin  https://github.com/GnanaVarshita/Capaign-dashboard.git (push)
```

---

## Pushing Code to GitHub

### Step 4: Stage Files

```bash
# Stage all changes
git add .

# Or stage specific files
git add src/
git add package.json
git add .gitignore

# Check staged files
git status
```

### Step 5: Create Initial Commit

```bash
# Create your first commit
git commit -m "Initial commit: Ad Campaign Dashboard project setup"

# Or with multiple lines for detailed message
git commit -m "Initial commit: Ad Campaign Dashboard project setup

- Add Territory Tab with new region functionality
- Add Internal Refresh feature
- Add Password visibility for Owner role
- Setup project structure
- Configure TypeScript and Vite
"
```

### Step 6: Push Code to GitHub

```bash
# Push to main branch (create if doesn't exist)
git branch -M main

# Push to GitHub repository
git push -u origin main

# For subsequent pushes, just use:
git push
```

### Step 7: Verify Push

Visit your repository: https://github.com/GnanaVarshita/Capaign-dashboard

---

## GitHub Pages Deployment (Frontend)

### Option 1: Deploy Using GitHub Actions (Recommended)

GitHub Actions allows automatic deployment whenever you push code.

#### Step 1: Create Workflow Directory

```bash
mkdir -p .github/workflows
```

#### Step 2: Create Deployment Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Install pnpm
      run: npm install -g pnpm
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Build frontend
      run: pnpm run build -w ad-campaign-dashboard
      # Or if you have a specific build script:
      # run: cd artifacts/ad-campaign-dashboard && pnpm build
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3.9.3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./artifacts/ad-campaign-dashboard/dist
        cname: # Add custom domain if you have one (optional)
```

#### Step 3: Enable GitHub Pages in Repository Settings

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Select branch: **gh-pages**
5. Select folder: **/root**
6. Click **Save**

#### Step 4: Commit and Push Workflow

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment workflow"
git push
```

### Option 2: Manual Deployment via Git (Alternative)

If you prefer manual control:

#### Step 1: Build Your Frontend

```bash
# Navigate to frontend app
cd artifacts/ad-campaign-dashboard

# Install dependencies
pnpm install

# Build the project
pnpm build

# Navigate back to root
cd ../../
```

#### Step 2: Create and Deploy gh-pages Branch

```bash
# Create gh-pages branch (one time)
git checkout --orphan gh-pages

# Remove all files
git rm -rf .

# Copy built files
cp -r artifacts/ad-campaign-dashboard/dist/* .

# Create .nojekyll file (tells GitHub to serve as-is)
touch .nojekyll

# Add and commit
git add .
git commit -m "Deploy to GitHub Pages"

# Push to gh-pages branch
git push -u origin gh-pages

# Switch back to main
git checkout main
```

#### Step 3: Enable GitHub Pages Settings (same as above)

---

## Complete Workflow Summary

### For Regular Development Updates

```bash
# 1. Make your changes
# 2. Stage changes
git status  # Check what changed
git add .

# 3. Commit with message
git commit -m "Add: [Feature description]"

# 4. Push to GitHub
git push

# GitHub Pages will automatically update (if using Actions)
```

### Commit Message Conventions

Use clear, descriptive commit messages:

```bash
# Features
git commit -m "Feat: Add PO-wise view in Overview Tab"
git commit -m "Feat: Allow Regional Managers to see region-specific data"

# Bug Fixes
git commit -m "Fix: Regional Manager budget visibility issue"

# Documentation
git commit -m "Docs: Add deployment guide"

# Style & Formatting
git commit -m "Style: Format code and improve structure"
```

---

## Verify GitHub Pages Deployment

### Check Deployment Status

1. Go to your GitHub repository
2. Click **Deployments** section
3. You should see a deployment to `github-pages`
4. Click on it to see deployment history

### Access Your Deployed App

- URL: `https://GnanaVarshita.github.io/Capaign-dashboard/`
- Note: It may take 1-2 minutes for the deployment to complete

### Troubleshoot Deployment

```bash
# Check build output
cat .github/workflows/deploy.yml

# Verify build command works locally
pnpm build -w ad-campaign-dashboard

# Check if dist folder has content
ls -la artifacts/ad-campaign-dashboard/dist/
```

---

## Important Environment Setup

### Create `.env.production` (if needed)

For production builds, create `artifacts/ad-campaign-dashboard/.env.production`:

```env
VITE_API_URL=https://your-api-domain.com
VITE_APP_NAME=AdCampaign Dashboard
```

Then in your build script, make sure Vite uses this file.

---

## Advanced: Custom Domain (Optional)

If you have a custom domain:

1. Update workflow file CNAME field
2. Add DNS records pointing to GitHub Pages IP: `185.199.108.153`
3. Enable HTTPS in repository settings

---

## Troubleshooting

### Issue: Authentication Failed

**Solution:** 
```bash
# Use GitHub Personal Access Token
# 1. Generate token at https://github.com/settings/tokens
# 2. Use it as password when prompted
git push

# Or configure credential helper
git config --global credential.helper store
```

### Issue: Deployment Not Working

**Steps:**
1. Check Actions tab in GitHub for errors
2. Verify .gitignore isn't excluding build outputs
3. Ensure build command is correct: `pnpm build -w ad-campaign-dashboard`
4. Check that dist folder is created during build

### Issue: 404 After Deployment

**Solution:**
1. Ensure GitHub Pages is enabled (Settings → Pages)
2. Select `gh-pages` branch and `/root` folder
3. Check that dist folder contains index.html
4. Wait 1-2 minutes for deployment to complete

### Issue: Update Not Reflecting

**Solution:**
```bash
# Clear browser cache
# Or use Ctrl+Shift+R (hard refresh)

# Or check deployment logs
# GitHub Repo → Actions tab → Click latest deployment
```

---

## Next Steps

1. **Set up API endpoint** for your backend
2. **Add secrets** to GitHub Actions for sensitive data:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add any API keys, tokens, etc.

3. **Configure custom domain** (optional)
4. **Set up continuous integration** for tests
5. **Monitor deployments** via Actions tab

---

## Quick Reference Commands

```bash
# Check git status
git status

# View commit history
git log --oneline -10

# Push latest changes
git push

# Pull latest from GitHub
git pull

# Create and switch to new branch
git checkout -b feature/new-feature

# Switch to main branch
git checkout main

# Delete local branch
git branch -d feature/old-feature

# View all branches
git branch -a

# Stash changes (save for later)
git stash

# Apply stashed changes
git stash pop
```

---

## Support

For issues with:
- **GitHub**: https://docs.github.com/
- **Vite**: https://vitejs.dev/
- **pnpm**: https://pnpm.io/
- **GitHub Actions**: https://docs.github.com/en/actions

