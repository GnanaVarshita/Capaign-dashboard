#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Git & GitHub Pages Setup Script${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print colored output
print_step() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Step 1: Check if git is installed
echo -e "${BLUE}[1/8] Checking Git installation...${NC}"
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi
print_step "Git is installed"

# Step 2: Configure Git
echo -e "\n${BLUE}[2/8] Configuring Git...${NC}"
read -p "Enter your name for Git commits: " git_name
read -p "Enter your email for Git commits: " git_email

git config --global user.name "$git_name"
git config --global user.email "$git_email"
print_step "Git configured"

# Step 3: Initialize/Configure Repository
echo -e "\n${BLUE}[3/8] Setting up repository...${NC}"
if [ ! -d ".git" ]; then
    git init
    print_step "Repository initialized"
else
    print_step "Repository already initialized"
fi

# Step 4: Add Remote
echo -e "\n${BLUE}[4/8] Adding GitHub remote...${NC}"
read -p "Enter your GitHub username: " github_username
repo_url="https://github.com/${github_username}/Capaign-dashboard.git"

git remote remove origin 2>/dev/null || true
git remote add origin "$repo_url"
git remote -v
print_step "Remote repository added"

# Step 5: Update .gitignore
echo -e "\n${BLUE}[5/8] Verifying .gitignore...${NC}"
if [ -f ".gitignore" ]; then
    print_step ".gitignore already exists"
else
    print_error ".gitignore file not found. Please create it manually."
fi

# Step 6: Stage files
echo -e "\n${BLUE}[6/8] Staging files...${NC}"
git add .
git_status=$(git status --porcelain | wc -l)
print_step "Staged $git_status files"

# Step 7: Create initial commit
echo -e "\n${BLUE}[7/8] Creating initial commit...${NC}"
read -p "Enter commit message (default: 'Initial commit'): " commit_msg
commit_msg=${commit_msg:-"Initial commit"}

git commit -m "$commit_msg" || print_info "No changes to commit or already committed"

# Step 8: Push to GitHub
echo -e "\n${BLUE}[8/8] Pushing to GitHub...${NC}"
print_info "You may be prompted to enter your GitHub credentials or token."
print_info "Use your GitHub Personal Access Token as password if prompted."

git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    print_step "Successfully pushed to GitHub!"
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}Setup Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "\nRepository: ${YELLOW}https://github.com/${github_username}/Capaign-dashboard${NC}"
    echo -e "View deployment guide: ${YELLOW}cat GIT_DEPLOYMENT_GUIDE.md${NC}"
else
    print_error "Push failed. Please check your credentials and try again."
    echo -e "Run: ${YELLOW}git push -u origin main${NC}"
fi

print_info "\nNext steps:"
echo -e "1. Go to: https://github.com/${github_username}/Capaign-dashboard"
echo -e "2. Click 'Settings' → 'Pages'"
echo -e "3. Enable GitHub Pages with 'gh-pages' branch"
echo -e "4. Copy the GitHub Actions workflow: cp templates/deploy.yml .github/workflows/"
echo -e "5. Commit and push: git add .github && git commit -m 'Add GitHub Actions' && git push"
