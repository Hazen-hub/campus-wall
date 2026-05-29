import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { username, bio, grade, className } = await req.json();

    const updateData: any = {};
    if (username !== undefined) {
      if (username.length < 2 || username.length > 20) {
        return NextResponse.json({ success: false, error: "用户名2-20字符" }, { status: 400 });
      }
      // 检查唯一性
      const exist = await prisma.user.findUnique({ where: { username } });
      if (exist && exist.id !== userId) {
        return NextResponse.json({ success: false, error: "用户名已被占用" }, { status: 409 });
      }
      updateData.username = username;
    }
    if (bio !== undefined) updateData.bio = bio;
    if (grade !== undefined) updateData.grade = grade || null;
    if (className !== undefined) updateData.className = className || null;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, email: true, bio: true, grade: true, className: true, avatar: true, role: true },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: "更新失败" }, { status: 500 });
  }
}
