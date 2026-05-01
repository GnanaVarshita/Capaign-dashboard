# ⚡ Quick Start Guide

## 1. Local Development
```bash
# Install dependencies
pnpm install

# Start frontend (port 20289)
pnpm --filter @workspace/ad-campaign-dashboard dev
```

## 2. Push Changes to GitHub
```bash
git add .
git commit -m "Describe your changes"
git push origin main
```

## 3. Deployment
The app is automatically deployed to GitHub Pages on every push to `main`.
- **Repo**: https://github.com/GnanaVarshita/Campaign-dashboard
- **Live Site**: https://GnanaVarshita.github.io/Campaign-dashboard/

## 4. Troubleshooting 404 on GitHub Pages
1. Ensure the repo name in `git remote -v` matches `Campaign-dashboard`.
2. Check GitHub Actions for build errors.
3. In Repo Settings > Pages, verify "Source" is set to `gh-pages` branch.
4. If you recently renamed the repo, wait 5 minutes and re-save the Pages settings.
