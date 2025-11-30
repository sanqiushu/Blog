import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/storage";
import { isAuthenticated } from "@/lib/auth";

// 允许的图片类型
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    // 验证身份
    const authenticated = await isAuthenticated(request);
    if (!authenticated) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "请选择要上传的图片" },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "只支持 JPG、PNG、GIF、WebP 格式的图片" },
        { status: 400 }
      );
    }

    // 转换为 Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 上传到 Azure Blob Storage
    const imageUrl = await uploadImage(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      url: imageUrl,
      message: "图片上传成功",
    });
  } catch (error) {
    console.error("图片上传失败:", error);
    return NextResponse.json(
      { error: "图片上传失败，请重试" },
      { status: 500 }
    );
  }
}
