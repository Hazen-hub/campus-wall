import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "请先登录" }, { status: 401 });
    const userId = (session.user as any).id;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ success: false, error: "请选择图片" }, { status: 400 });

    const uploadDir = path.join(process.cwd(), "public", "uploads", "banners");
    await mkdir(uploadDir, { recursive: true });
    const filename = `banner-${uuidv4()}.webp`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const compressed = await sharp(buffer).resize(1200, 400, { fit: "cover" }).webp({ quality: 80 }).toBuffer();
    await writeFile(path.join(uploadDir, filename), Buffer.from(compressed));

    const url = `/uploads/banners/${filename}`;
    await prisma.user.update({ where: { id: userId }, data: { banner: url } });

    return NextResponse.json({ success: true, data: { url } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "上传失败" }, { status: 500 });
  }
}
