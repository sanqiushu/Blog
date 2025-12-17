# 个人博客管理系统

一个使用 Next.js 16 构建的现代化个人博客系统，支持完整的博客管理功能。

## ✨ 功能特性

### 前台功能（公开访问）
- ✅ 浏览所有博客文章
- ✅ 查看博客详情
- ✅ 响应式设计，支持移动端
- ✅ 深色模式支持

### 后台管理（需登录）
- ✅ 管理员登录认证
- ✅ 新增博客文章
- ✅ 编辑现有文章
- ✅ 删除文章
- ✅ 博客列表管理

### 技术特性
- ✅ 文件系统存储（JSON格式）
- ✅ 数据持久化
- ✅ 前后端分离架构
- ✅ Session 认证机制
- ✅ TypeScript 类型安全

## 🚀 快速开始

### 1. 安装依赖

首先需要安装 tsx 用于运行初始化脚本：

```bash
npm install
npm install -D tsx
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，设置您的管理员密码：

```env
ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=your-random-secret-key
```

⚠️ **重要**: 请务必修改默认密码！

### 3. 初始化博客数据

运行初始化脚本，将现有博客数据导入到 JSON 文件：

```bash
npm run init-data
```

这将创建 `data/posts.json` 文件并导入初始博客数据。

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 📁 项目结构

```
app/
├── src/
│   ├── app/
│   │   ├── api/              # API 路由
│   │   │   ├── auth/         # 认证相关 API
│   │   │   │   ├── login/    # 登录
│   │   │   │   ├── logout/   # 登出
│   │   │   │   └── check/    # 检查认证状态
│   │   │   └── posts/        # 博客 CRUD API
│   │   │       ├── route.ts  # 获取列表/创建
│   │   │       └── [id]/     # 获取/更新/删除单篇
│   │   ├── admin/            # 管理后台页面
│   │   │   ├── page.tsx      # 管理主页
│   │   │   ├── new/          # 新增博客
│   │   │   └── edit/[id]/    # 编辑博客
│   │   ├── blog/[slug]/      # 博客详情页
│   │   ├── login/            # 登录页面
│   │   └── page.tsx          # 首页
│   ├── components/           # React 组件
│   │   ├── BlogCard.tsx      # 博客卡片
│   │   ├── BlogForm.tsx      # 博客表单
│   │   ├── Header.tsx        # 页头
│   │   └── Footer.tsx        # 页脚
│   ├── lib/                  # 核心库
│   │   ├── storage.ts        # 文件存储服务
│   │   └── auth.ts           # 认证服务
│   ├── hooks/                # 自定义 Hooks
│   │   └── useAuth.ts        # 认证 Hook
│   ├── types/                # TypeScript 类型
│   │   └── blog.ts           # 博客类型定义
│   └── data/                 # 初始数据（仅用于迁移）
│       └── posts.ts          # 原始博客数据
├── data/                     # 运行时数据目录
│   └── posts.json            # 博客数据文件
├── scripts/                  # 脚本
│   └── init-data.ts          # 数据初始化脚本
└── public/                   # 静态资源
```

## 🔐 认证机制

### 管理员登录
1. 访问 `/login` 页面
2. 输入管理员密码（通过环境变量 ADMIN_PASSWORD 设置）
3. 登录成功后会创建 Session（24小时有效）
4. Session 存储在 Cookie 中

### 权限控制
- **公开页面**: 首页、博客详情页、关于页面
- **需要认证**: 
  - `/admin` - 管理后台
  - `/admin/new` - 新增博客
  - `/admin/edit/[id]` - 编辑博客
  - API: POST/PUT/DELETE `/api/posts`

## 💾 数据存储

博客数据存储在 `data/posts.json` 文件中：

```json
[
  {
    "id": "1",
    "title": "博客标题",
    "slug": "blog-slug",
    "excerpt": "博客摘要",
    "content": "博客内容...",
    "date": "2025-11-23",
    "author": "作者名",
    "tags": ["标签1", "标签2"],
    "coverImage": "封面图片URL",
    "readTime": "5分钟"
  }
]
```

### 数据备份
建议定期备份 `data/posts.json` 文件。您也可以将此文件纳入版本控制系统（如有需要）。

## 🔧 API 接口

### 公开接口

#### 获取所有博客
```
GET /api/posts
```

#### 获取单篇博客
```
GET /api/posts/[id]
```

### 需要认证的接口

#### 创建博客
```
POST /api/posts
Content-Type: application/json

{
  "title": "标题",
  "excerpt": "摘要",
  "content": "内容",
  "tags": ["标签"],
  "author": "作者",
  ...
}
```

#### 更新博客
```
PUT /api/posts/[id]
Content-Type: application/json

{
  "title": "新标题",
  ...
}
```

#### 删除博客
```
DELETE /api/posts/[id]
```

## 🌐 部署

### 环境变量配置

在生产环境中，请确保设置以下环境变量：

```env
ADMIN_PASSWORD=your-strong-password
SESSION_SECRET=your-random-secret-key-at-least-32-characters
NODE_ENV=production
```

### 部署步骤

1. 构建项目：
```bash
npm run build
```

2. 确保 `data` 目录存在且有写入权限

3. 启动生产服务器：
```bash
npm start
```

### 注意事项

- 确保服务器有文件写入权限
- `data/posts.json` 需要持久化存储
- 建议使用反向代理（如 Nginx）
- 配置 HTTPS 以保护登录信息

## 📝 使用指南

### 1. 首次使用

1. 运行 `npm run init-data` 初始化数据
2. 访问 `/login` 登录
3. 进入 `/admin` 管理后台

### 2. 新增博客

1. 点击"新增博客"按钮
2. 填写博客信息：
   - 标题（必填）
   - 摘要（必填）
   - 内容（必填，支持 Markdown）
   - 作者、标签、封面图等（可选）
3. 点击"创建博客"

### 3. 编辑博客

1. 在管理列表中点击"编辑"
2. 修改博客内容
3. 点击"更新博客"

### 4. 删除博客

1. 在管理列表中点击"删除"
2. 确认删除操作

## 🛠️ 技术栈

- **框架**: Next.js 16
- **UI**: React 19
- **样式**: Tailwind CSS 4
- **语言**: TypeScript 5.9
- **存储**: 文件系统（JSON）
- **认证**: Session-based

## 🔒 安全建议

1. ✅ 修改默认管理员密码
2. ✅ 使用强随机字符串作为 SESSION_SECRET
3. ✅ 在生产环境启用 HTTPS
4. ✅ 定期备份 `data/posts.json`
5. ✅ 考虑添加 CSRF 保护
6. ✅ 实施请求速率限制

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
