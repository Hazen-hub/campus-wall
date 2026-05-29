import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readdirSync, statSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ success: false, error: "没有权限" }, { status: 403 });
    }

    // 存储用量
    let storageMB = 0;
    try {
      const uploadsDir = join(process.cwd(), "public", "uploads");
      const walkSync = (dir: string) => {
        try {
          for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const full = join(dir, entry.name);
            if (entry.isDirectory()) walkSync(full);
            else storageMB += statSync(full).size / 1024 / 1024;
          }
        } catch {}
      };
      walkSync(uploadsDir);
    } catch {}

    const [
      totalUsers, totalPosts, totalComments, totalLikes,
      todayPosts, pendingReports, pendingFeedback,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count({ where: { isHidden: false } }),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.post.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.report.count({ where: { status: "pending" } }),
      prisma.feedback.count({ where: { status: "pending" } }),
    ]);

    // 分类统计
    const categoryStats = await Promise.all(
      ["general", "love", "lostfound", "trade", "joke", "ask"].map(async (cat) => {
        const count = await prisma.post.count({ where: { category: cat, isHidden: false } });
        return { category: cat, count };
      })
    );

    // 近7天发帖趋势
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const start = new Date(day.setHours(0, 0, 0, 0));
      const end = new Date(day.setHours(23, 59, 59, 999));
      const count = await prisma.post.count({ where: { createdAt: { gte: start, lte: end } } });
      dailyStats.push({ date: start.toLocaleDateString("zh-CN", { month: "short", day: "numeric" }), count });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers, totalPosts, totalComments, totalLikes,
        todayPosts, pendingReports, pendingFeedback,
        storageMB: Math.round(storageMB * 100) / 100,
        categoryStats, dailyStats,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}
