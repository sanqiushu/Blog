import { NextRequest, NextResponse } from "next/server";
import { readAboutContent, updateAboutContent } from "@/lib/storage";
import { isAuthenticated } from "@/lib/auth";

// 获取关于页面内容
export async function GET() {
  try {
    const content = await readAboutContent();
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
    return NextResponse.json(result);
  } catch (error) {
    console.error("更新关于页面内容失败:", error);
    return NextResponse.json(
      { error: "更新关于页面内容失败" },
      { status: 500 }
    );
  }
}
