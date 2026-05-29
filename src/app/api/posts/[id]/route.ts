import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = (session?.user as any)?.id;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, avatar: true, bio: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "帖子不存在" },
        { status: 404 }
      );
    }

    // 浏览计数（异步，不阻塞响应）
    prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    let isLiked = false;
    if (userId) {
      const like = await prisma.like.findUnique({
        where: { userId_postId: { userId, postId: id } },
      });
      isLiked = !!like;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        images: JSON.parse(post.images),
        isLiked,
      },
    });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json(
      { success: false, error: "获取帖子失败" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ success: false, error: "帖子不存在" }, { status: 404 });
    if (post.authorId !== userId) {
      return NextResponse.json({ success: false, error: "没有权限" }, { status: 403 });
    }

    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ success: false, error: "内容不能为空" }, { status: 400 });

    await prisma.post.update({
      where: { id },
      data: { content: content.trim(), editedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "编辑失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "帖子不存在" },
        { status: 404 }
      );
    }

    // 只有作者可以删除自己的帖子，管理员不在这里删
    if (post.authorId !== userId) {
      return NextResponse.json(
        { success: false, error: "没有权限删除此帖子" },
        { status: 403 }
      );
    }

    // 软删除
    await prisma.post.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { success: false, error: "删除失败" },
      { status: 500 }
    );
  }
}
