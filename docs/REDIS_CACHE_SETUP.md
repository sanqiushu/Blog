# Redis 缓存配置指南

本博客系统支持 Redis 缓存来提升 API 响应速度，缓存过期时间为 **1 小时**。

## 🔄 自动切换机制

系统会根据环境变量自动选择是否启用缓存：
- **未配置 `REDIS_URL`**：缓存功能禁用，直接读取存储
- **已配置 `REDIS_URL`**：启用 Redis 缓存

## 📋 本地开发配置

### 1. 安装 Redis

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# 或使用 Docker
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 2. 配置环境变量

在 `.env.local` 文件中添加：

```env
REDIS_URL=redis://localhost:6379
```

### 3. 验证 Redis 运行状态

```bash
# 检查 Redis 是否运行
redis-cli ping
# 应返回: PONG
```

## ☁️ Azure 生产环境配置

### 1. 创建 Azure Cache for Redis

```bash
# 注册 Microsoft.Cache 提供程序（首次使用需要）
az provider register --namespace Microsoft.Cache

# 创建 Redis 实例 (Basic C0 层，约 $16/月)
az redis create \
  --name your-redis-name \
  --resource-group YourResourceGroup \
  --location eastasia \
  --sku Basic \
  --vm-size c0
```

或在 Azure Portal 中：
1. 搜索 "Azure Cache for Redis"
2. 点击 **创建**
3. 选择 **Basic C0**（最便宜）
4. 等待创建完成（约 5-10 分钟）

### 2. 获取连接密钥

```bash
# 获取访问密钥
az redis list-keys \
  --name your-redis-name \
  --resource-group YourResourceGroup \
  --query "primaryKey" -o tsv
```

或在 Azure Portal：
1. 进入 Redis 资源
2. 左侧菜单选择 **访问密钥 (Access keys)**
3. 复制 **主密钥 (Primary key)**

### 3. 配置 GitHub Actions Secret

```bash
# 使用 GitHub CLI 添加 Secret
gh secret set REDIS_URL --body "rediss://:YOUR_ACCESS_KEY@your-redis-name.redis.cache.windows.net:6380"
```

**注意**：
- 协议是 `rediss://`（带 s，表示 SSL/TLS）
- 端口是 `6380`（SSL 端口，非默认的 6379）
- 密码前面有 `:`（格式为 `rediss://:password@host:port`）

### 4. CI/CD 配置

在 `.github/workflows/azure-app-service.yml` 中已配置：

```yaml
- name: Configure App Settings
  uses: azure/appservice-settings@v1
  with:
    app-name: ${{ env.AZURE_WEBAPP_NAME }}
    app-settings-json: |
      [
        { "name": "REDIS_URL", "value": "${{ secrets.REDIS_URL }}", "slotSetting": false },
        ...
      ]
```

## 🎯 缓存策略

### 缓存的 API 端点

| 端点 | 缓存键 | 说明 |
|------|--------|------|
| `GET /api/posts` | `blog:posts:list` | 文章列表 |
| `GET /api/posts/[id]` | `blog:posts:{id}` | 单篇文章 |
| `GET /api/about` | `blog:about:content` | 关于页面 |
| `GET /api/gallery` | `blog:gallery:folders` | 相册列表 |
| `GET /api/gallery/[folderId]` | `blog:gallery:folder:{id}` | 相册详情 |

### 缓存失效策略

写入操作（POST/PUT/DELETE）会自动清除相关缓存：

| 操作 | 清除的缓存 |
|------|-----------|
| 创建文章 | 文章列表缓存 |
| 更新文章 | 文章列表 + 单篇文章缓存 |
| 删除文章 | 文章列表 + 单篇文章缓存 |
| 更新关于页面 | 关于页面缓存 |
| 相册操作 | 相册列表 + 相册详情缓存 |

## 🔧 跳过缓存

在 URL 中添加 `?fight=skipCache` 参数可以跳过缓存，直接读取最新数据：

```bash
# 跳过缓存获取最新数据
curl https://your-site.com/api/posts?fight=skipCache

# 使用缓存（默认行为）
curl https://your-site.com/api/posts
```

## 📊 缓存配置

| 配置项 | 值 | 说明 |
|--------|---|------|
| **TTL（过期时间）** | 1 小时 | 缓存自动过期时间 |
| **键前缀** | `blog:` | 所有缓存键的前缀 |
| **连接超时** | 10 秒 | Redis 连接超时时间 |
| **最大重试次数** | 3 次 | 连接失败后重试次数 |

## 💰 成本估算

| 层级 | 价格 (约) | 适用场景 |
|------|----------|---------|
| **Basic C0** | $16/月 | 开发/测试环境 |
| **Standard C0** | $40/月 | 小型生产环境 |
| **Standard C1** | $80/月 | 中型生产环境 |

**提示**：如果预算有限，可以不启用 Redis，系统会自动禁用缓存功能继续正常工作。

## 🔍 故障排查

### 错误: "REDIS_URL 环境变量未设置"

**原因**: 未配置 Redis 连接

**解决方案**: 这不是错误，只是提示缓存功能已禁用

### 错误: "Redis 连接错误"

**原因**: 
1. Redis 服务未运行
2. 连接字符串格式错误
3. 网络/防火墙问题

**解决方案**:
```bash
# 检查本地 Redis
redis-cli ping

# 检查 Azure Redis 状态
az redis show --name your-redis-name --resource-group YourResourceGroup --query "provisioningState"
```

### 错误: "WRONGPASS" 或认证失败

**原因**: 密码不正确

**解决方案**:
1. 重新获取访问密钥
2. 检查 URL 格式：`rediss://:PASSWORD@host:6380`
3. 确保密码中的特殊字符已正确编码

## 🔐 安全建议

1. ✅ 永远不要将 REDIS_URL 提交到 Git
2. ✅ 使用 GitHub Secrets 管理连接字符串
3. ✅ Azure Redis 默认启用 SSL/TLS（端口 6380）
4. ✅ 定期轮换访问密钥
5. ✅ 考虑配置 Azure 防火墙规则限制访问

## 📞 参考链接

- [Azure Cache for Redis 文档](https://docs.microsoft.com/azure/azure-cache-for-redis/)
- [ioredis GitHub](https://github.com/redis/ioredis)
- [Redis 官方文档](https://redis.io/docs/)
