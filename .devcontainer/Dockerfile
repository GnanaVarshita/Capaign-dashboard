# Development Environment Dockerfile
# For running the Ad Campaign Dashboard in a containerized environment

FROM node:22-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@latest

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build type definitions
RUN pnpm run typecheck:libs || true

# Expose ports
EXPOSE 5173 3001 3000

# Default command - show available scripts
CMD ["pnpm", "run"]
