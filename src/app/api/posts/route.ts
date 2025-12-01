import { NextRequest, NextResponse } from "next/server";
import { readPosts, createPost } from "@/lib/storage";
import { isAuthenticated } from "@/lib/auth";
import { sanitizeSlug } from "@/lib/slug-generator";
import { 
  getCache, 
  setCache, 
  deleteCache, 
  shouldSkipCache, 
  CACHE_KEYS 
} from "@/lib/redis";

// 禁用缓存，确保每次请求都读取最新数据
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - 获取所有博客文章（公开访问）
export async function GET(request: NextRequest) {
  try {
    const skipCache = shouldSkipCache(request);
    
    // 如果不跳过缓存，先尝试从缓存获取
    if (!skipCache) {
      const cachedPosts = await getCache(CACHE_KEYS.POSTS_LIST);
      if (cachedPosts) {
        return NextResponse.json(cachedPosts);
      }
    }
    
    const posts = await readPosts();
    
    // 设置缓存（1小时过期）
    if (!skipCache) {
      await setCache(CACHE_KEYS.POSTS_LIST, posts);
    }
    
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json(
      { error: "获取博客列表失败" },
      { status: 500 }
    );
  }
}

// POST - 创建新博客文章（需要认证）
export async function POST(request: NextRequest) {
  try {
    // 验证身份
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // 生成或清理 slug
    const slug = sanitizeSlug(
      data.slug || '',
      data.title,
      data.id // 如果有 ID 则使用 ID，否则会用时间戳
    );
    
    const newPost = await createPost({
      title: data.title,
      slug: slug,
      excerpt: data.excerpt,
      content: data.content,
      date: data.date || new Date().toISOString().split('T')[0],
      author: data.author || "博主",
      tags: data.tags || [],
      coverImage: data.coverImage,
      readTime: data.readTime,
    });
    
    // 清除文章列表缓存
    await deleteCache(CACHE_KEYS.POSTS_LIST);
    
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "创建博客失败", details: error },
      { status: 500 }
    );
  }
}
