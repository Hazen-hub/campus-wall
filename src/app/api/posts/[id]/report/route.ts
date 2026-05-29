import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - 举报帖子
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { reason } = await req.json();

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ success: false, error: "请选择举报原因" }, { status: 400 });
    }

    const session = await auth();
    const userId = (session?.user as any)?.id || null;

    // 检查帖子存在
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ success: false, error: "帖子不存在" }, { status: 404 });
    }

    // 创建举报
    await prisma.report.create({
      data: { postId, userId, reason: reason.trim() },
    });

    // 更新举报计数
    await prisma.post.update({
      where: { id: postId },
      data: { reportCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, message: "举报已提交" }, { status: 201 });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ success: false, error: "举报失败" }, { status: 500 });
  }
}
