import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { BlogPost } from "@/types/blog";

// Azure Storage 配置
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "blog-data";
const BLOB_NAME = "posts.json";

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

// 读取所有博客文章
export async function readPosts(): Promise<BlogPost[]> {
  try {
    const containerClient = await ensureContainer();
    const blobClient = containerClient.getBlobClient(BLOB_NAME);
    const blockBlobClient = blobClient.getBlockBlobClient();

    // 检查 blob 是否存在
    const exists = await blobClient.exists();
    if (!exists) {
      // 如果不存在，创建空数组
      const initialData: BlogPost[] = [];
      await blockBlobClient.upload(
        JSON.stringify(initialData, null, 2),
        Buffer.byteLength(JSON.stringify(initialData, null, 2))
      );
      return initialData;
    }

    // 下载并解析数据
    const downloadResponse = await blockBlobClient.download(0);
    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);
    const data = downloaded.toString("utf-8");
    return JSON.parse(data);
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
    await blockBlobClient.upload(data, Buffer.byteLength(data), {
      blobHTTPHeaders: {
        blobContentType: "application/json",
      },
    });
  } catch (error) {
    console.error("写入博客数据失败:", error);
    throw error;
  }
}

// 获取单个博客文章
export async function getPostById(id: string): Promise<BlogPost | null> {
  const posts = await readPosts();
  return posts.find((p) => p.id === id) || null;
}

// 获取单个博客文章（通过 slug）
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await readPosts();
  return posts.find((p) => p.slug === slug) || null;
}

// 创建新博客文章
export async function createPost(
  postData: Omit<BlogPost, "id">
): Promise<BlogPost> {
  const posts = await readPosts();

  // 生成新的 ID
  const maxId =
    posts.length > 0 ? Math.max(...posts.map((p) => parseInt(p.id) || 0)) : 0;
  const newId = (maxId + 1).toString();

  const newPost: BlogPost = {
    id: newId,
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
  const index = posts.findIndex((p) => p.id === id);

  if (index === -1) {
    return null;
  }

  // 更新文章，保留 ID
  posts[index] = {
    ...posts[index],
    ...postData,
    id: id, // 确保 ID 不被修改
  };

  await writePosts(posts);
  return posts[index];
}

// 删除博客文章
export async function deletePost(id: string): Promise<BlogPost | null> {
  const posts = await readPosts();
  const index = posts.findIndex((p) => p.id === id);

  if (index === -1) {
    return null;
  }

  const deletedPost = posts.splice(index, 1)[0];
  await writePosts(posts);

  return deletedPost;
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
