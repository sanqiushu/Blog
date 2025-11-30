import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import crypto from "crypto";

// 管理员密码（必须通过环境变量设置）
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

// 用于签名的密钥（使用密码的哈希作为签名密钥）
const SECRET_KEY = crypto.createHash('sha256').update(ADMIN_PASSWORD || 'default-secret').digest('hex');

// Session Cookie 名称
const SESSION_COOKIE_NAME = "admin_session";

// Session 有效期（24小时）
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;

// 调试：输出当前配置的密码（开发环境）
if (process.env.NODE_ENV !== "production") {
  console.log("🔐 Admin Password 已配置:", !!ADMIN_PASSWORD);
}

// 验证密码
export function verifyPassword(password: string): boolean {
  const isValid = password === ADMIN_PASSWORD;
  if (process.env.NODE_ENV !== "production") {
    console.log("🔍 密码验证结果:", isValid);
  }
  return isValid;
}

// 生成签名
function generateSignature(data: string): string {
  return crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
}

// 创建 session token（包含创建时间和签名）
export function createSession(): string {
  const createdAt = Date.now();
  const data = `${createdAt}`;
  const signature = generateSignature(data);
  // token 格式：时间戳.签名
  return `${createdAt}.${signature}`;
}

// 验证 session token
export function verifySession(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    
    const [createdAtStr, signature] = parts;
    const createdAt = parseInt(createdAtStr, 10);
    
    if (isNaN(createdAt)) return false;
    
    // 验证签名
    const expectedSignature = generateSignature(createdAtStr);
    if (signature !== expectedSignature) {
      return false;
    }
    
    // 验证是否过期
    const isExpired = Date.now() - createdAt > SESSION_MAX_AGE;
    if (isExpired) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// 删除 session（签名方式不需要服务端存储，返回空函数保持接口兼容）
export function deleteSession(_sessionId: string): void {
  // 签名 token 方式不需要服务端删除，cookie 会在客户端清除
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

// 导出 cookie 名称供其他模块使用
export { SESSION_COOKIE_NAME };
