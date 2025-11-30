"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AdminActionsProps {
  postId: string;
  postSlug: string;
}

export default function AdminActions({ postId, postSlug }: AdminActionsProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 检查是否已登录
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/check");
        const data = await response.json();
        setIsAdmin(data.authenticated);
      } catch {
        setIsAdmin(false);
      }
    }
    checkAuth();
  }, []);

  // 删除文章
  const handleDelete = async () => {
    if (!confirm("确定要删除这篇博客吗？此操作不可恢复。")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("博客已成功删除");
        router.push("/");
        router.refresh();
      } else {
        const data = await response.json();
        alert(`删除失败: ${data.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败，请重试");
    } finally {
      setDeleting(false);
    }
  };

  // 未登录不显示
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/admin/edit/${postId}?from=${encodeURIComponent(`/blog/${postSlug}`)}`}
        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        编辑
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        {deleting ? "删除中..." : "删除"}
      </button>
    </div>
  );
}
