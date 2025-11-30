import { NextRequest, NextResponse } from "next/server";
import { 
  getGalleryFolder, 
  uploadImageToFolder,
  deleteImageFromFolder,
  setFolderCover,
} from "@/lib/storage";
import { isAuthenticated } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ folderId: string }>;
}

// 获取文件夹详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { folderId } = await params;
    const folder = await getGalleryFolder(folderId);
    
    if (!folder) {
      return NextResponse.json({ error: "文件夹不存在" }, { status: 404 });
    }
    
    return NextResponse.json({ folder });
  } catch (error) {
    console.error("获取文件夹详情失败:", error);
    return NextResponse.json(
      { error: "获取文件夹详情失败" },
      { status: 500 }
    );
  }
}

// 上传图片到文件夹
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authenticated = await isAuthenticated(request);
    if (!authenticated) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const { folderId } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请选择要上传的图片" }, { status: 400 });
    }

    // 验证文件类型
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "只支持 JPG、PNG、GIF、WebP 格式的图片" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const image = await uploadImageToFolder(folderId, buffer, file.name, file.type);
    return NextResponse.json({ success: true, image });
  } catch (error) {
    console.error("上传图片失败:", error);
    return NextResponse.json({ error: "上传图片失败" }, { status: 500 });
  }
}

// 更新文件夹（设置封面）
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authenticated = await isAuthenticated(request);
    if (!authenticated) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const { folderId } = await params;
    const { action, imageId } = await request.json();
    
    if (action === "setCover" && imageId) {
      await setFolderCover(folderId, imageId);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: "无效的操作" }, { status: 400 });
  } catch (error) {
    console.error("更新文件夹失败:", error);
    return NextResponse.json({ error: "更新文件夹失败" }, { status: 500 });
  }
}

// 删除文件夹中的图片
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authenticated = await isAuthenticated(request);
    if (!authenticated) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const { folderId } = await params;
    const { imageId } = await request.json();
    
    if (!imageId) {
      return NextResponse.json({ error: "请指定要删除的图片" }, { status: 400 });
    }

    await deleteImageFromFolder(folderId, imageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除图片失败:", error);
    return NextResponse.json({ error: "删除图片失败" }, { status: 500 });
  }
}
