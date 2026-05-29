import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ success: false, error: "请选择图片" }, { status: 400 });
    }

    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      return NextResponse.json({ success: false, error: "不支持的格式" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "头像不能超过5MB" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });
    const filename = `avatar-${uuidv4()}.${file.name.split(".").pop() || "jpg"}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/avatars/${filename}`;
    await prisma.user.update({ where: { id: userId }, data: { avatar: url } });

    return NextResponse.json({ success: true, data: { url } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "上传失败" }, { status: 500 });
  }
}
