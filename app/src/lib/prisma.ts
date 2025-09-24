import { PrismaClient } from "@/generated/prisma";

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export { prisma };
