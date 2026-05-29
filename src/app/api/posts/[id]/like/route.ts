import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const userId = (session.user as any).id;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "帖子不存在" },
        { status: 404 }
      );
    }

    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
      const count = await prisma.like.count({ where: { postId } });
      return NextResponse.json({
        success: true,
        data: { liked: false, likesCount: count },
      });
    } else {
      await prisma.like.create({
        data: { userId, postId },
      });

      // 创建通知（不通知自己）
      if (post.authorId !== userId) {
        const liker = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: "like",
            message: `${liker?.username || "有人"} 赞了你的帖子`,
            postId,
          },
        });
      }

      const count = await prisma.like.count({ where: { postId } });
      return NextResponse.json({
        success: true,
        data: { liked: true, likesCount: count },
      });
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    return NextResponse.json(
      { success: false, error: "操作失败" },
      { status: 500 }
    );
  }
}
