#!/bin/bash
set -e

echo "🚀 Setting up Ad Campaign Dashboard Development Environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install pnpm
echo -e "\n${BLUE}📦 Installing pnpm...${NC}"
npm install -g pnpm@latest

# Step 2: Install dependencies
echo -e "\n${BLUE}📚 Installing project dependencies with pnpm...${NC}"
pnpm install

# Step 3: Build type definitions
echo -e "\n${BLUE}🔨 Building TypeScript type definitions...${NC}"
pnpm run typecheck:libs || true

# Step 4: Success message
echo -e "\n${GREEN}✅ Development environment setup complete!${NC}"

echo -e "\n${YELLOW}📝 Next steps:${NC}"
echo "1. Review the QUICK_START.md for quick commands"
echo "2. Frontend: pnpm -F @workspace/ad-campaign-dashboard run dev"
echo "3. Backend: pnpm -F @workspace/api-server run dev"
echo "4. Type-check: pnpm run typecheck"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
