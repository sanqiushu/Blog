import { NextRequest, NextResponse } from "next/server";
import { getPostById, updatePost, deletePost } from "@/lib/storage";
import { isAuthenticated } from "@/lib/auth";
import { sanitizeSlug } from "@/lib/slug-generator";
import { 
  getCache, 
  setCache, 
  deleteCache, 
  deleteCacheByPattern,
  shouldSkipCache, 
  CACHE_KEYS 
} from "@/lib/redis";

// 禁用缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - 获取单个博客文章（公开访问）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const skipCache = shouldSkipCache(request);
    
    // 如果不跳过缓存，先尝试从缓存获取
    if (!skipCache) {
      const cachedPost = await getCache(CACHE_KEYS.POST_BY_ID(id));
      if (cachedPost) {
        return NextResponse.json(cachedPost);
      }
    }
    
    const post = await getPostById(id);
    
    if (!post) {
      return NextResponse.json(
        { error: "博客文章不存在" },
        { status: 404 }
      );
    }
    
    // 设置缓存（1小时过期）
    if (!skipCache) {
      await setCache(CACHE_KEYS.POST_BY_ID(id), post);
    }
    
    return NextResponse.json(post);
  } catch {
    return NextResponse.json(
      { error: "获取博客失败" },
      { status: 500 }
    );
  }
}

// PUT - 更新博客文章（需要认证）
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // 验证身份
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await request.json();
    
    // 清理 slug（确保不包含中文）
    if (data.slug) {
      data.slug = sanitizeSlug(data.slug, data.title, id);
    }
    
    const updatedPost = await updatePost(id, data);
    
    if (!updatedPost) {
      return NextResponse.json(
        { error: "博客文章不存在" },
        { status: 404 }
      );
    }
    
    // 清除相关缓存
    await deleteCache(CACHE_KEYS.POSTS_LIST);
    await deleteCache(CACHE_KEYS.POST_BY_ID(id));
    await deleteCacheByPattern("posts:slug:*");
    
    return NextResponse.json(updatedPost);
  } catch (error) {
    return NextResponse.json(
      { error: "更新博客失败", details: error },
      { status: 500 }
    );
  }
}

// DELETE - 删除博客文章（需要认证）
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    // 验证身份
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const deletedPost = await deletePost(id);
    
    if (!deletedPost) {
      return NextResponse.json(
        { error: "博客文章不存在" },
        { status: 404 }
      );
    }
    
    // 清除相关缓存
    await deleteCache(CACHE_KEYS.POSTS_LIST);
    await deleteCache(CACHE_KEYS.POST_BY_ID(id));
    await deleteCacheByPattern("posts:slug:*");
    
    return NextResponse.json({
      message: "博客文章已删除",
      post: deletedPost
    });
  } catch (error) {
    return NextResponse.json(
      { error: "删除博客失败", details: error },
      { status: 500 }
    );
  }
}
