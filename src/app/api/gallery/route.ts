import { NextRequest, NextResponse } from "next/server";
import { 
  getGalleryFolders, 
  createGalleryFolder,
  deleteGalleryFolder,
  renameGalleryFolder,
} from "@/lib/storage";
import { isAuthenticated } from "@/lib/auth";
import { 
  getCache, 
  setCache, 
  deleteCache, 
  deleteCacheByPattern,
  shouldSkipCache, 
  CACHE_KEYS 
} from "@/lib/redis";

// 禁用 Next.js 路由缓存，确保每次请求都获取最新数据
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 获取所有文件夹
export async function GET(request: NextRequest) {
  try {
    const skipCache = shouldSkipCache(request);
    
    // 如果不跳过缓存，先尝试从缓存获取
    if (!skipCache) {
      const cachedFolders = await getCache(CACHE_KEYS.GALLERY_FOLDERS);
      if (cachedFolders) {
        return NextResponse.json(cachedFolders);
      }
    }
    
    const folders = await getGalleryFolders();
    const response = { folders };
    
    // 设置缓存（1小时过期）
    if (!skipCache) {
      await setCache(CACHE_KEYS.GALLERY_FOLDERS, response);
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("获取相册列表失败:", error);
    return NextResponse.json(
      { error: "获取相册列表失败" },
      { status: 500 }
    );
  }
}

// 创建新文件夹
export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated(request);
    if (!authenticated) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const { name } = await request.json();
    
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "请输入文件夹名称" }, { status: 400 });
    }

    const folder = await createGalleryFolder(name.trim());
    
    // 清除相册列表缓存
    await deleteCache(CACHE_KEYS.GALLERY_FOLDERS);
    
    return NextResponse.json({ success: true, folder });
  } catch (error) {
    console.error("创建文件夹失败:", error);
    return NextResponse.json({ error: "创建文件夹失败" }, { status: 500 });
  }
}

// 更新文件夹（重命名）
export async function PUT(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated(request);
    if (!authenticated) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const { folderId, name } = await request.json();
    
    if (!folderId || !name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    await renameGalleryFolder(folderId, name.trim());
    
    // 清除相册缓存
    await deleteCache(CACHE_KEYS.GALLERY_FOLDERS);
    await deleteCache(CACHE_KEYS.GALLERY_FOLDER(folderId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("重命名文件夹失败:", error);
    return NextResponse.json({ error: "重命名文件夹失败" }, { status: 500 });
  }
}

// 删除文件夹
export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated(request);
    if (!authenticated) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const { folderId } = await request.json();
    
    if (!folderId) {
      return NextResponse.json({ error: "请指定要删除的文件夹" }, { status: 400 });
    }

    await deleteGalleryFolder(folderId);
    
    // 清除相册缓存
    await deleteCache(CACHE_KEYS.GALLERY_FOLDERS);
    await deleteCacheByPattern("gallery:folder:*");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除文件夹失败:", error);
    return NextResponse.json({ error: "删除文件夹失败" }, { status: 500 });
  }
}
