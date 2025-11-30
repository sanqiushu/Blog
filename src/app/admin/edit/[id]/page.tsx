"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogForm from "@/components/BlogForm";
import { BlogPost } from "@/types/blog";
import { useAuth } from "@/hooks/useAuth";

interface EditBlogPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditBlogPage({ params }: EditBlogPageProps) {
  const { authenticated, loading: authLoading } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string>("");

  useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    fetchParams();
  }, [params]);

  useEffect(() => {
    if (!id || !authenticated) return;

    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${id}`);
        if (response.ok) {
          const data = await response.json();
          setPost(data);
        } else {
          notFound();
        }
      } catch (error) {
        console.error("获取博客失败:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, authenticated]);

  if (authLoading || loading || !authenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-black">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">
            {authLoading ? "验证身份中..." : "加载中..."}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    notFound();
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
            编辑博客文章
          </h1>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
            <BlogForm initialData={post} isEdit={true} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
