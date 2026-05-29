import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

  // 启用 SQLite WAL 模式 + 高并发优化
  // WAL 模式允许多个读操作与一个写操作同时进行，大幅提升并发能力
  const pragmas = [
    "PRAGMA journal_mode=WAL",          // 写入前日志，允许并发读写
    "PRAGMA busy_timeout=5000",         // 遇到锁时等待5秒而不是立即失败
    "PRAGMA synchronous=NORMAL",        // 平衡安全性和写入速度
    "PRAGMA cache_size=-20000",         // 20MB 缓存（负数表示 KB）
    "PRAGMA foreign_keys=ON",           // 外键约束
    "PRAGMA temp_store=MEMORY",         // 临时表存储在内存中
    "PRAGMA mmap_size=268435456",       // 256MB 内存映射，加速读取
    "PRAGMA wal_autocheckpoint=1000",   // WAL 自动检查点间隔
  ];

  // 在连接建立后立即执行优化 PRAGMA（使用 queryRawUnsafe 因为部分 PRAGMA 返回结果）
  client.$connect().then(() => {
    Promise.all(pragmas.map((sql) => client.$queryRawUnsafe(sql).catch(() => {}))).catch(() => {});
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
