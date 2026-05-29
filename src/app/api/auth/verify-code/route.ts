import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "邮箱和验证码不能为空" },
        { status: 400 }
      );
    }

    // 查找最新的一条有效验证码
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

    // 标记验证码为已使用
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    return NextResponse.json({
      success: true,
      message: "验证码验证成功",
    });
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json(
      { success: false, error: "验证失败，请稍后重试" },
      { status: 500 }
    );
  }
}
