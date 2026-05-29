import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { getCache, setCache, invalidateCache } from "@/lib/cache";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cacheKey = `posts:${searchParams.toString()}`;
    const cached = getCache(cacheKey);
    if (cached) return NextResponse.json(cached);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30")));
    const sort = searchParams.get("sort") || "latest";
    const category = searchParams.get("category") || "";

    const session = await auth();
    const userId = (session?.user as any)?.id;

    const where: any = { isHidden: false, isDeleted: false };

    if (category && category !== "all") {
      where.category = category;
    }

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
        orderBy: sort === "popular"
          ? { likes: { _count: "desc" } }
          : { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    // If user is logged in, check which posts they've liked
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

    const result = {
      success: true,
      data: postsWithLiked,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
    setCache(cacheKey, result, 15); // 缓存 15 秒
    return NextResponse.json(result);
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { success: false, error: "获取帖子失败" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 速率限制：每 IP 每分钟 10 篇帖子
    const { rateLimit, getClientIp } = await import("@/lib/rate-limit");
    const ip = getClientIp(req);
    const limit = rateLimit(`post:${ip}`, 10, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ success: false, error: "发帖过于频繁，请稍后再试" }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const { content, images, category, isAnonymous, type, pollOptions } = await req.json();
    const userId = (session.user as any).id;

    // 检查用户是否被封禁
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { banned: true, role: true } });
    if (user?.banned) {
      return NextResponse.json({ success: false, error: "账号已被封禁" }, { status: 403 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "请输入帖子内容" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { success: false, error: "帖子内容不能超过5000字" },
        { status: 400 }
      );
    }

    // 敏感词过滤
    // XSS 清洗
    let filteredContent = sanitizeHtml(content.trim());

    // 敏感词过滤
    const sensitiveWords = await prisma.sensitiveWord.findMany({ select: { word: true } });
    for (const { word } of sensitiveWords) {
      if (filteredContent.toLowerCase().includes(word.toLowerCase())) {
        filteredContent = filteredContent.replace(new RegExp(word, "gi"), "***");
      }
    }

    const validCategories = ["general", "love", "lostfound", "trade", "joke", "ask"];

    const validTypes = ["general", "announcement", "poll"];
    const postType = validTypes.includes(type) ? type : "general";
    // 只有管理员能发公告
    const finalType = (postType === "announcement" && user?.role !== "admin") ? "general" : postType;

    const post = await prisma.post.create({
      data: {
        content: filteredContent,
        images: JSON.stringify(images || []),
        category: validCategories.includes(category) ? category : "general",
        type: finalType,
        isAnonymous: !!isAnonymous,
        pollOptions: pollOptions ? JSON.stringify(pollOptions) : null,
        pollVotes: pollOptions ? "{}": null,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, username: true, avatar: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...post,
          images: JSON.parse(post.images),
          isLiked: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { success: false, error: "发布失败，请稍后重试" },
      { status: 500 }
    );
  }
}
