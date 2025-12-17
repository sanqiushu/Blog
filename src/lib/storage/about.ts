import { ensureContainer, streamToBuffer } from "@/lib/storage/blob-core";
import { ABOUT_BLOB_NAME } from "@/lib/storage/constants";
import { getCache, setCache, deleteCache, CACHE_KEYS } from "@/lib/redis";

export interface AboutContent {
  content: string;
  updatedAt: string;
}

const DEFAULT_ABOUT_CONTENT: AboutContent = {
  content: `## 欢迎来到我的博客

这是一个分享技术见解、学习笔记和生活感悟的地方。我热衷于探索新技术，并通过写作的方式记录和分享我的学习历程。

## 关注领域

- 前端开发（React、Next.js、TypeScript）
- Web 性能优化
- 用户体验设计
- 开源项目

## 联系方式

如果你想与我交流或合作，欢迎通过以下方式联系我：

- GitHub: github.com/your-username
- Email: your.email@example.com
- Twitter: @your-handle`,
  updatedAt: new Date().toISOString(),
};

// 内存缓存
let aboutMemoryCache: { data: AboutContent; timestamp: number } | null = null;
const MEMORY_CACHE_TTL = 60 * 1000; // 60秒内存缓存

export async function readAboutContent(): Promise<AboutContent> {
  // 首先检查内存缓存
  if (
    aboutMemoryCache &&
    Date.now() - aboutMemoryCache.timestamp < MEMORY_CACHE_TTL
  ) {
    return aboutMemoryCache.data;
  }

  // 尝试从 Redis 缓存获取
  const cachedAbout = await getCache<AboutContent>(CACHE_KEYS.ABOUT_CONTENT);
  if (cachedAbout) {
    aboutMemoryCache = { data: cachedAbout, timestamp: Date.now() };
    return cachedAbout;
  }

  try {
    const containerClient = await ensureContainer();
    const blobClient = containerClient.getBlobClient(ABOUT_BLOB_NAME);
    const blockBlobClient = blobClient.getBlockBlobClient();

    const exists = await blobClient.exists();
    if (!exists) {
      await blockBlobClient.upload(
        JSON.stringify(DEFAULT_ABOUT_CONTENT, null, 2),
        Buffer.byteLength(JSON.stringify(DEFAULT_ABOUT_CONTENT, null, 2))
      );
      return DEFAULT_ABOUT_CONTENT;
    }

    const downloadResponse = await blockBlobClient.download(0);
    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);
    const aboutContent = JSON.parse(downloaded.toString("utf-8"));

    // 设置缓存
    await setCache(CACHE_KEYS.ABOUT_CONTENT, aboutContent, 600); // 10分钟缓存
    aboutMemoryCache = { data: aboutContent, timestamp: Date.now() };

    return aboutContent;
  } catch (error) {
    console.error("读取关于页面内容失败:", error);
    return DEFAULT_ABOUT_CONTENT;
  }
}

// 清除关于页面缓存
export async function invalidateAboutCache(): Promise<void> {
  aboutMemoryCache = null;
  await deleteCache(CACHE_KEYS.ABOUT_CONTENT);
}

export async function updateAboutContent(content: string): Promise<AboutContent> {
  try {
    const containerClient = await ensureContainer();
    const blockBlobClient = containerClient.getBlockBlobClient(ABOUT_BLOB_NAME);

    const aboutContent: AboutContent = {
      content,
      updatedAt: new Date().toISOString(),
    };

    const data = JSON.stringify(aboutContent, null, 2);
    await blockBlobClient.uploadData(Buffer.from(data, "utf-8"), {
      blobHTTPHeaders: { blobContentType: "application/json" },
    });

    // 清除缓存
    await invalidateAboutCache();

    return aboutContent;
  } catch (error) {
    console.error("更新关于页面内容失败:", error);
    throw error;
  }
}
