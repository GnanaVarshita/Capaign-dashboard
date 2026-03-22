#!/bin/bash

# Codespace Development Helper Script
# Quick commands to set up and manage the Ad Campaign Dashboard

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Menu function
show_menu() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Ad Campaign Dashboard - Codespace Helper${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "1) 📦 Full Setup (install pnpm + dependencies)"
    echo "2) 🚀 Start Frontend (Vite dev server on port 5173)"
    echo "3) 🛠️  Start Backend (API server on port 3001)"
    echo "4) 🔧 Start Both Frontend & Backend"
    echo "5) 🏗️  Build for Production"
    echo "6) ✅ Run Type Checking"
    echo "7) 🔄 Verify Installation"
    echo "8) 🧹 Clean & Reinstall Dependencies"
    echo "9) 📋 Show Available Scripts"
    echo "10) 📖 Show Git Commands"
    echo "0) ❌ Exit"
    echo ""
}

# Function definitions
full_setup() {
    echo -e "${BLUE}📦 Starting full setup...${NC}"
    echo ""
    
    echo -e "${YELLOW}Step 1: Installing pnpm globally${NC}"
    npm install -g pnpm@latest
    
    echo -e "${YELLOW}Step 2: Installing all dependencies${NC}"
    pnpm install
    
    echo -e "${YELLOW}Step 3: Building type definitions${NC}"
    pnpm run typecheck:libs || true
    
    echo -e "${GREEN}✅ Setup complete!${NC}"
    echo -e "${YELLOW}Next: Choose option 4 to start both servers${NC}"
}

start_frontend() {
    echo -e "${BLUE}🚀 Starting Frontend (Vite dev server)...${NC}"
    echo -e "${YELLOW}Access at: http://localhost:5173${NC}"
    echo ""
    pnpm -F @workspace/ad-campaign-dashboard run dev
}

start_backend() {
    echo -e "${BLUE}🛠️  Starting Backend (API server)...${NC}"
    echo -e "${YELLOW}Access at: http://localhost:3001${NC}"
    echo ""
    pnpm -F @workspace/api-server run dev
}

start_both() {
    echo -e "${BLUE}🔧 Starting both servers...${NC}"
    echo ""
    echo -e "${YELLOW}Please do the following in separate terminals:${NC}"
    echo ""
    echo "Terminal 1 (Backend):"
    echo -e "  ${GREEN}pnpm -F @workspace/api-server run dev${NC}"
    echo ""
    echo "Terminal 2 (Frontend):"
    echo -e "  ${GREEN}pnpm -F @workspace/ad-campaign-dashboard run dev${NC}"
    echo ""
    echo -e "${YELLOW}Or use the Codespace terminal split feature (Ctrl+Shift+\\)${NC}"
    echo ""
}

build_production() {
    echo -e "${BLUE}🏗️  Building for production...${NC}"
    pnpm run build
    echo -e "${GREEN}✅ Build complete!${NC}"
    echo -e "${YELLOW}Preview production build:${NC}"
    echo -e "  ${GREEN}pnpm -F @workspace/ad-campaign-dashboard run serve${NC}"
}

run_typecheck() {
    echo -e "${BLUE}✅ Running TypeScript type checking...${NC}"
    pnpm run typecheck
    echo -e "${GREEN}✅ Type checking complete!${NC}"
}

verify_install() {
    echo -e "${BLUE}🔄 Verifying installation...${NC}"
    echo ""
    
    echo -n "Node version: "
    node --version
    
    echo -n "npm version: "
    npm --version
    
    echo -n "pnpm version: "
    pnpm --version || echo "❌ pnpm not found (run option 1)"
    
    echo ""
    echo "Checking pnpm packages:"
    pnpm ls --depth 0 2>/dev/null | head -20 || echo "❌ Dependencies not installed (run option 1)"
    
    echo ""
    echo -e "${GREEN}✅ Verification complete!${NC}"
}

clean_reinstall() {
    echo -e "${RED}🧹 Cleaning and reinstalling...${NC}"
    echo -e "${YELLOW}This will delete node_modules and pnpm-lock.yaml${NC}"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf node_modules pnpm-lock.yaml
        pnpm install
        echo -e "${GREEN}✅ Clean reinstall complete!${NC}"
    else
        echo "Cancelled"
    fi
}

show_scripts() {
    echo -e "${BLUE}📋 Available pnpm scripts:${NC}"
    echo ""
    pnpm run
}

show_git_commands() {
    echo -e "${BLUE}📖 Common Git Commands:${NC}"
    echo ""
    echo "1️⃣  Initial Setup (first time only):"
    echo -e "  ${GREEN}git config --global user.name \"Your Name\"${NC}"
    echo -e "  ${GREEN}git config --global user.email \"your@email.com\"${NC}"
    echo ""
    echo "2️⃣  Check Status:"
    echo -e "  ${GREEN}git status${NC}"
    echo ""
    echo "3️⃣  Commit Changes:"
    echo -e "  ${GREEN}git add .${NC}"
    echo -e "  ${GREEN}git commit -m \"Your commit message\"${NC}"
    echo ""
    echo "4️⃣  Push to GitHub (triggers automatic deployment):"
    echo -e "  ${GREEN}git push${NC}"
    echo ""
    echo "5️⃣  View Deployment Status:"
    echo "  https://github.com/GnanaVarshita/Capaign-dashboard/actions"
    echo ""
    echo -e "${YELLOW}💡 Tip: Always run 'pnpm run typecheck' before committing!${NC}"
    echo ""
}

# Main loop
while true; do
    show_menu
    read -p "Choose an option (0-10): " choice
    
    case $choice in
        1) full_setup ;;
        2) start_frontend ;;
        3) start_backend ;;
        4) start_both ;;
        5) build_production ;;
        6) run_typecheck ;;
        7) verify_install ;;
        8) clean_reinstall ;;
        9) show_scripts ;;
        10) show_git_commands ;;
        0) 
            echo -e "${GREEN}Goodbye! 👋${NC}"
            exit 0 
            ;;
        *)
            echo -e "${RED}Invalid option. Please try again.${NC}"
            ;;
    esac
    
    read -p $'\n\nPress Enter to continue...'
done
