import { BlogPost } from "@/types/blog";

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Next.js 16 新特性解析",
    slug: "nextjs-16-features",
    excerpt: "深入探讨 Next.js 16 带来的重要更新和性能优化，包括 React 19 支持、Turbopack 增强等特性。",
    content: `
# Next.js 16 新特性解析

Next.js 16 是一个重要的版本更新，带来了许多令人兴奋的新特性。

## 主要更新

### 1. React 19 支持
Next.js 16 完全支持 React 19，带来了更好的并发渲染和服务器组件功能。

### 2. Turbopack 性能提升
新版本的 Turbopack 显著提升了开发服务器的启动速度和热更新性能。

### 3. 更好的类型安全
TypeScript 支持得到进一步增强，提供更准确的类型推导。

## 结论

Next.js 16 是一个稳定且功能强大的版本，值得升级。
    `,
    date: "2025-11-20",
    author: "技术博主",
    tags: ["Next.js", "React", "前端开发"],
    readTime: "5分钟",
  },
  {
    id: "2",
    title: "使用 TypeScript 构建类型安全的应用",
    slug: "typescript-type-safety",
    excerpt: "了解如何利用 TypeScript 的高级特性来构建更加安全和可维护的应用程序。",
    content: `
# 使用 TypeScript 构建类型安全的应用

TypeScript 为 JavaScript 带来了静态类型检查，让我们能够编写更安全的代码。

## 为什么选择 TypeScript？

1. **编译时错误检查** - 在代码运行前就能发现问题
2. **更好的 IDE 支持** - 智能提示和自动完成
3. **代码可维护性** - 明确的类型定义让代码更易理解

## 实践建议

- 使用严格模式
- 定义明确的接口
- 避免使用 any 类型
- 利用泛型增强代码复用性

## 总结

TypeScript 是现代 Web 开发的标准工具，值得投入时间学习。
    `,
    date: "2025-11-18",
    author: "技术博主",
    tags: ["TypeScript", "JavaScript", "编程"],
    readTime: "7分钟",
  },
  {
    id: "3",
    title: "Tailwind CSS 实用技巧",
    slug: "tailwind-css-tips",
    excerpt: "分享一些在实际项目中使用 Tailwind CSS 的实用技巧和最佳实践。",
    content: `
# Tailwind CSS 实用技巧

Tailwind CSS 是一个实用优先的 CSS 框架，可以让我们快速构建现代化的界面。

## 核心优势

### 1. 快速开发
直接在 HTML 中使用预定义的类名，无需编写自定义 CSS。

### 2. 高度可定制
通过配置文件可以完全自定义设计系统。

### 3. 响应式设计
内置的响应式修饰符让移动端适配变得简单。

## 实用技巧

- 使用 @apply 提取公共样式
- 配置自定义颜色和间距
- 利用 dark 模式支持
- 使用 JIT 模式提升性能

## 结语

Tailwind CSS 是提升开发效率的利器，推荐尝试。
    `,
    date: "2025-11-15",
    author: "技术博主",
    tags: ["CSS", "Tailwind", "前端开发", "UI"],
    readTime: "6分钟",
  },
  {
    id: "4",
    title: "构建高性能的 Web 应用",
    slug: "high-performance-web-apps",
    excerpt: "探讨如何通过各种优化技术来提升 Web 应用的性能和用户体验。",
    content: `
# 构建高性能的 Web 应用

性能优化是提升用户体验的关键因素。

## 优化策略

### 1. 代码分割
使用动态导入和路由级代码分割减少初始加载时间。

### 2. 图片优化
- 使用现代图片格式（WebP、AVIF）
- 实现懒加载
- 使用响应式图片

### 3. 缓存策略
合理使用浏览器缓存和 CDN 加速内容分发。

### 4. 减少 JavaScript 体积
- Tree shaking
- 压缩和混淆
- 使用更小的依赖库

## 性能监控

使用 Lighthouse 和 Web Vitals 持续监控性能指标。

## 总结

性能优化是一个持续的过程，需要从多个维度进行优化。
    `,
    date: "2025-11-10",
    author: "技术博主",
    tags: ["性能优化", "Web开发", "最佳实践"],
    readTime: "8分钟",
  },
];
