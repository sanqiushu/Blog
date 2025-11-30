"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // 自定义图片渲染
        img: ({ src, alt }) => {
          if (!src || typeof src !== "string") return null;
          return (
            <span className="block my-6">
              <Image
                src={src}
                alt={alt || "博客图片"}
                width={800}
                height={600}
                className="rounded-lg mx-auto max-w-full h-auto"
                style={{ objectFit: "contain" }}
                unoptimized // 外部图片不使用 Next.js 优化
              />
              {alt && (
                <span className="block text-center text-sm text-gray-500 mt-2">
                  {alt}
                </span>
              )}
            </span>
          );
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
