# syntax=docker/dockerfile:1

# ============================================================
# Base
# ============================================================
FROM oven/bun:1.3.14 AS base

WORKDIR /app

# ============================================================
# Dependencies
# ============================================================
FROM base AS dependencies

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

# ============================================================
# Build
# ============================================================
FROM base AS builder

COPY --from=dependencies /app/node_modules ./node_modules

COPY package.json bun.lock ./

COPY . .

RUN bun run build

# ============================================================
# Production
# ============================================================
FROM oven/bun:1.3.14 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js standalone output
COPY --from=builder --chown=bun:bun /app/public ./public
COPY --from=builder --chown=bun:bun /app/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static

# Run as non-root Bun user
USER bun

EXPOSE 3000

# Container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD bun -e "fetch('http://127.0.0.1:3000/api/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["bun", "server.js"]