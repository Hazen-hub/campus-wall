import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - 提交意见（任何人都可以提交，登录用户会关联账号）
export async function POST(req: NextRequest) {
  try {
    const { content, contact } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "请输入意见内容" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { success: false, error: "内容不能超过2000字" },
        { status: 400 }
      );
    }

    // 尝试获取登录用户（非强制）
    const session = await auth();
    const userId = (session?.user as any)?.id || null;

    const feedback = await prisma.feedback.create({
      data: {
        content: content.trim(),
        contact: contact?.trim() || null,
        userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "感谢你的反馈！我们会尽快处理。",
        data: { id: feedback.id },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit feedback error:", error);
    return NextResponse.json(
      { success: false, error: "提交失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// GET - 管理员查看所有意见
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "没有权限" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status") || "all";

    const where: any = {};
    if (status !== "all") {
      where.status = status;
    }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedback.count({ where }),
    ]);

    const pendingCount = await prisma.feedback.count({
      where: { status: "pending" },
    });

    return NextResponse.json({
      success: true,
      data: feedbacks,
      pendingCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get feedback error:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 }
    );
  }
}

// PATCH - 管理员处理意见（标记已解决/添加回复）
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "没有权限" },
        { status: 403 }
      );
    }

    const { id, action, reply } = await req.json();

    if (!id || !["resolve", "pending"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "无效操作" },
        { status: 400 }
      );
    }

    const updateData: any = {
      status: action === "resolve" ? "resolved" : "pending",
    };
    if (reply !== undefined) {
      updateData.reply = reply?.trim() || null;
    }

    await prisma.feedback.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update feedback error:", error);
    return NextResponse.json(
      { success: false, error: "操作失败" },
      { status: 500 }
    );
  }
}
