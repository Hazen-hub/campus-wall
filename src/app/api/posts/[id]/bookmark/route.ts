import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - 切换收藏（有则取消，无则添加）
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const existing = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { userId_postId: { userId, postId } } });
      return NextResponse.json({ success: true, data: { bookmarked: false } });
    }

    await prisma.bookmark.create({ data: { userId, postId } });
    return NextResponse.json({ success: true, data: { bookmarked: true } });
  } catch (error) {
    console.error("Bookmark error:", error);
    return NextResponse.json({ success: false, error: "操作失败" }, { status: 500 });
  }
}

// GET - 检查收藏状态
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: true, data: { bookmarked: false } });
  }
  const userId = (session.user as any).id;
  const bm = await prisma.bookmark.findUnique({ where: { userId_postId: { userId, postId } } });
  return NextResponse.json({ success: true, data: { bookmarked: !!bm } });
}
