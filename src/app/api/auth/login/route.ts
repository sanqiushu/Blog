import { NextResponse } from "next/server";
import { verifyPassword, createSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { error: "请输入密码" },
        { status: 400 }
      );
    }
    
    // 验证密码
    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: "密码错误" },
        { status: 401 }
      );
    }
    
    // 创建 session
    const sessionId = createSession();
    
    // 设置 cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24小时
      path: "/",
    });
    
    return NextResponse.json({
      success: true,
      message: "登录成功"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "登录失败", details: error },
      { status: 500 }
    );
  }
}
