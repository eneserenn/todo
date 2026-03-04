# ── Stage 1: Install dependencies ─────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Standalone output
COPY --from=builder --chown=1001:0 /app/.next/standalone ./
COPY --from=builder --chown=1001:0 /app/.next/static ./.next/static
COPY --from=builder --chown=1001:0 /app/public ./public

# Prisma schema + generated client (runtime) + CLI (initContainer migration)
COPY --from=builder --chown=1001:0 /app/prisma ./prisma
COPY --from=builder --chown=1001:0 /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=1001:0 /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=1001:0 /app/node_modules/prisma ./node_modules/prisma

# OpenShift: grant group 0 (root group) same permissions as owner
# so arbitrary UID assigned by OpenShift can read/write files
RUN chown -R 1001:0 /app && chmod -R g=u /app

EXPOSE 3000

# Run as non-root user (OpenShift will override UID with a random one,
# but file permissions via group 0 ensure access)
USER 1001

CMD ["node", "server.js"]
