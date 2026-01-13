# ---- BUILDER ----
FROM node:20-bookworm AS builder

WORKDIR /app

# 1. Package.json + Lockfile kopieren
COPY package.json package-lock.json ./

# 2. Node Modules installieren (inkl. @prisma/client)
RUN npm install

# 3. Prisma Schema kopieren
COPY prisma ./prisma

# 4. Prisma Client generieren (Dummy DATABASE_URL)
ENV DATABASE_URL="mysql://user:pass@localhost:3306/dummy"
RUN npx prisma generate

# 5. Restlichen Code kopieren
COPY . .

# 6. Next.js Build
RUN npm run build

# ---- RUNNER ----
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# 1. Next.js Standalone Build kopieren
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 2. Prisma Schema kopieren (wird für Prisma Client benötigt)
COPY --from=builder /app/prisma ./prisma

# 3. Öffentliche Assets kopieren
COPY --from=builder /app/public ./public

ENV PORT=8000
ENV HOSTNAME=0.0.0.0

EXPOSE 8000
CMD ["node", "server.js"]
