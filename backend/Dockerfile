# ─── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies including devDependencies for TypeScript compilation
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source code and build production JavaScript
COPY src ./src
RUN npm run build

# ─── Stage 2: Production Runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled JavaScript and required metadata from builder
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Run as non-root node user for container security
USER node

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

CMD ["node", "dist/server.js"]
