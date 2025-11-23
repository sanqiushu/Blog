# Azure 部署指南

本项目推荐使用 **Azure App Service** 来部署 Next.js，这样可以完整保留 SSR、动态路由以及未来可能添加的 API Routes。

## Azure App Service（推荐）

### 前提条件
- Azure 账户
- 已安装 [Azure CLI](https://learn.microsoft.com/cli/azure/)
- 代码已经推送到 GitHub 或其他 Git 提供商

### 部署步骤

1. **安装 Azure CLI（如尚未安装）**
   ```bash
   brew install azure-cli
   ```

2. **登录 Azure**
   ```bash
   az login
   ```

3. **创建资源组**
   ```bash
   az group create --name MyBlogResourceGroup --location eastasia
   ```

4. **创建 Linux App Service 计划**
   ```bash
   az appservice plan create --name MyBlogPlan --resource-group MyBlogResourceGroup --sku B1 --is-linux
   ```

5. **创建 Web App（Node 运行时）**
   ```bash
   az webapp create \
     --resource-group MyBlogResourceGroup \
     --plan MyBlogPlan \
     --name my-unique-blog-name \
     --runtime "NODE:18-lts"
   ```

6. **配置源码部署（可选，但推荐）**
   ```bash
   az webapp deployment source config \
     --name my-unique-blog-name \
     --resource-group MyBlogResourceGroup \
     --repo-url https://github.com/YOUR_USERNAME/YOUR_REPO \
     --branch main \
     --manual-integration
   ```

7. **设置启动命令和端口**
   ```bash
   az webapp config set --resource-group MyBlogResourceGroup --name my-unique-blog-name --startup-file "npm start"
   az webapp config appsettings set --resource-group MyBlogResourceGroup --name my-unique-blog-name --settings PORT=8080
   ```

8. **（可选）使用 ZIP/VS Code 直接部署**
   - 安装 VS Code 的 Azure App Service 扩展
   - 在资源管理器中右键项目文件夹 > **Deploy to Web App**
   - 选择订阅、现有/新建 Web App，扩展会自动打包并上传

---

## GitHub Actions 自动部署

仓库已经包含 [`azure-app-service.yml`](.github/workflows/azure-app-service.yml) 工作流，会在 `main` 分支有新的 push 时自动执行 `npm ci`、`npm run lint`、`npm run build` 并将代码发布到 Azure App Service。启用方式如下：

1. **准备 Azure 资源**：按上方步骤创建 Resource Group、App Service Plan 与 Web App。
2. **设置发布凭据**：在 GitHub 仓库中添加机密 `AZURE_WEBAPP_PUBLISH_PROFILE`，值可在 Portal > Web App > *Get publish profile* 下载到的 XML 文件中复制，或者使用命令：
   ```bash
   az webapp deployment list-publishing-profiles \
     --resource-group MyBlogResourceGroup \
     --name my-unique-blog-name \
     --xml
   ```
3. **指定 Web App 名称**：
   - 最简单做法是在 `azure-app-service.yml` 顶部的 `AZURE_WEBAPP_NAME` 中写入刚创建的 Web App 名称；
   - 或者在仓库的 **Settings > Variables > Actions** 中创建变量 `AZURE_WEBAPP_NAME`，随后删除工作流里的占位符即可。
4. **首次触发**：在 GitHub 的 *Actions* 页面对该工作流执行一次 **Run workflow**，确认发布成功后即可依赖 `main` 分支的 push 自动部署。

### 工作流概览

- `build` job：安装依赖、运行 ESLint、执行 `next build`，在进入部署环节前就能发现问题。
- `deploy` job：只有在 `main` 分支上才会执行，使用 `azure/webapps-deploy@v2` 将源码推送到 App Service，Azure 端会自动运行 `npm install` 和 `npm run build`，最后通过 `npm start` 启动。

> **提示**：如果你更喜欢在 CI 里产出构建产物再部署，可以把 `.next`, `public`, `package*.json`, `node_modules` 打包成 zip 并把 `azure/webapps-deploy` 的 `package` 参数指向该 zip。当前配置为了简单直接使用源码部署。

### 本地构建 & 测试

```bash
npm install
npm run build
npm run start
```

确认应用在本地端口 3000 运行成功，再推送到 Azure。

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
