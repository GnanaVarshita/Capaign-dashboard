# 🎓 Git & Deployment Guide

## Git Setup
```bash
git remote set-url origin git@github.com:GnanaVarshita/Campaign-dashboard.git
```

## Deployment Flow
1. **Push to main**: Triggers GitHub Actions.
2. **Build**: Vite builds the app with the correct `base` path (automatically set to `/${{ github.event.repository.name }}/`).
3. **Deploy**: Files are pushed to the `gh-pages` branch.
4. **Serve**: GitHub Pages serves the site.

## Renaming a Repository
If you rename your repository on GitHub:
1. Update your local remote URL.
2. Update any hardcoded links in documentation.
3. The GitHub Action will automatically detect the new name for the `base` path in the next build.
4. You may need to toggle the GitHub Pages settings in the repo to refresh the custom domain/link.
