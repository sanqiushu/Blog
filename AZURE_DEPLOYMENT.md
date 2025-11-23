# Azure 部署指南

本项目使用 **Azure App Service** 来部署 Next.js 应用，通过 GitHub Actions 实现自动化部署。

## 当前部署配置

- **Web App 名称**: `chengdezhi`
- **访问地址**: https://chengdezhi.azurewebsites.net
- **资源组**: `MyBlogResourceGroup`
- **App Service 计划**: `MyBlogPlan` (B1 SKU)
- **运行时**: Node.js 20 LTS
- **部署方式**: GitHub Actions + Azure Service Principal

## 架构说明

项目使用 Next.js 的 **standalone 输出模式**，优势：
- 自包含的服务器，所有依赖打包在一起
- 更小的部署体积，更快的启动时间
- 避免 Azure Oryx 构建系统的兼容性问题

## 自动部署流程

每次推送到 `main` 分支时，GitHub Actions 会自动：

1. **构建阶段**：
   - 安装依赖 (`npm ci`)
   - 运行代码检查 (`npm run lint`)
   - 构建应用 (`npm run build`)
   - 准备 standalone 部署包

2. **部署阶段**：
   - 使用 Azure Service Principal 登录
   - 将构建产物部署到 Azure App Service
   - 应用自动重启并上线

## 首次部署设置

### 1. 创建 Azure 资源

```bash
# 安装 Azure CLI
brew install azure-cli

# 登录 Azure（需要使用 --tenant 参数）
az login --tenant YOUR_TENANT_ID --use-device-code

# 创建资源组
az group create --name MyBlogResourceGroup --location eastasia

# 创建 App Service 计划
az appservice plan create \
  --name MyBlogPlan \
  --resource-group MyBlogResourceGroup \
  --sku B1 \
  --is-linux

# 创建 Web App
az webapp create \
  --resource-group MyBlogResourceGroup \
  --plan MyBlogPlan \
  --name YOUR_UNIQUE_NAME \
  --runtime "NODE:20-lts"

# 设置启动命令
az webapp config set \
  --resource-group MyBlogResourceGroup \
  --name YOUR_UNIQUE_NAME \
  --startup-file "node server.js"
```

### 2. 创建 Service Principal

```bash
# 创建用于 GitHub Actions 的 Service Principal
az ad sp create-for-rbac \
  --name "your-blog-sp" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/MyBlogResourceGroup \
  --sdk-auth
```

这会输出包含凭据的 JSON，复制完整输出。

### 3. 配置 GitHub Secret

1. 访问仓库的 **Settings > Secrets and variables > Actions**
2. 点击 **New repository secret**
3. 添加 Secret：
   - **Name**: `AZURE_CREDENTIALS`
   - **Secret**: 粘贴上一步的完整 JSON 输出
4. 点击 **Add secret**

### 4. 更新工作流配置

编辑 `.github/workflows/azure-app-service.yml`：

```yaml
env:
  NODE_VERSION: "20.x"
  AZURE_WEBAPP_NAME: "YOUR_UNIQUE_NAME"  # 改为你的 Web App 名称
```

### 5. 触发部署

推送代码到 `main` 分支即可触发自动部署：

```bash
git add .
git commit -m "Update deployment config"
git push origin main
```

## 本地测试

在推送前，建议本地测试 standalone 构建：

```bash
# 安装依赖
npm install

# 构建应用（会生成 .next/standalone 目录）
npm run build

# 测试 standalone 模式
cd .next/standalone
node server.js
```

访问 http://localhost:3000 确认应用正常运行。

## 故障排查

### 查看部署日志

```bash
# 下载应用日志
az webapp log download \
  --resource-group MyBlogResourceGroup \
  --name YOUR_WEBAPP_NAME \
  --log-file logs.zip

# 实时查看日志
az webapp log tail \
  --resource-group MyBlogResourceGroup \
  --name YOUR_WEBAPP_NAME
```

### 常见问题

**问题：Application Error**
- 检查启动命令是否为 `node server.js`
- 确认 standalone 输出是否正确生成
- 查看应用日志了解具体错误

**问题：部署超时**
- 检查 GitHub Actions 日志
- 确认 Service Principal 权限正确

**问题：MFA 登录失败**
- 使用 `az login --tenant TENANT_ID --use-device-code`
- 完成设备代码验证后再执行其他命令

## 高级配置

### 环境变量

在 Azure Portal 或通过 CLI 添加环境变量：

```bash
az webapp config appsettings set \
  --resource-group MyBlogResourceGroup \
  --name YOUR_WEBAPP_NAME \
  --settings KEY=VALUE
```

### 自定义域名

1. 在 Azure Portal 的 Web App 中选择 "Custom domains"
2. 添加自定义域名并验证
3. 配置 DNS 记录指向 Azure

### 启用 HTTPS

```bash
az webapp update \
  --resource-group MyBlogResourceGroup \
  --name YOUR_WEBAPP_NAME \
  --https-only true
```

---

## 环境变量配置

在 App Service 中使用应用程序设置：

```bash
az webapp config appsettings set \
  --resource-group MyBlogResourceGroup \
  --name my-unique-blog-name \
  --settings KEY1=VALUE1 KEY2=VALUE2
```

设置后会自动重启实例生效。

---

## 自定义域名（App Service）
1. 在 Azure Portal 打开你的 Web App
2. 选择 **自定义域** > **添加自定义域**
3. 根据提示在 DNS 服务商处添加 CNAME/A 记录
4. 完成验证后即可绑定域名并申请免费证书

---

## 故障排除

- **构建失败**：在 Azure Portal > Web App > **部署中心** 查看日志，确认 `npm install`、`npm run build` 正常；必要时在 `package.json` 中固定 Node 版本。
- **启动后 502/503**：确认 `startup-file` 设置为 `npm start`，并在 `package.json` 中提供对应脚本；确保 `PORT` 环境变量与应用监听端口一致。
- **静态资源 404**：确保部署的是 `next build` 结果且未执行 `next export`，并检查 `next.config.ts` 中没有 `output: 'export'`。

---

## 成本

- **Azure App Service B1（基础层）**：约 $13/月，1.75 GB RAM，100 GB 存储，支持自定义域和 SSL。
- 可以根据需求升级到 S1/S2 以获得更多计算资源或开启自动扩缩。

---

## 相关链接

- [Azure App Service 文档](https://learn.microsoft.com/azure/app-service/)
- [Azure CLI 参考](https://learn.microsoft.com/cli/azure/reference-index)
- [Next.js 部署指南](https://nextjs.org/docs/app/building-your-application/deploying)
