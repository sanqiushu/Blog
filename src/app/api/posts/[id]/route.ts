import { NextResponse } from "next/server";
import { getPostById, updatePost, deletePost } from "@/lib/storage";
import { isAuthenticated } from "@/lib/auth";
import { sanitizeSlug } from "@/lib/slug-generator";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - 获取单个博客文章（公开访问）
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const post = await getPostById(id);
    
    if (!post) {
      return NextResponse.json(
        { error: "博客文章不存在" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json(
      { error: "获取博客失败" },
      { status: 500 }
    );
  }
}

// PUT - 更新博客文章（需要认证）
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    // 验证身份
    const authenticated = await isAuthenticated(request as any);
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
    
    return NextResponse.json(updatedPost);
  } catch (error) {
    return NextResponse.json(
      { error: "更新博客失败", details: error },
      { status: 500 }
    );
  }
}

// DELETE - 删除博客文章（需要认证）
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // 验证身份
    const authenticated = await isAuthenticated(request as any);
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
