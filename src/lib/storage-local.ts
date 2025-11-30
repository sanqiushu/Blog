import { promises as fs } from "fs";
import path from "path";
import { BlogPost } from "@/types/blog";

// 数据文件路径
// 本地开发使用项目目录，Azure 使用持久化目录
const DATA_DIR = process.env.NODE_ENV === "production" && process.env.HOME
  ? path.join(process.env.HOME, "site", "wwwroot", "data")
  : path.join(process.cwd(), "data");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// 确保数据文件存在
async function ensureDataFile() {
  await ensureDataDir();
  try {
    await fs.access(POSTS_FILE);
  } catch {
    // 如果文件不存在，创建初始数据
    const initialData: BlogPost[] = [];
    await fs.writeFile(POSTS_FILE, JSON.stringify(initialData, null, 2));
  }
}

// 读取所有博客文章
export async function readPosts(): Promise<BlogPost[]> {
  await ensureDataFile();
  try {
    const data = await fs.readFile(POSTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("读取博客数据失败:", error);
    return [];
  }
}

// 写入所有博客文章
export async function writePosts(posts: BlogPost[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
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
export async function createPost(postData: Omit<BlogPost, "id">): Promise<BlogPost> {
  const posts = await readPosts();
  
  // 生成新的 ID
  const maxId = posts.length > 0 
    ? Math.max(...posts.map(p => parseInt(p.id) || 0))
    : 0;
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
export async function updatePost(id: string, postData: Partial<BlogPost>): Promise<BlogPost | null> {
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
