import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - 管理员查看所有举报
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ success: false, error: "没有权限" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 30;

    const where: any = {};
    if (status !== "all") where.status = status;

    const [reports, total, pendingCount] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          post: {
            select: { id: true, content: true, isHidden: true, category: true },
          },
          user: {
            select: { id: true, username: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
      prisma.report.count({ where: { status: "pending" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: reports,
      pendingCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "获取失败" }, { status: 500 });
  }
}

// PATCH - 处理举报（驳回或确认并隐藏帖子）
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ success: false, error: "没有权限" }, { status: 403 });
    }

    const { reportId, action } = await req.json();
    if (!reportId || !["dismiss", "hide"].includes(action)) {
      return NextResponse.json({ success: false, error: "无效操作" }, { status: 400 });
    }

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      return NextResponse.json({ success: false, error: "举报不存在" }, { status: 404 });
    }

    if (action === "dismiss") {
      // 驳回举报
      await prisma.report.update({ where: { id: reportId }, data: { status: "dismissed" } });
    } else if (action === "hide") {
      // 确认举报，隐藏帖子
      await prisma.report.update({ where: { id: reportId }, data: { status: "resolved" } });
      await prisma.post.update({ where: { id: report.postId }, data: { isHidden: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "操作失败" }, { status: 500 });
  }
}
