import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// 管理员密码（必须通过环境变量设置）
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

// 调试：输出当前配置的密码（开发环境）
if (process.env.NODE_ENV !== "production") {
  console.log("🔐 Admin Password 配置:", ADMIN_PASSWORD);
}

// Session 密钥
const SESSION_COOKIE_NAME = "admin_session";

// 简单的 session 存储（生产环境中应该使用 Redis 或数据库）
const sessions = new Map<string, { createdAt: number }>();

// 生成随机 session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// 验证密码
export function verifyPassword(password: string): boolean {
  const isValid = password === ADMIN_PASSWORD;
  // 调试日志
  if (process.env.NODE_ENV !== "production") {
    console.log("🔍 密码验证:", {
      输入密码: password,
      配置密码: ADMIN_PASSWORD,
      验证结果: isValid
    });
  }
  return isValid;
}

// 创建 session
export function createSession(): string {
  const sessionId = generateSessionId();
  sessions.set(sessionId, { createdAt: Date.now() });
  return sessionId;
}

// 验证 session
export function verifySession(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }
  
  // Session 24小时后过期
  const isExpired = Date.now() - session.createdAt > 24 * 60 * 60 * 1000;
  if (isExpired) {
    sessions.delete(sessionId);
    return false;
  }
  
  return true;
}

// 删除 session
export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

// 从请求中获取 session
export async function getSessionFromRequest(request: NextRequest): Promise<string | null> {
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return sessionId || null;
}

// 从 cookies 中获取 session（用于 Server Components）
export async function getSessionFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return sessionId || null;
}

// 验证用户是否已登录
export async function isAuthenticated(request?: NextRequest): Promise<boolean> {
  let sessionId: string | null;
  
  if (request) {
    sessionId = await getSessionFromRequest(request);
  } else {
    sessionId = await getSessionFromCookies();
  }
  
  if (!sessionId) {
    return false;
  }
  
  return verifySession(sessionId);
}

// 清理过期的 sessions（定期调用）
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24小时
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.createdAt > maxAge) {
      sessions.delete(sessionId);
    }
  }
}

// 定期清理过期 sessions（每小时一次）
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
