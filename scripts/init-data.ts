import { promises as fs } from "fs";
import path from "path";
import { blogPosts } from "../src/data/posts";

const DATA_DIR = path.join(process.cwd(), "data");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");

async function initializeData() {
  try {
    // 创建数据目录
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // 将现有博客数据写入JSON文件
    await fs.writeFile(POSTS_FILE, JSON.stringify(blogPosts, null, 2));
    
    console.log("✅ 博客数据已成功初始化到 data/posts.json");
    console.log(`📝 已导入 ${blogPosts.length} 篇博客文章`);
  } catch (error) {
    console.error("❌ 初始化失败:", error);
    process.exit(1);
  }
}

initializeData();
