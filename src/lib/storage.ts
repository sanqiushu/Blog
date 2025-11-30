import { BlogPost } from "@/types/blog";

// 根据环境变量动态导入存储模块
const useAzureStorage = !!process.env.AZURE_STORAGE_CONNECTION_STRING;

// 存储模块接口
interface StorageModule {
  readPosts: () => Promise<BlogPost[]>;
  writePosts: (posts: BlogPost[]) => Promise<void>;
  getPostById: (id: string) => Promise<BlogPost | null>;
  getPostBySlug: (slug: string) => Promise<BlogPost | null>;
  createPost: (postData: Omit<BlogPost, "id">) => Promise<BlogPost>;
  updatePost: (id: string, postData: Partial<BlogPost>) => Promise<BlogPost | null>;
  deletePost: (id: string) => Promise<BlogPost | null>;
}

// 动态导入存储模块
let storageModule: StorageModule;

async function getStorageModule() {
  if (!storageModule) {
    if (useAzureStorage) {
      console.log("使用 Azure Blob Storage");
      storageModule = await import("./storage-azure");
    } else {
      console.log("使用本地文件系统存储");
      storageModule = await import("./storage-local");
    }
  }
  return storageModule;
}

// 读取所有博客文章
export async function readPosts(): Promise<BlogPost[]> {
  const storage = await getStorageModule();
  return storage.readPosts();
}

// 写入所有博客文章
export async function writePosts(posts: BlogPost[]): Promise<void> {
  const storage = await getStorageModule();
  return storage.writePosts(posts);
}

// 获取单个博客文章
export async function getPostById(id: string): Promise<BlogPost | null> {
  const storage = await getStorageModule();
  return storage.getPostById(id);
}

// 获取单个博客文章（通过 slug）
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const storage = await getStorageModule();
  return storage.getPostBySlug(slug);
}

// 创建新博客文章
export async function createPost(
  postData: Omit<BlogPost, "id">
): Promise<BlogPost> {
  const storage = await getStorageModule();
  return storage.createPost(postData);
}

// 更新博客文章
export async function updatePost(
  id: string,
  postData: Partial<BlogPost>
): Promise<BlogPost | null> {
  const storage = await getStorageModule();
  return storage.updatePost(id, postData);
}

// 删除博客文章
export async function deletePost(id: string): Promise<BlogPost | null> {
  const storage = await getStorageModule();
  return storage.deletePost(id);
}
