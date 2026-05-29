import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Middleware-like check
async function checkAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: "请先登录", status: 401 };
  }
  if ((session.user as any).role !== "admin") {
    return { error: "没有管理权限", status: 403 };
  }
  return { session };
}

// GET - Get all posts (including hidden) for moderation
export async function GET(req: NextRequest) {
  const auth = await checkAdmin();
  if ("error" in auth) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const filter = searchParams.get("filter") || "all"; // all, hidden, reported

    const where: any = {};
    if (filter === "hidden") {
      where.isHidden = true;
      where.isDeleted = false;
    } else if (filter === "deleted") {
      where.isDeleted = true;
    } else {
      where.isDeleted = false;
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
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: posts.map((p: any) => ({ ...p, images: JSON.parse(p.images) })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin get posts error:", error);
    return NextResponse.json(
      { success: false, error: "获取帖子列表失败" },
      { status: 500 }
    );
  }
}

// PATCH - Hide/unhide a post
export async function PATCH(req: NextRequest) {
  const auth = await checkAdmin();
  if ("error" in auth) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { postId, action } = await req.json();

    if (!postId || !["hide", "unhide", "pin", "unpin", "restore"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "无效的操作" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (action === "hide") updateData.isHidden = true;
    if (action === "unhide") updateData.isHidden = false;
    if (action === "pin") updateData.isPinned = true;
    if (action === "unpin") updateData.isPinned = false;
    if (action === "restore") updateData.isDeleted = false;

    await prisma.post.update({
      where: { id: postId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin update post error:", error);
    return NextResponse.json(
      { success: false, error: "操作失败" },
      { status: 500 }
    );
  }
}

// DELETE - Force delete any post
export async function DELETE(req: NextRequest) {
  const auth = await checkAdmin();
  if ("error" in auth) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { postId } = await req.json();

    await prisma.post.delete({ where: { id: postId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete post error:", error);
    return NextResponse.json(
      { success: false, error: "删除失败" },
      { status: 500 }
    );
  }
}
