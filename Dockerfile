# ------------------------------------------------------------------
# CampusConnect - Next.js application image (Debian base for reliable
# Prisma engine compatibility)
# ------------------------------------------------------------------

# ---------- Build stage ----------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# openssl is required by Prisma to detect the correct engine binary target
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies (uses package-lock.json for reproducible builds)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .

# Dummy values are only needed for the build step; real values are
# injected at runtime via environment variables (never baked in).
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy" \
    NEXTAUTH_URL="http://localhost:3000" \
    NEXTAUTH_SECRET="build-time-dummy-secret"

RUN npx prisma generate && npm run build

# ---------- Runtime stage ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# openssl  -> required by Prisma engines
# ca-certificates -> TLS for outbound requests
# default-mysql-client -> provides mysql / mysqladmin for the entrypoint
# tini -> proper PID 1 / signal handling
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates default-mysql-client tini \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/scripts ./scripts
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER node
EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "--", "/app/docker-entrypoint.sh"]
CMD ["node_modules/.bin/next", "start"]
