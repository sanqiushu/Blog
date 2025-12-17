import Redis from "ioredis";

// Redis 客户端单例
let redis: Redis | null = null;
let isConnecting = false;

// 缓存过期时间：1小时（秒）
const CACHE_TTL = 60 * 60;

// 缓存键前缀
const CACHE_PREFIX = "blog:";

// 是否为开发环境
const isDev = process.env.NODE_ENV !== "production";

/**
 * 获取 Redis 客户端实例
 */
async function getRedisClient(): Promise<Redis | null> {
  if (!process.env.REDIS_URL) {
    if (isDev) {
      console.warn("REDIS_URL 环境变量未设置，缓存功能已禁用");
    }
    return null;
  }

  if (redis && redis.status === "ready") {
    return redis;
  }

  if (isConnecting) {
    // 等待连接完成
    await new Promise(resolve => setTimeout(resolve, 100));
    return redis;
  }

  if (!redis) {
    try {
      isConnecting = true;
      
      // 解析 URL 判断是否需要 TLS
      const redisUrl = process.env.REDIS_URL;
      const useTLS = redisUrl.startsWith("rediss://");
      
      redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.error("Redis 重试次数超限，停止重试");
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        // Azure Redis 需要 TLS
        tls: useTLS ? { rejectUnauthorized: false } : undefined,
        // 连接超时
        connectTimeout: 10000,
      });

      redis.on("error", (err) => {
        console.error("Redis 连接错误:", err.message);
      });

      redis.on("connect", () => {
        if (isDev) {
          console.log("Redis 连接成功");
        }
      });

      redis.on("close", () => {
        if (isDev) {
          console.log("Redis 连接已关闭");
        }
      });

      isConnecting = false;
    } catch (error) {
      console.error("Redis 初始化失败:", error);
      isConnecting = false;
      return null;
    }
  }

  return redis;
}

/**
 * 检查是否应该跳过缓存
 * @param request - 请求对象或 URL 字符串
 */
export function shouldSkipCache(request: Request | string): boolean {
  try {
    const url = typeof request === "string" ? request : request.url;
    const urlObj = new URL(url);
    return urlObj.searchParams.get("flight") === "skipCache";
  } catch {
    return false;
  }
}

/**
 * 生成缓存键
 * @param key - 键名
 */
function getCacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

/**
 * 从缓存获取数据
 * @param key - 缓存键
 * @returns 缓存的数据或 null
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    const cacheKey = getCacheKey(key);
    const data = await client.get(cacheKey);
    
    if (data) {
      if (isDev) {
        console.log(`缓存命中: ${cacheKey}`);
      }
      return JSON.parse(data) as T;
    }
    
    if (isDev) {
      console.log(`缓存未命中: ${cacheKey}`);
    }
    return null;
  } catch (error) {
    console.error("读取缓存失败:", error);
    return null;
  }
}

/**
 * 设置缓存数据
 * @param key - 缓存键
 * @param data - 要缓存的数据
 * @param ttl - 过期时间（秒），默认 1 小时
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTL
): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return false;

  try {
    const cacheKey = getCacheKey(key);
    await client.setex(cacheKey, ttl, JSON.stringify(data));
    if (isDev) {
      console.log(`缓存已设置: ${cacheKey}, TTL: ${ttl}秒`);
    }
    return true;
  } catch (error) {
    console.error("设置缓存失败:", error);
    return false;
  }
}

/**
 * 删除指定缓存
 * @param key - 缓存键
 */
export async function deleteCache(key: string): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return false;

  try {
    const cacheKey = getCacheKey(key);
    await client.del(cacheKey);
    if (isDev) {
      console.log(`缓存已删除: ${cacheKey}`);
    }
    return true;
  } catch (error) {
    console.error("删除缓存失败:", error);
    return false;
  }
}

/**
 * 删除匹配模式的所有缓存
 * @param pattern - 键模式（不含前缀）
 */
export async function deleteCacheByPattern(pattern: string): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return false;

  try {
    const fullPattern = getCacheKey(pattern);
    const keys = await client.keys(fullPattern);
    
    if (keys.length > 0) {
      await client.del(...keys);
      if (isDev) {
        console.log(`已删除 ${keys.length} 个缓存键，模式: ${fullPattern}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error("批量删除缓存失败:", error);
    return false;
  }
}

/**
 * 清除所有博客相关缓存
 */
export async function clearAllCache(): Promise<boolean> {
  return deleteCacheByPattern("*");
}

// 缓存键常量
export const CACHE_KEYS = {
  POSTS_LIST: "posts:list",
  POST_BY_ID: (id: string) => `posts:${id}`,
  POST_BY_SLUG: (slug: string) => `posts:slug:${slug}`,
  ABOUT_CONTENT: "about:content",
  GALLERY_FOLDERS: "gallery:folders",
  GALLERY_FOLDER: (folderId: string) => `gallery:folder:${folderId}`,
} as const;
