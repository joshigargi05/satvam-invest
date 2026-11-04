# ============================================================================
# VestraAI (satvam-invest) — GCP Cloud Run Production Multi-Stage Dockerfile
# Stage 1: Build Vite + React Frontend Bundle
# Stage 2: Production Node.js 20 API + Static SPA + Cloud SQL PostgreSQL Client
# ============================================================================

# --- Stage 1: Frontend Builder ---
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: Production Runtime for Google Cloud Run ---
FROM node:20-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV SERVE_STATIC=true

# Copy package manifests and install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy backend source, PostgreSQL schema, ML predictions cache, and built frontend
COPY server.js ./
COPY server ./server
COPY db ./db
COPY ml ./ml
COPY --from=builder /app/dist ./dist

# Ensure writable data directory for fallback local persistence inside container
RUN mkdir -p /app/data

EXPOSE 8080

CMD ["node", "server.js"]
