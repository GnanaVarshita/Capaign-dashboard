#!/bin/bash

# Automated Codespace Setup Script
# Run this EVERY time you open the codespace to ensure everything works

set -e

echo "🚀 Setting up Campaign Dashboard Codespace..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${BLUE}📦 Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"
    sudo apk update && sudo apk add --no-cache nodejs npm
else
    echo -e "${GREEN}✓ Node.js $(node --version)${NC}"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm not found. Installing...${NC}"
    sudo apk add --no-cache npm
else
    echo -e "${GREEN}✓ npm $(npm --version)${NC}"
fi

# Configure npm global path (fixes permission issues)
echo -e "${BLUE}🔧 Configuring npm...${NC}"
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global 2>/dev/null || true

# Add npm to PATH if not already there
if [[ ":$PATH:" != *":$HOME/.npm-global/bin:"* ]]; then
    export PATH=$HOME/.npm-global/bin:$PATH
    if ! grep -q "npm-global/bin" ~/.bashrc; then
        echo 'export PATH=$HOME/.npm-global/bin:$PATH' >> ~/.bashrc
    fi
fi

# Install pnpm
echo -e "${BLUE}📦 Installing pnpm...${NC}"
npm install -g pnpm@latest 2>/dev/null || true
echo -e "${GREEN}✓ pnpm $(pnpm --version)${NC}"

# Install dependencies
echo -e "${BLUE}📚 Installing project dependencies...${NC}"
cd /workspaces/Capaign-dashboard
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e ""
echo -e "${YELLOW}Next, you can:${NC}"
echo "  • Start frontend: pnpm -F @workspace/ad-campaign-dashboard run dev"
echo "  • Start backend:  pnpm -F @workspace/api-server run dev"
echo "  • Run both:       bash codespace-helper.sh (choose option 4)"
echo ""
