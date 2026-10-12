import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const adapter = process.env.DATABASE_URL
  ? new PrismaMariaDb(process.env.DATABASE_URL)
  : undefined;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    adapter
      ? {
          adapter,
        }
      : undefined
  );
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
