import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  return (session?.user as any)?.role === "admin";
}

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true, banned: true, grade: true, className: true, createdAt: true, _count: { select: { posts: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, data: users });
}

export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ success: false, error: "无权限" }, { status: 403 });
  const { userId, action } = await req.json();
  if (!userId || !["ban", "unban"].includes(action)) return NextResponse.json({ success: false, error: "无效操作" }, { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: { banned: action === "ban" } });
  return NextResponse.json({ success: true });
}
