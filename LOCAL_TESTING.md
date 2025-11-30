# 本地测试 Azure Storage

本指南介绍如何在本地开发环境测试 Azure Blob Storage 功能。

## 方法 1: 使用 Azurite（推荐）

**Azurite** 是微软官方的 Azure Storage 本地模拟器，完全免费且开源。

### ✅ 优点
- 完全模拟 Azure Blob Storage API
- 无需 Azure 账号
- 无需网络连接
- 数据存储在本地
- 快速、免费

### 📋 使用步骤

#### 1. 启动 Azurite

在**第一个终端**运行：

```bash
npm run azurite
```

这将启动本地 Azure Storage 模拟器：
- **Blob Service**: http://127.0.0.1:10000
- **Queue Service**: http://127.0.0.1:10001
- **Table Service**: http://127.0.0.1:10002

数据存储在 `./azurite` 目录中。

#### 2. 配置环境变量

创建或编辑 `.env.local` 文件：

```env
ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=your-random-secret-key

# 使用 Azurite 本地模拟器
AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true
```

**重要**: `UseDevelopmentStorage=true` 是 Azurite 的特殊连接字符串。

#### 3. 启动应用

在**第二个终端**运行：

```bash
npm run dev
```

查看控制台输出，应该显示：
```
使用 Azure Blob Storage
```

#### 4. 测试功能

1. 访问 http://localhost:3000/login
2. 登录管理后台
3. 新增、编辑、删除博客
4. 数据会存储在 Azurite 中

#### 5. 查看存储的数据

使用 **Azure Storage Explorer** 连接到本地 Azurite：
- 下载：https://azure.microsoft.com/features/storage-explorer/
- 连接到本地模拟器
- 查看 `blog-data` 容器中的 `posts.json`

或使用命令行查看：

```bash
# 查看 Azurite 数据目录
ls -la ./azurite/

# 博客数据存储在 __blobstorage__ 文件中
```

### 🛠️ 常用命令

```bash
# 启动 Azurite（后台运行）
npm run azurite

# 清空本地数据（重新开始）
rm -rf ./azurite

# 查看 Azurite 日志
cat ./azurite/debug.log
```

### 🔧 Azurite 配置选项

如果需要自定义配置，编辑 `package.json` 中的 `azurite` 脚本：

```json
{
  "scripts": {
    "azurite": "azurite --silent --location ./azurite --debug ./azurite/debug.log"
  }
}
```

可用选项：
- `--silent`: 静默模式
- `--location <path>`: 数据存储位置
- `--debug <path>`: 调试日志文件
- `--blobPort <port>`: 自定义 Blob 端口（默认 10000）
- `--loose`: 宽松模式（忽略不支持的头部）

## 方法 2: 使用真实的 Azure Storage

如果您已有 Azure 账号，也可以直接使用真实的 Azure Storage。

### 📋 步骤

1. **创建 Storage Account**（如果还没有）
   - 访问 Azure Portal
   - 创建 Storage Account
   - 获取 Connection String

2. **配置环境变量**

在 `.env.local` 中：

```env
ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=your-random-secret-key

# 使用真实的 Azure Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=youraccount;AccountKey=yourkey;EndpointSuffix=core.windows.net
```

3. **启动应用**

```bash
npm run dev
```

### ⚠️ 注意事项

- 会产生少量费用（通常每月几分钱）
- 需要网络连接
- 数据存储在云端

## 方法 3: 不使用 Azure Storage

如果不想测试 Azure Storage，直接使用本地文件系统：

### 📋 步骤

1. **不配置 AZURE_STORAGE_CONNECTION_STRING**

`.env.local` 中只配置：

```env
ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=your-random-secret-key
# 不配置 AZURE_STORAGE_CONNECTION_STRING
```

2. **启动应用**

```bash
npm run dev
```

控制台会显示：
```
使用本地文件系统存储
```

3. **数据存储位置**

数据存储在 `data/posts.json` 文件中。

## 📊 三种方式对比

| 特性 | 本地文件系统 | Azurite | 真实 Azure Storage |
|------|------------|---------|-------------------|
| **配置复杂度** | 最简单 | 简单 | 中等 |
| **Azure 账号** | ❌ 不需要 | ❌ 不需要 | ✅ 需要 |
| **网络连接** | ❌ 不需要 | ❌ 不需要 | ✅ 需要 |
| **成本** | 免费 | 免费 | 几乎免费 |
| **API 兼容性** | N/A | ✅ 完全兼容 | ✅ 完全兼容 |
| **测试真实性** | 低 | 高 | 最高 |
| **推荐场景** | 快速开发 | 完整测试 | 生产验证 |

## 🎯 推荐方案

### 开发阶段
1. **日常开发**: 使用本地文件系统（最快）
2. **功能测试**: 使用 Azurite（完整测试 Azure 集成）
3. **上线前**: 使用真实 Azure Storage（最终验证）

### 工作流程

```bash
# 1. 日常开发 - 不配置 AZURE_STORAGE_CONNECTION_STRING
npm run dev

# 2. 测试 Azure 集成 - 启动 Azurite
# 终端 1
npm run azurite

# 终端 2  
# 在 .env.local 中设置 AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true
npm run dev

# 3. 生产部署 - 使用真实 Azure Storage
# 在 Azure App Service 配置真实的连接字符串
```

## 🔍 故障排查

### Azurite 启动失败

**错误**: `Port 10000 is already in use`

**解决**:
```bash
# 查找占用端口的进程
lsof -i :10000

# 杀死进程
kill -9 <PID>

# 重新启动
npm run azurite
```

### 连接失败

**错误**: `Failed to connect to Azurite`

**解决**:
1. 确认 Azurite 正在运行
2. 检查连接字符串是否为 `UseDevelopmentStorage=true`
3. 尝试重启 Azurite

### 数据不持久化

**原因**: Azurite 数据在 `./azurite` 目录中

**解决**:
- 不要删除 `./azurite` 目录
- 添加到 `.gitignore`（已配置）

## 📚 资源链接

- [Azurite GitHub](https://github.com/Azure/Azurite)
- [Azure Storage Explorer](https://azure.microsoft.com/features/storage-explorer/)
- [Azure Storage 文档](https://docs.microsoft.com/azure/storage/)
