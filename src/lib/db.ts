import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a connection pool with the standard Postgres driver
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/exportbase?schema=public",
});

// Pass the pg pool to the Prisma adapter
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
