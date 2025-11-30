"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogForm from "@/components/BlogForm";
import { useAuth } from "@/hooks/useAuth";

export default function NewBlogPage() {
  const { authenticated, loading } = useAuth();

  if (loading || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-black">
        <div className="text-gray-600 dark:text-gray-400">验证身份中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-black">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <Link
            href="/admin"
            className="mb-8 inline-flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← 返回管理页面
          </Link>

          <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
            新增博客文章
          </h1>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
            <BlogForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
