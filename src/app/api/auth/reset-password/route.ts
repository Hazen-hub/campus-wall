import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// POST - 发送重置密码验证码
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`reset:${ip}`, 3, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ success: false, error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, error: "请输入邮箱" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // 不暴露用户是否存在，统一返回成功
      return NextResponse.json({ success: true, message: "如果该邮箱已注册，验证码将发送到邮箱" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.verificationCode.create({
      data: { email, code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    });

    await sendVerificationEmail(email, code);

    return NextResponse.json({ success: true, message: "如果该邮箱已注册，验证码将发送到邮箱" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "发送失败" }, { status: 500 });
  }
}

// PUT - 验证码重置密码
export async function PUT(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();
    if (!email || !code || !newPassword) {
      return NextResponse.json({ success: false, error: "请填写所有字段" }, { status: 400 });
    }

    // 密码强度
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: "密码至少8个字符" }, { status: 400 });
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ success: false, error: "密码需包含字母和数字" }, { status: 400 });
    }

    // 验证码
    const vc = await prisma.verificationCode.findFirst({
      where: { email, code, used: false, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!vc) return NextResponse.json({ success: false, error: "验证码错误或已过期" }, { status: 400 });

    await prisma.verificationCode.update({ where: { id: vc.id }, data: { used: true } });
    await prisma.user.update({
      where: { email },
      data: { password: await bcrypt.hash(newPassword, 12), loginAttempts: 0, lockedUntil: null },
    });

    return NextResponse.json({ success: true, message: "密码已重置，请重新登录" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "重置失败" }, { status: 500 });
  }
}
