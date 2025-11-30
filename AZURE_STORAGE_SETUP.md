# Azure Storage 配置指南

本博客系统支持两种存储方式：
1. **本地文件系统**（默认，适合开发环境）
2. **Azure Blob Storage**（推荐用于生产环境）

## 🔄 自动切换机制

系统会根据环境变量自动选择存储方式：
- **未配置 `AZURE_STORAGE_CONNECTION_STRING`**：使用本地文件 `data/posts.json`
- **已配置 `AZURE_STORAGE_CONNECTION_STRING`**：使用 Azure Blob Storage

## 📋 Azure Storage 配置步骤

### 1. 创建 Azure Storage Account

在 Azure Portal 中：

1. 进入 **Storage accounts**
2. 点击 **+ Create**
3. 填写信息：
   - **Resource group**: 选择或创建资源组（如 `MyBlogResourceGroup`）
   - **Storage account name**: 输入名称（如 `myblogstoragexxxx`，必须全局唯一）
   - **Region**: 选择区域（如 `East Asia`）
   - **Performance**: Standard
   - **Redundancy**: LRS（本地冗余）即可
4. 点击 **Review + create** 创建

### 2. 获取连接字符串

创建完成后：

1. 进入刚创建的 Storage Account
2. 左侧菜单选择 **Access keys**
3. 复制 **Connection string**（key1 或 key2 均可）

格式类似：
```
DefaultEndpointsProtocol=https;AccountName=myblogstorage;AccountKey=xxxxx==;EndpointSuffix=core.windows.net
```

### 3. 配置环境变量

#### 本地开发

创建 `.env.local` 文件：

```env
ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=your-random-secret-key
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your-account;AccountKey=your-key;EndpointSuffix=core.windows.net
```

#### Azure App Service 生产环境

在 Azure Portal 中：

1. 进入您的 **App Service**
2. 左侧菜单选择 **Configuration**
3. 点击 **New application setting**
4. 添加以下设置：

| Name | Value |
|------|-------|
| `ADMIN_PASSWORD` | 您的管理员密码 |
| `SESSION_SECRET` | 随机密钥字符串 |
| `AZURE_STORAGE_CONNECTION_STRING` | 从 Storage Account 复制的连接字符串 |

5. 点击 **Save** 保存

### 4. 验证配置

启动应用后，检查控制台输出：

```bash
# 使用 Azure Storage 时会显示：
使用 Azure Blob Storage

# 使用本地存储时会显示：
使用本地文件系统存储
```

## 🗂️ Azure Blob Storage 结构

系统会自动创建以下结构：

```
Storage Account
└── Container: blog-data (自动创建)
    └── Blob: posts.json (存储所有博客数据)
```

## 📊 存储对比

| 特性 | 本地文件系统 | Azure Blob Storage |
|------|------------|-------------------|
| **开发环境** | ✅ 推荐 | ⚠️ 可选 |
| **生产环境** | ❌ 不推荐 | ✅ 强烈推荐 |
| **数据持久化** | ⚠️ 取决于服务器 | ✅ 永久持久化 |
| **成本** | 免费 | 几乎免费（GB/月） |
| **可靠性** | 低 | 高（多重备份） |
| **扩展性** | 有限 | 无限 |

## 🔍 故障排查

### 错误: "AZURE_STORAGE_CONNECTION_STRING 环境变量未设置"

**原因**: 系统检测到配置了 Azure Storage 但连接字符串不正确

**解决方案**:
1. 检查 `.env.local` 或 Azure App Service Configuration
2. 确保连接字符串格式正确
3. 确保没有多余的空格或换行

### 错误: "Failed to create container"

**原因**: Storage Account 权限不足或网络问题

**解决方案**:
1. 检查 Azure Storage Account 是否正常运行
2. 检查网络连接
3. 确认连接字符串包含正确的 AccountKey

### 数据迁移

如果要从本地文件系统迁移到 Azure Storage：

1. 确保 `data/posts.json` 有您的数据
2. 运行迁移脚本（即将创建）
3. 或手动上传到 Azure Storage

## 💡 最佳实践

1. **开发环境**: 使用本地文件系统，快速测试
2. **测试环境**: 使用 Azure Storage，模拟生产环境
3. **生产环境**: 必须使用 Azure Storage
4. **备份**: 定期下载 `posts.json` 作为备份

## 🔐 安全建议

1. ✅ 永远不要将连接字符串提交到 Git
2. ✅ 使用环境变量管理敏感信息
3. ✅ 定期轮换 Storage Account Keys
4. ✅ 启用 Azure Storage 的防火墙规则（可选）
5. ✅ 使用 Azure Key Vault 存储连接字符串（高级）

## 📞 需要帮助？

- [Azure Storage 文档](https://docs.microsoft.com/azure/storage/)
- [Azure Blob Storage SDK](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob)
