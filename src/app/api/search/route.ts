import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30")));

    if (!q.trim()) {
      return NextResponse.json(
        { success: false, error: "请输入搜索关键词" },
        { status: 400 }
      );
    }

    const session = await auth();
    const userId = (session?.user as any)?.id;

    const where = {
      isHidden: false,
      isDeleted: false,
      content: { contains: q.trim() },
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: { id: true, username: true, avatar: true },
          },
          _count: {
            select: { comments: true, likes: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    let likedPostIds = new Set<string>();
    if (userId && posts.length > 0) {
      const likes = await prisma.like.findMany({
        where: {
          userId,
          postId: { in: posts.map((p: any) => p.id) },
        },
        select: { postId: true },
      });
      likedPostIds = new Set(likes.map((l: any) => l.postId));
    }

    const postsWithLiked = posts.map((post: any) => ({
      ...post,
      images: JSON.parse(post.images),
      isLiked: likedPostIds.has(post.id),
    }));

    return NextResponse.json({
      success: true,
      data: postsWithLiked,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { success: false, error: "搜索失败" },
      { status: 500 }
    );
  }
}
