import { BlobServiceClient, ContainerClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from "@azure/storage-blob";
import { BlogPost } from "@/types/blog";
import sharp from "sharp";

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

// 从连接字符串解析账户名和密钥
function parseConnectionString(): { accountName: string; accountKey: string } | null {
  if (!AZURE_STORAGE_CONNECTION_STRING) return null;
  
  const accountNameMatch = AZURE_STORAGE_CONNECTION_STRING.match(/AccountName=([^;]+)/);
  const accountKeyMatch = AZURE_STORAGE_CONNECTION_STRING.match(/AccountKey=([^;]+)/);
  
  if (accountNameMatch && accountKeyMatch) {
    return {
      accountName: accountNameMatch[1],
      accountKey: accountKeyMatch[1],
    };
  }
  return null;
}

// 获取图片容器客户端
async function getImagesContainer(): Promise<ContainerClient> {
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING 环境变量未设置");
  }
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(IMAGES_CONTAINER_NAME);
  
  // 确保容器存在（私有访问，不需要公开）
  await containerClient.createIfNotExists();
  
  return containerClient;
}

// 生成带 SAS Token 的图片 URL（有效期 10 年）
function generateSasUrl(blobClient: ReturnType<ContainerClient["getBlockBlobClient"]>): string {
  const credentials = parseConnectionString();
  if (!credentials) {
    // 如果无法解析凭据，返回普通 URL
    return blobClient.url;
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(
    credentials.accountName,
    credentials.accountKey
  );

  // 设置 SAS Token 有效期为 10 年
  const expiresOn = new Date();
  expiresOn.setFullYear(expiresOn.getFullYear() + 10);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: IMAGES_CONTAINER_NAME,
      blobName: blobClient.name,
      permissions: BlobSASPermissions.parse("r"), // 只读权限
      expiresOn: expiresOn,
    },
    sharedKeyCredential
  ).toString();

  return `${blobClient.url}?${sasToken}`;
}

// 生成唯一的图片文件名
function generateImageName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${timestamp}-${random}.${ext}`;
}

// 图片压缩配置
const IMAGE_SIZES = {
  original: { width: 1920, quality: 85 },  // 原图最大宽度
  thumbnail: { width: 800, quality: 80 },   // 缩略图（用于博客列表和文章内）
};

// 压缩图片
async function compressImage(
  buffer: Buffer,
  maxWidth: number,
  quality: number
): Promise<Buffer> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // 只有当图片宽度超过 maxWidth 时才压缩
    const needsResize = metadata.width && metadata.width > maxWidth;
    
    let pipeline = image;
    
    if (needsResize) {
      pipeline = pipeline.resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }
    
    // 根据格式压缩
    if (metadata.format === 'png') {
      return await pipeline.png({ quality, compressionLevel: 9 }).toBuffer();
    } else if (metadata.format === 'webp') {
      return await pipeline.webp({ quality }).toBuffer();
    } else if (metadata.format === 'gif') {
      // GIF 保持原样，不压缩
      return buffer;
    } else {
      // 默认转为 JPEG
      return await pipeline.jpeg({ quality, progressive: true }).toBuffer();
    }
  } catch (error) {
    console.error("图片压缩失败，使用原图:", error);
    return buffer;
  }
}

// 上传图片（返回缩略图 URL，同时存储原图）
export async function uploadImage(
  file: Buffer,
  originalName: string,
  contentType: string
): Promise<string> {
  try {
    const containerClient = await getImagesContainer();
    const baseName = generateImageName(originalName);
    const ext = baseName.split('.').pop() || 'jpg';
    const nameWithoutExt = baseName.replace(`.${ext}`, '');
    
    // 1. 压缩并上传缩略图（用于博客显示）
    const thumbnailBuffer = await compressImage(
      file,
      IMAGE_SIZES.thumbnail.width,
      IMAGE_SIZES.thumbnail.quality
    );
    const thumbnailName = `${nameWithoutExt}-thumb.${ext}`;
    const thumbnailBlobClient = containerClient.getBlockBlobClient(thumbnailName);
    
    await thumbnailBlobClient.uploadData(thumbnailBuffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: "public, max-age=31536000",
      },
    });
    
    // 2. 压缩并上传原图（保留较高质量版本）
    const originalBuffer = await compressImage(
      file,
      IMAGE_SIZES.original.width,
      IMAGE_SIZES.original.quality
    );
    const originalBlobClient = containerClient.getBlockBlobClient(baseName);
    
    await originalBlobClient.uploadData(originalBuffer, {
      blobHTTPHeaders: {
        blobContentType: contentType,
        blobCacheControl: "public, max-age=31536000",
      },
    });

    // 返回缩略图的 URL（用于博客文章显示）
    // 原图可通过去掉 -thumb 后缀访问
    return generateSasUrl(thumbnailBlobClient);
  } catch (error) {
    console.error("上传图片失败:", error);
    throw error;
  }
}

// 删除图片（同时删除原图和缩略图）
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    const containerClient = await getImagesContainer();
    // 从 URL 中提取文件名（去掉 SAS Token）
    const urlWithoutQuery = imageUrl.split('?')[0];
    const imageName = urlWithoutQuery.split('/').pop();
    if (!imageName) return;

    // 删除缩略图
    const thumbBlobClient = containerClient.getBlockBlobClient(imageName);
    await thumbBlobClient.deleteIfExists();
    
    // 删除原图
    const originalName = imageName.replace('-thumb.', '.');
    if (originalName !== imageName) {
      const originalBlobClient = containerClient.getBlockBlobClient(originalName);
      await originalBlobClient.deleteIfExists();
    }
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
