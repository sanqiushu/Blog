"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BlogPost } from "@/types/blog";

export default function AdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch("/api/posts?includeDrafts=true");
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("获取博客列表失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/check");
      const data = await response.json();
      
      if (!data.authenticated) {
        router.push("/login");
        return;
      }
      
      setAuthenticated(true);
      fetchPosts();
    } catch (error) {
      console.error("认证检查失败:", error);
      router.push("/login");
    }
  }, [router, fetchPosts]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("退出登录失败:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这篇博客吗？此操作不可恢复。")) {
      return;
    }

    setDeleteId(id);
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== id));
        alert("博客已成功删除");
      } else {
        const data = await response.json();
        alert(`删除失败: ${data.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("删除博客失败:", error);
      alert("删除失败，请重试");
    } finally {
      setDeleteId(null);
    }
  };

  if (!authenticated) {
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
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              博客管理
            </h1>
            <div className="flex gap-4">
              <button
                onClick={handleLogout}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                退出登录
              </button>
              <Link
                href="/admin/new"
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                + 新增博客
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-600 dark:text-gray-400">
              加载中...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center text-gray-600 dark:text-gray-400">
              暂无博客文章
            </div>
          ) : (
            <div className="overflow-x-auto overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      标题
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      作者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      日期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      标签
                    </th>
                    <th className="w-48 px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {post.excerpt?.substring(0, 50) || '暂无摘要'}...
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {post.isDraft ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            草稿
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            已发布
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        {post.author}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        {post.date}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            >
                              {tag}
                            </span>
                          ))}
                          {post.tags.length > 2 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{post.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="w-48 whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          {!post.isDraft && (
                            <Link
                              href={`/blog/${post.slug}`}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              target="_blank"
                            >
                              查看
                            </Link>
                          )}
                          <Link
                            href={`/admin/edit/${post.id}`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            编辑
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id)}
                            disabled={deleteId === post.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                          >
                            {deleteId === post.id ? "删除中..." : "删除"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
