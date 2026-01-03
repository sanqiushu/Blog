# 项目结构分析

这是一个基于 Next.js 16 (App Router) 的全栈博客系统，集成了 Azure Blob Storage 作为主要数据存储，并使用 Redis 进行缓存。

以下是项目的详细代码结构梳理：

## 1. 核心技术栈
- **框架**: Next.js 16 (React 19)
- **样式**: Tailwind CSS 4
- **存储**: Azure Blob Storage (使用 azurite 进行本地模拟)
- **缓存**: Redis (ioredis)
- **图片处理**: Sharp
- **Markdown**: react-markdown + remark-gfm

## 2. 目录结构概览

### app (路由与页面)
采用 Next.js App Router 模式，目录即路由。

- `blog/`: 博客文章展示页 ([slug] 动态路由)。
- `gallery/`: 相册展示页，支持文件夹层级 ([folderId])。
- `admin/`: 后台管理界面，包含文章编辑 (edit) 和新建 (new)。
- `login/`: 管理员登录页面。
- `api/`: 后端 API 路由，处理数据增删改查。
  - `auth/`: 登录/登出/状态检查。
  - `posts/`: 文章的 CRUD 操作。
  - `gallery/`: 相册文件夹和图片的管理。
  - `upload/`: 图片上传接口。

### lib (核心逻辑与工具)
这是项目的后端逻辑核心。

- `storage/`: Azure Blob Storage 的封装层。
  - `blob-core.ts`: 基础的 Blob 连接和操作封装。
  - `posts.ts`: 博客文章的存储逻辑（存为一个 JSON Blob）。
  - `gallery.ts`: 相册数据的存储逻辑。
  - `images.ts`: 图片文件的上传与删除处理。
- `redis.ts`: Redis 客户端配置与缓存工具函数 (getCache, setCache)。
- `auth.ts`: 简单的基于密码和 Session Cookie 的认证逻辑。
- `slug-generator.ts`: 用于生成文章 URL Slug 的工具。

### components (UI 组件)
- `gallery/`: 相册专用组件 (ImageGrid, FullscreenPreview, ProgressiveImage)。
- `MarkdownRenderer.tsx`: 统一的 Markdown 渲染组件，用于文章展示。
- `BlogForm.tsx`: 文章编辑/新建的表单组件。
- `AdminActions.tsx`: 管理员操作按钮（如删除、编辑）。

### types (类型定义)
- `blog.ts`: 定义 BlogPost 结构。
- `gallery.ts`: 定义 GalleryFolder 和 GalleryImage 结构。

## 3. 数据存储设计
项目没有使用传统的关系型数据库（如 MySQL/PostgreSQL），而是采用了 "Serverless" 风格的文件存储：

- **文章数据**: 所有文章元数据和内容存储在一个 JSON 文件中 (Blob Storage)，读取时会优先查 Redis 缓存。
- **图片文件**: 直接存储在 Azure Blob Container 中。
- **相册结构**: 也是通过 JSON 文件维护文件夹和图片的映射关系。

## 4. 本地开发环境
- `azurite`: 包含 Azurite (Azure Storage 模拟器) 的数据文件，用于本地模拟云存储环境。
- `docs`: 包含详细的部署和设置文档 (AZURE_STORAGE_SETUP.md, REDIS_CACHE_SETUP.md)。

这个架构非常适合个人博客，轻量且易于迁移，利用 Blob Storage + Redis 实现了低成本高性能的数据读写。
