import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { BlogPost } from "@/types/blog";

// Azure Storage 配置
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "blog-data";
const IMAGES_CONTAINER_NAME = "blog-images";
const BLOB_NAME = "posts.json";

if (!AZURE_STORAGE_CONNECTION_STRING) {
  console.warn("⚠️ AZURE_STORAGE_CONNECTION_STRING 未设置");
}

// ============================================
// Azure Blob Storage 核心读写操作
// ============================================

// 获取 Blob 容器客户端
function getContainerClient(): ContainerClient {
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING 环境变量未设置");
  }
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
  return blobServiceClient.getContainerClient(CONTAINER_NAME);
}

// 确保容器存在
async function ensureContainer(): Promise<ContainerClient> {
  const containerClient = getContainerClient();
  await containerClient.createIfNotExists();
  return containerClient;
}

// 辅助函数：将流转换为 Buffer
async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data: Buffer) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}

// 读取所有博客文章
export async function readPosts(): Promise<BlogPost[]> {
  try {
    const containerClient = await ensureContainer();
    const blobClient = containerClient.getBlobClient(BLOB_NAME);
    const blockBlobClient = blobClient.getBlockBlobClient();

    const exists = await blobClient.exists();
    if (!exists) {
      const initialData: BlogPost[] = [];
      await blockBlobClient.upload(
        JSON.stringify(initialData, null, 2),
        Buffer.byteLength(JSON.stringify(initialData, null, 2))
      );
      return initialData;
    }

    const downloadResponse = await blockBlobClient.download(0);
    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);
    return JSON.parse(downloaded.toString("utf-8"));
  } catch (error) {
    console.error("读取博客数据失败:", error);
    return [];
  }
}

// 写入所有博客文章
export async function writePosts(posts: BlogPost[]): Promise<void> {
  try {
    const containerClient = await ensureContainer();
    const blockBlobClient = containerClient.getBlockBlobClient(BLOB_NAME);
    const data = JSON.stringify(posts, null, 2);

    await blockBlobClient.uploadData(Buffer.from(data, "utf-8"), {
      blobHTTPHeaders: { blobContentType: "application/json" },
    });
  } catch (error) {
    console.error("写入博客数据失败:", error);
    throw error;
  }
}

// ============================================
// 通用 CRUD 操作（基于 readPosts/writePosts）
// ============================================

// 生成唯一 ID
function generateId(posts: BlogPost[]): string {
  const maxId = posts.length > 0
    ? Math.max(...posts.map(p => parseInt(p.id) || 0))
    : 0;
  return (maxId + 1).toString();
}

// 获取单个博客文章
export async function getPostById(id: string): Promise<BlogPost | null> {
  const posts = await readPosts();
  return posts.find(p => p.id === id) || null;
}

// 获取单个博客文章（通过 slug）
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await readPosts();
  return posts.find(p => p.slug === slug) || null;
}

// 创建新博客文章
export async function createPost(postData: Omit<BlogPost, "id">): Promise<BlogPost> {
  const posts = await readPosts();
  const newPost: BlogPost = {
    id: generateId(posts),
    ...postData,
  };
  posts.push(newPost);
  await writePosts(posts);
  return newPost;
}

// 更新博客文章
export async function updatePost(
  id: string,
  postData: Partial<BlogPost>
): Promise<BlogPost | null> {
  const posts = await readPosts();
  const index = posts.findIndex(p => p.id === id);

  if (index === -1) return null;

  posts[index] = {
    ...posts[index],
    ...postData,
    id, // 确保 ID 不被修改
  };

  await writePosts(posts);
  return posts[index];
}

// 删除博客文章
export async function deletePost(id: string): Promise<BlogPost | null> {
  const posts = await readPosts();
  const index = posts.findIndex(p => p.id === id);

  if (index === -1) return null;

  const deletedPost = posts.splice(index, 1)[0];
  await writePosts(posts);
  return deletedPost;
}

// ============================================
// 图片存储操作
// ============================================

// 获取图片容器客户端
async function getImagesContainer(): Promise<ContainerClient> {
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING 环境变量未设置");
  }
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(IMAGES_CONTAINER_NAME);
  
  // 确保容器存在并设置为公开访问（允许匿名读取图片）
  await containerClient.createIfNotExists({
    access: "blob", // 允许公开访问 blob
  });
  
  return containerClient;
}

// 生成唯一的图片文件名
function generateImageName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${timestamp}-${random}.${ext}`;
}

// 上传图片
export async function uploadImage(
  file: Buffer,
  originalName: string,
  contentType: string
): Promise<string> {
  try {
    const containerClient = await getImagesContainer();
    const imageName = generateImageName(originalName);
    const blockBlobClient = containerClient.getBlockBlobClient(imageName);

    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: "public, max-age=31536000", // 缓存一年
      },
    });

    // 返回图片的公开 URL
    return blockBlobClient.url;
  } catch (error) {
    console.error("上传图片失败:", error);
    throw error;
  }
}

// 删除图片
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    const containerClient = await getImagesContainer();
    // 从 URL 中提取文件名
    const imageName = imageUrl.split('/').pop();
    if (!imageName) return;

    const blockBlobClient = containerClient.getBlockBlobClient(imageName);
    await blockBlobClient.deleteIfExists();
  } catch (error) {
    console.error("删除图片失败:", error);
    // 删除失败不抛出错误，避免影响其他操作
  }
}

// 获取所有图片列表
export async function listImages(): Promise<string[]> {
  try {
    const containerClient = await getImagesContainer();
    const images: string[] = [];

    for await (const blob of containerClient.listBlobsFlat()) {
      const blobClient = containerClient.getBlobClient(blob.name);
      images.push(blobClient.url);
    }

    return images;
  } catch (error) {
    console.error("获取图片列表失败:", error);
    return [];
  }
}
