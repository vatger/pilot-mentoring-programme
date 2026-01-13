import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prisma v7 requires an adapter; use the official MariaDB adapter backed by DATABASE_URL
const adapter = new PrismaMariaDb(process.env.DATABASE_URL ?? "");

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
