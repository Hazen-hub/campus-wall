import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 生成 6 位随机验证码
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    // 速率限制：每 IP 每分钟 5 次
    const ip = getClientIp(req);
    const limit = rateLimit(`send-code:${ip}`, 5, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ success: false, error: "请求过于频繁，请稍后再试" }, { status: 429 });
    }

    const { email } = await req.json();

    // 1. 验证邮箱格式
    if (!email) {
      return NextResponse.json(
        { success: false, error: "请输入邮箱地址" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    // 2. 检查邮箱是否已被注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // 3. 生成验证码并存储（有效期 5 分钟，无冷却限制）
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.verificationCode.create({
      data: { email, code, expiresAt },
    });

    // 5. 清理过期验证码
    await prisma.verificationCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    // 6. 发送真实邮件
    const emailResult = await sendVerificationEmail(email, code);

    if (!emailResult) {
      return NextResponse.json(
        { success: false, error: "邮件服务未配置，请联系管理员设置 SMTP" },
        { status: 500 }
      );
    }

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.error || "邮件发送失败，请检查邮箱地址" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "验证码已发送到你的邮箱，请注意查收",
    });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { success: false, error: "发送验证码失败，请稍后重试" },
      { status: 500 }
    );
  }
}
