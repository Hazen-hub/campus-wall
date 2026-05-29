import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const checkAdmin = async () => {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return false;
  return true;
};

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const words = await prisma.sensitiveWord.findMany();
  return NextResponse.json({ success: true, data: words });
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const { word } = await req.json();
  if (!word?.trim()) return NextResponse.json({ success: false, error: "请输入词汇" }, { status: 400 });
  const exists = await prisma.sensitiveWord.findUnique({ where: { word: word.trim() } });
  if (exists) return NextResponse.json({ success: false, error: "该词已存在" }, { status: 409 });
  await prisma.sensitiveWord.create({ data: { word: word.trim() } });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const { id } = await req.json();
  await prisma.sensitiveWord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
