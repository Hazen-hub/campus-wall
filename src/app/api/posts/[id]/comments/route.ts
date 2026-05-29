import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, username: true, avatar: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { success: false, error: "获取评论失败" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const { id: postId } = await params;
    const { content, parentId } = await req.json();
    const userId = (session.user as any).id;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "请输入评论内容" },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: "评论不能超过1000字" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "帖子不存在" },
        { status: 404 }
      );
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json(
          { success: false, error: "父评论不存在" },
          { status: 400 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: sanitizeHtml(content.trim()),
        authorId: userId,
        postId,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    // 创建通知
    const commenter = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    const commenterName = commenter?.username || "有人";

    if (parentId) {
      // 回复评论：通知父评论作者
      const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { authorId: true } });
      if (parent && parent.authorId !== userId) {
        await prisma.notification.create({
          data: {
            userId: parent.authorId,
            type: "reply",
            message: `${commenterName} 回复了你的评论`,
            postId,
          },
        });
      }
    } else {
      // 回复帖子：通知帖子作者
      if (post.authorId !== userId) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: "comment",
            message: `${commenterName} 评论了你的帖子`,
            postId,
          },
        });
      }
    }

    return NextResponse.json(
      { success: true, data: comment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { success: false, error: "评论失败" },
      { status: 500 }
    );
  }
}

// DELETE - 删除评论（作者或管理员）
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    const { commentId } = await req.json();

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return NextResponse.json({ success: false, error: "评论不存在" }, { status: 404 });
    if (comment.authorId !== userId && role !== "admin") {
      return NextResponse.json({ success: false, error: "没有权限" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 });
  }
}
