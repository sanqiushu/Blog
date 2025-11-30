"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";

interface MarkdownRendererProps {
  content: string;
}

// 解析图片 URL，提取缩略图和原图
// 格式：xxx-thumb.jpg?sas#original=encoded_original_url
function parseImageUrl(src: string): { thumbnailUrl: string; originalUrl: string | null } {
  const hashIndex = src.indexOf('#original=');
  if (hashIndex !== -1) {
    const thumbnailUrl = src.substring(0, hashIndex);
    const originalUrl = decodeURIComponent(src.substring(hashIndex + 10));
    return { thumbnailUrl, originalUrl };
  }
  
  // 旧格式：尝试从缩略图 URL 推断原图 URL（不过 SAS Token 不同，可能无法访问）
  if (src.includes('-thumb.')) {
    return { thumbnailUrl: src, originalUrl: null };
  }
  
  return { thumbnailUrl: src, originalUrl: null };
}

// 渐进式图片组件
function ProgressiveImage({ src, alt }: { src: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // 解析 URL 获取缩略图和原图
  const { thumbnailUrl, originalUrl } = parseImageUrl(src);
  const hasOriginal = !!originalUrl;

  // 图片样式：保持原始比例，限制最大尺寸
  const imageStyle = {
    maxWidth: "100%",
    maxHeight: "80vh", // 限制最大高度，避免竖幅图片过长
    width: "auto",
    height: "auto",
  };

  // 没有原图：直接显示缩略图
  if (!hasOriginal) {
    return (
      <span className="block my-6 text-center">
        <img
          src={thumbnailUrl}
          alt={alt}
          className="rounded-lg inline-block"
          style={imageStyle}
        />
        {alt && (
          <span className="block text-center text-sm text-gray-500 mt-2">
            {alt}
          </span>
        )}
      </span>
    );
  }

  // 确定当前显示的图片 URL
  const currentSrc = isLoaded && !hasError ? originalUrl : thumbnailUrl;

  // 有原图：渐进式加载
  return (
    <span className="block my-6 text-center">
      {/* 显示当前应该展示的图片 */}
      <img
        key={currentSrc} // 强制重新渲染
        src={currentSrc}
        alt={alt}
        className="rounded-lg inline-block transition-all duration-300"
        style={{ 
          ...imageStyle,
          filter: isLoaded ? 'none' : 'blur(1px)',
        }}
      />
      
      {/* 隐藏的原图预加载 */}
      {!isLoaded && !hasError && (
        <img
          src={originalUrl}
          alt=""
          style={{ display: 'none' }}
          onLoad={() => {
            console.log('Original image loaded:', originalUrl);
            setIsLoaded(true);
          }}
          onError={(e) => {
            console.error('Original image failed to load:', originalUrl, e);
            setHasError(true);
          }}
        />
      )}
      
      {/* 加载指示器 */}
      {!isLoaded && !hasError && (
        <span className="block text-center text-xs text-gray-400 mt-1">
          正在加载高清图片...
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
