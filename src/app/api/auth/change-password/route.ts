import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });

    const userId = (session.user as any).id;
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "请填写所有字段" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: "密码至少8个字符" }, { status: 400 });
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ success: false, error: "密码需包含字母和数字" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ success: false, error: "用户不存在" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ success: false, error: "当前密码错误" }, { status: 400 });

    await prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(newPassword, 12), mustChangePassword: false },
    });

    return NextResponse.json({ success: true, message: "密码已修改" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "修改失败" }, { status: 500 });
  }
}
