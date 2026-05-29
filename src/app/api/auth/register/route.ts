import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 速率限制：每 IP 每分钟 3 次注册
  const limit = rateLimit(`register:${getClientIp(req)}`, 3, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ success: false, error: "注册过于频繁，请稍后再试" }, { status: 429 });
  }
  try {
    const { username, email, password, code } = await req.json();

    // 1. 基础字段验证
    if (!username || !email || !password || !code) {
      return NextResponse.json(
        { success: false, error: "请填写所有必填字段" },
        { status: 400 }
      );
    }

    if (username.length < 2 || username.length > 20) {
      return NextResponse.json(
        { success: false, error: "用户名长度应在2-20个字符之间" },
        { status: 400 }
      );
    }

    // 保留用户名检查
    const reservedNames = ["禺山陈浩南", "双休哥", "禺山管理员", "管理员", "admin", "禺山"];
    const normalized = username.replace(/[·\s]/g, "");
    for (const reserved of reservedNames) {
      if (normalized.includes(reserved) || reserved.includes(normalized) ||
          username.includes(reserved) || reserved.includes(username)) {
        return NextResponse.json(
          { success: false, error: "该用户名已被保留，请换一个" },
          { status: 400 }
        );
      }
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "密码至少需要8个字符" },
        { status: 400 }
      );
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: "密码必须包含字母和数字" },
        { status: 400 }
      );
    }

    // 2. 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    // 3. 验证码校验
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verificationCode) {
      return NextResponse.json(
        { success: false, error: "验证码错误或已过期" },
        { status: 400 }
      );
    }

    // 4. 检查邮箱和用户名是否已注册
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? "邮箱" : "用户名";
      return NextResponse.json(
        { success: false, error: `该${field}已被注册` },
        { status: 409 }
      );
    }

    // 5. 标记验证码为已使用
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    // 6. 创建用户
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    // 7. 清理过期验证码
    await prisma.verificationCode.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { email },
        ],
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
