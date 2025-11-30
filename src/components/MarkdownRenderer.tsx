"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";

interface MarkdownRendererProps {
  content: string;
}

// 从缩略图 URL 获取原图 URL
function getOriginalImageUrl(thumbnailUrl: string): string {
  // 缩略图格式: xxx-thumb.jpg?sas_token
  // 原图格式: xxx.jpg?sas_token
  const [urlPart, queryPart] = thumbnailUrl.split('?');
  const originalUrl = urlPart.replace('-thumb.', '.');
  return queryPart ? `${originalUrl}?${queryPart}` : originalUrl;
}

// 检查是否是缩略图 URL
function isThumbnailUrl(url: string): boolean {
  return url.includes('-thumb.');
}

// 渐进式图片组件
function ProgressiveImage({ src, alt }: { src: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // 如果是缩略图，准备原图 URL
  const isThumb = isThumbnailUrl(src);
  const originalSrc = isThumb ? getOriginalImageUrl(src) : src;
  const thumbnailSrc = src;

  return (
    <span className="block my-6 relative">
      {/* 缩略图（模糊背景） */}
      {isThumb && !hasError && (
        <img
          src={thumbnailSrc}
          alt={alt}
          className={`rounded-lg mx-auto max-w-full h-auto transition-opacity duration-300 ${
            isLoaded ? 'opacity-0 absolute inset-0' : 'opacity-100'
          }`}
          style={{ 
            objectFit: "contain",
            filter: isLoaded ? 'none' : 'blur(2px)',
          }}
        />
      )}
      
      {/* 原图（高清） */}
      <img
        src={isThumb ? originalSrc : src}
        alt={alt}
        className={`rounded-lg mx-auto max-w-full h-auto transition-opacity duration-500 ${
          isThumb && !isLoaded ? 'opacity-0 absolute inset-0' : 'opacity-100'
        }`}
        style={{ objectFit: "contain" }}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true); // 加载失败时显示缩略图
        }}
      />
      
      {/* 加载指示器 */}
      {isThumb && !isLoaded && !hasError && (
        <span className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
          加载高清图...
        </span>
      )}
      
      {/* 图片说明 */}
      {alt && (
        <span className="block text-center text-sm text-gray-500 mt-2">
          {alt}
        </span>
      )}
    </span>
  );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // 自定义图片渲染 - 使用渐进式加载
        img: ({ src, alt }) => {
          if (!src || typeof src !== "string") return null;
          return <ProgressiveImage src={src} alt={alt || "博客图片"} />;
        },
        // 自定义链接
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            {children}
          </a>
        ),
        // 自定义代码块
        code: ({ className, children }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            );
          }
          return (
            <code className={`${className} block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono`}>
              {children}
            </code>
          );
        },
        // 自定义段落
        p: ({ children }) => (
          <p className="mb-4 leading-relaxed">{children}</p>
        ),
        // 自定义标题
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-bold mt-5 mb-2">{children}</h3>
        ),
        // 自定义列表
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
        ),
        // 自定义引用块
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-gray-600 dark:text-gray-400">
            {children}
          </blockquote>
        ),
        // 自定义水平线
        hr: () => (
          <hr className="my-8 border-gray-200 dark:border-gray-700" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
