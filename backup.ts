// 数据库备份脚本 — 运行: npx tsx backup.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function backup() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const backupDir = path.join(process.cwd(), "backups");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

  if (!fs.existsSync(dbPath)) {
    console.log("❌ 数据库文件不存在:", dbPath);
    process.exit(1);
  }

  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ 备份完成: ${backupPath}`);

  // 只保留最近 7 天的备份
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith("backup-"))
    .sort()
    .reverse();
  for (const file of files.slice(7)) {
    fs.unlinkSync(path.join(backupDir, file));
    console.log(`🗑️  清理旧备份: ${file}`);
  }

  await prisma.$disconnect();
}

backup().catch(console.error).finally(() => prisma.$disconnect());
