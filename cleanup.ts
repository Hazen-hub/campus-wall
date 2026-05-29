// 半年清理脚本 — 运行: npx tsx cleanup.ts
// 删除 6 个月前的帖子及其关联数据（图片、评论、点赞等）
import { PrismaClient } from "@prisma/client";
import { unlinkSync, existsSync, readdirSync, rmdirSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();
const MONTHS = 6;
const cutoff = new Date();
cutoff.setMonth(cutoff.getMonth() - MONTHS);

async function cleanup() {
  console.log(`\n🧹 清理 ${MONTHS} 个月前（${cutoff.toLocaleDateString("zh-CN")}）的帖子...\n`);

  // 1. 查找旧帖子
  const oldPosts = await prisma.post.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true, images: true, createdAt: true },
  });

  if (oldPosts.length === 0) {
    console.log("✅ 没有需要清理的帖子");
    await prisma.$disconnect();
    return;
  }

  console.log(`找到 ${oldPosts.length} 条旧帖子`);

  // 2. 收集要删除的图片
  let deletedImages = 0;
  for (const post of oldPosts) {
    try {
      const imgs: string[] = JSON.parse(post.images);
      for (const img of imgs) {
        const filePath = join(process.cwd(), "public", img);
        if (existsSync(filePath)) {
          unlinkSync(filePath);
          deletedImages++;
        }
      }
    } catch {}
  }

  // 3. 批量删除关联数据和帖子
  const ids = oldPosts.map((p) => p.id);
  await prisma.notification.deleteMany({ where: { postId: { in: ids } } });
  await prisma.report.deleteMany({ where: { postId: { in: ids } } });
  await prisma.like.deleteMany({ where: { postId: { in: ids } } });
  await prisma.bookmark.deleteMany({ where: { postId: { in: ids } } });

  // 递归删除评论
  for (const id of ids) {
    await prisma.comment.deleteMany({ where: { postId: id } });
  }

  // 删除帖子
  const deleted = await prisma.post.deleteMany({ where: { id: { in: ids } } });

  // 4. 清理过期验证码
  await prisma.verificationCode.deleteMany({ where: { expiresAt: { lt: new Date() } } });

  // 5. 清理空的图片目录
  const uploadDir = join(process.cwd(), "public", "uploads");
  try {
    for (const entry of readdirSync(uploadDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const subDir = join(uploadDir, entry.name);
      try {
        const files = readdirSync(subDir);
        if (files.length === 0) rmdirSync(subDir);
      } catch {}
    }
  } catch {}

  console.log(`\n✅ 清理完成：`);
  console.log(`   帖子: ${deleted.count} 条`);
  console.log(`   图片: ${deletedImages} 张`);
  console.log(`   过期验证码: 已清理`);

  await prisma.$disconnect();
}

cleanup().catch(console.error).finally(() => prisma.$disconnect());
