# syntax=docker/dockerfile:1.7

# ── Build Stage ───────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

ARG VERSION=dev
ARG BUILD_DATE
ARG GIT_COMMIT

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.1.4 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY packages/optimizer/package.json packages/optimizer/
COPY packages/drift/package.json packages/drift/
COPY packages/api/package.json packages/api/
COPY packages/cli/package.json packages/cli/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY packages/core/ packages/core/
COPY packages/optimizer/ packages/optimizer/
COPY packages/drift/ packages/drift/
COPY packages/api/ packages/api/
COPY packages/cli/ packages/cli/

RUN pnpm build

# ── Production Stage ──────────────────────────────────────────────────────────
FROM node:18-alpine AS production

ARG VERSION=dev
ARG BUILD_DATE
ARG GIT_COMMIT

LABEL org.opencontainers.image.title="HELIOS Cloud API"
LABEL org.opencontainers.image.description="Enterprise Cloud Infrastructure Orchestration Platform"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"
LABEL org.opencontainers.image.source="https://github.com/vignesh2027/helios-cloud"
LABEL org.opencontainers.image.licenses="Apache-2.0"
LABEL org.opencontainers.image.authors="Vigneshwar L <applemacbook6sep2004@gmail.com>"

RUN addgroup -g 1001 -S helios && \
    adduser -u 1001 -S helios -G helios && \
    apk add --no-cache tini curl

WORKDIR /app

COPY --from=builder --chown=helios:helios /app/node_modules ./node_modules
COPY --from=builder --chown=helios:helios /app/packages/core/dist ./packages/core/dist
COPY --from=builder --chown=helios:helios /app/packages/optimizer/dist ./packages/optimizer/dist
COPY --from=builder --chown=helios:helios /app/packages/drift/dist ./packages/drift/dist
COPY --from=builder --chown=helios:helios /app/packages/api/dist ./packages/api/dist

COPY --chown=helios:helios package.json ./
COPY --chown=helios:helios packages/api/package.json ./packages/api/

USER helios

ENV NODE_ENV=production \
    PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "packages/api/dist/server.js"]
