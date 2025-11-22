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
