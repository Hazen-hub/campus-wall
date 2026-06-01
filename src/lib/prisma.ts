import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

  // SQLite only
  if (!process.env.DATABASE_URL?.startsWith("file:")) return client;

  const pragmas = [
    "PRAGMA journal_mode=WAL",
    "PRAGMA busy_timeout=5000",
    "PRAGMA synchronous=NORMAL",
    "PRAGMA cache_size=-20000",
    "PRAGMA foreign_keys=ON",
    "PRAGMA temp_store=MEMORY",
  ];

  client.$connect().then(() => {
    Promise.all(pragmas.map((sql) => client.$queryRawUnsafe(sql).catch(() => {}))).catch(() => {});
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
