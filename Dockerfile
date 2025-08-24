FROM node:18-alpine AS deps
# Используем российские зеркала для Alpine Linux
RUN echo "https://mirror.yandex.ru/mirrors/alpine/v3.18/main" > /etc/apk/repositories && \
    echo "https://mirror.yandex.ru/mirrors/alpine/v3.18/community" >> /etc/apk/repositories && \
    apk update && apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
# Используем российские npm зеркала
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set cache /tmp/.npm && \
    npm ci --only=production --prefer-offline

FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
# Устанавливаем ВСЕ зависимости для сборки (включая dev)
RUN npm config set registry https://registry.npmjs.org/ && \
    npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]