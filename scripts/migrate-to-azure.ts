import { BlobServiceClient } from "@azure/storage-blob";
import { promises as fs } from "fs";
import path from "path";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "blog-data";
const BLOB_NAME = "posts.json";
const LOCAL_FILE = path.join(process.cwd(), "data", "posts.json");

async function migrate() {
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    console.error("❌ 错误: AZURE_STORAGE_CONNECTION_STRING 环境变量未设置");
    console.log("\n请在 .env.local 中设置 Azure Storage 连接字符串");
    process.exit(1);
  }

  try {
    console.log("📤 开始迁移数据到 Azure Blob Storage...\n");

    // 读取本地文件
    console.log(`📖 读取本地文件: ${LOCAL_FILE}`);
    const data = await fs.readFile(LOCAL_FILE, "utf-8");
    const posts = JSON.parse(data);
    console.log(`✅ 成功读取 ${posts.length} 篇博客\n`);

    // 连接到 Azure Storage
    console.log("🔗 连接到 Azure Storage...");
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // 创建容器（如果不存在）
    console.log(`📦 创建容器: ${CONTAINER_NAME}`);
    await containerClient.createIfNotExists();
    console.log("✅ 容器已就绪\n");

    // 上传数据
    console.log(`⬆️  上传数据到 Blob: ${BLOB_NAME}`);
    const blockBlobClient = containerClient.getBlockBlobClient(BLOB_NAME);
    const uploadData = JSON.stringify(posts, null, 2);
    await blockBlobClient.upload(uploadData, Buffer.byteLength(uploadData), {
      blobHTTPHeaders: {
        blobContentType: "application/json",
      },
    });

    console.log("✅ 数据上传成功!\n");
    console.log("📊 迁移摘要:");
    console.log(`   - 容器: ${CONTAINER_NAME}`);
    console.log(`   - Blob: ${BLOB_NAME}`);
    console.log(`   - 博客数量: ${posts.length}`);
    console.log(`   - 数据大小: ${(Buffer.byteLength(uploadData) / 1024).toFixed(2)} KB\n`);

    console.log("🎉 迁移完成！");
    console.log("\n下一步:");
    console.log("1. 验证数据: 访问 Azure Portal 查看 Storage Account");
    console.log("2. 在 Azure App Service 中配置 AZURE_STORAGE_CONNECTION_STRING");
    console.log("3. 部署应用到 Azure");

  } catch (error) {
    console.error("❌ 迁移失败:", error);
    process.exit(1);
  }
}

migrate();
