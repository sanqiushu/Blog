import { NextResponse } from "next/server";
import { deleteSession, getSessionFromCookies, SESSION_COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // 获取当前 session
    const sessionId = await getSessionFromCookies();
    
    if (sessionId) {
      // 删除 session
      deleteSession(sessionId);
    }
    
    // 删除 cookie
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    
    return NextResponse.json({
      success: true,
      message: "已退出登录"
    });
  } catch {
    return NextResponse.json(
      { error: "退出登录失败" },
      { status: 500 }
    );
  }
}
