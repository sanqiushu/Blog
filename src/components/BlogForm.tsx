"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BlogPost } from "@/types/blog";

// 检测是否包含中文
function hasChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str);
}

interface BlogFormProps {
  initialData?: BlogPost;
  isEdit?: boolean;
}

export default function BlogForm({ initialData, isEdit = false }: BlogFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slugWarning, setSlugWarning] = useState("");
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    author: initialData?.author || "",
    tags: initialData?.tags?.join(", ") || "",
    coverImage: initialData?.coverImage || "",
    readTime: initialData?.readTime || "",
  });

  // 检查 slug 是否包含中文
  useEffect(() => {
    if (formData.slug && hasChinese(formData.slug)) {
      setSlugWarning("⚠️ URL Slug 不能包含中文字符，提交时将自动转换为英文");
    } else {
      setSlugWarning("");
    }
  }, [formData.slug]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const postData = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        date: initialData?.date || new Date().toISOString().split("T")[0],
      };

      const url = isEdit
        ? `/api/posts/${initialData?.id}`
        : "/api/posts";
      
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        alert(isEdit ? "博客已成功更新" : "博客已成功创建");
        router.push("/admin");
        router.refresh();
      } else {
        const error = await response.json();
        alert(`操作失败: ${error.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("提交失败:", error);
      alert("提交失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm("确定要取消吗？未保存的更改将丢失。")) {
      router.push("/admin");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          标题 *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          URL Slug
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          placeholder="留空自动生成（不可包含中文）"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        {slugWarning && (
          <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
            {slugWarning}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          留空时系统会自动生成。仅支持英文字母、数字和连字符（-）
        </p>
      </div>

      <div>
        <label
          htmlFor="excerpt"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          摘要 *
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          required
          rows={3}
          value={formData.excerpt}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          内容 * (支持 Markdown)
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={15}
          value={formData.content}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="author"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            作者
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="博主"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="readTime"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            阅读时间
          </label>
          <input
            type="text"
            id="readTime"
            name="readTime"
            value={formData.readTime}
            onChange={handleChange}
            placeholder="5分钟"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          标签（用逗号分隔）
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="Next.js, React, TypeScript"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="coverImage"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          封面图片 URL
        </label>
        <input
          type="url"
          id="coverImage"
          name="coverImage"
          value={formData.coverImage}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="rounded-md border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "保存中..." : isEdit ? "更新博客" : "创建博客"}
        </button>
      </div>
    </form>
  );
}
