import { NextRequest, NextResponse } from "next/server";
import { readAboutContent, updateAboutContent } from "@/lib/storage";
import { isAuthenticated } from "@/lib/auth";
import { 
  getCache, 
  setCache, 
  deleteCache, 
  shouldSkipCache, 
  CACHE_KEYS 
} from "@/lib/redis";

// 获取关于页面内容
export async function GET(request: NextRequest) {
  try {
    const skipCache = shouldSkipCache(request);
    
    // 如果不跳过缓存，先尝试从缓存获取
    if (!skipCache) {
      const cachedContent = await getCache(CACHE_KEYS.ABOUT_CONTENT);
      if (cachedContent) {
        return NextResponse.json(cachedContent);
      }
    }
    
    const content = await readAboutContent();
    
    // 设置缓存（1小时过期）
    if (!skipCache) {
      await setCache(CACHE_KEYS.ABOUT_CONTENT, content);
    }
    
    return NextResponse.json(content);
  } catch (error) {
    console.error("获取关于页面内容失败:", error);
    return NextResponse.json(
      { error: "获取关于页面内容失败" },
      { status: 500 }
    );
  }
}

// 更新关于页面内容
export async function PUT(request: NextRequest) {
  try {
    // 验证身份
    const authenticated = await isAuthenticated(request);
    if (!authenticated) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "内容不能为空" },
        { status: 400 }
      );
    }

    const result = await updateAboutContent(content);
    
    // 清除缓存
    await deleteCache(CACHE_KEYS.ABOUT_CONTENT);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("更新关于页面内容失败:", error);
    return NextResponse.json(
      { error: "更新关于页面内容失败" },
      { status: 500 }
    );
  }
}
