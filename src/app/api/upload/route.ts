import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5; // 每帖最多5张图

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "请选择要上传的图片" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `最多上传${MAX_FILES}张图片` },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const urls: string[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `不支持的图片格式: ${file.type}，仅支持 JPG、PNG、GIF、WebP` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: "图片大小不能超过10MB" },
          { status: 400 }
        );
      }

      const filename = `${uuidv4()}.webp`;
      const filepath = path.join(uploadDir, filename);

      const bytes = await file.arrayBuffer();
      let buffer = Buffer.from(bytes);

      // 所有图片压缩为 WebP（体积减少 60-80%）
      try {
        let sharpInstance = sharp(buffer).resize(1280, 1280, { fit: "inside", withoutEnlargement: true });
        // GIF 动图保留动画
        if (file.type === "image/gif") {
          sharpInstance = sharp(buffer, { animated: true }).resize(800, 800, { fit: "inside", withoutEnlargement: true });
        }
        const compressed = await sharpInstance.webp({ quality: 75 }).toBuffer();
        buffer = Buffer.from(compressed);
      } catch (e) {
        // 压缩失败用原图
      }

      await writeFile(filepath, buffer);

      urls.push(`/uploads/${filename}`);
    }

    return NextResponse.json({
      success: true,
      data: { urls },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: "上传失败，请稍后重试" },
      { status: 500 }
    );
  }
}
