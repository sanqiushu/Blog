"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FullscreenPreview, ImageGrid } from "@/components/gallery";
import { GalleryFolder } from "@/types/gallery";

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;
  
  const [folder, setFolder] = useState<GalleryFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 拖拽相关状态
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  
  // 重命名相关状态
  const [isRenaming, setIsRenaming] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // 加载文件夹
  const loadFolder = useCallback(async () => {
    try {
      const response = await fetch(`/api/gallery/${folderId}`);
      if (response.ok) {
        const data = await response.json();
        setFolder(data.folder);
      } else if (response.status === 404) {
        router.push("/gallery");
      }
    } catch (error) {
      console.error("加载相册失败:", error);
    } finally {
      setLoading(false);
    }
  }, [folderId, router]);

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
    loadFolder();
  }, [loadFolder]);

  // 上传图片
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;

        const formData = new FormData();
        formData.append("file", file);

        await fetch(`/api/gallery/${folderId}`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
      }
      await loadFolder();
    } catch (error) {
      console.error("上传失败:", error);
      alert("上传失败，请重试");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 删除图片
  const handleDelete = async (imageId: string) => {
    if (!confirm("确定要删除这张图片吗？")) return;

    setDeleting(imageId);
    try {
      const response = await fetch(`/api/gallery/${folderId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
        credentials: "include",
      });

      if (response.ok) {
        await loadFolder();
        // 如果删除的是当前预览的图片，关闭预览
        const currentImage = folder?.images[selectedImageIndex ?? -1];
        if (currentImage?.id === imageId) {
          setSelectedImageIndex(null);
        }
      } else {
        const data = await response.json();
        alert(`删除失败: ${data.error}`);
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败，请重试");
    } finally {
      setDeleting(null);
    }
  };

  // 设置封面
  const handleSetCover = async (imageId: string) => {
    try {
      const response = await fetch(`/api/gallery/${folderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setCover", imageId }),
        credentials: "include",
      });

      if (response.ok) {
        await loadFolder();
      }
    } catch (error) {
      console.error("设置封面失败:", error);
    }
  };

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isAdmin) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  // 拖拽经过
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!isAdmin || draggedIndex === null) return;
    e.dataTransfer.dropEffect = 'move';
    if (index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  };

  // 拖拽离开
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 放置图片
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!isAdmin || draggedIndex === null || !folder) return;
    
    if (draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // 创建新的图片顺序
    const newImages = [...folder.images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // 立即更新本地状态以获得流畅的用户体验
    setFolder({ ...folder, images: newImages });
    setDraggedIndex(null);
    setDragOverIndex(null);

    // 保存新顺序到服务器
    setIsReordering(true);
    try {
      const imageIds = newImages.map(img => img.id);
      const response = await fetch(`/api/gallery/${folderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", imageIds }),
        credentials: "include",
      });

      if (!response.ok) {
        // 如果保存失败，恢复原来的顺序
        await loadFolder();
        console.error("保存顺序失败");
      }
    } catch (error) {
      console.error("保存顺序失败:", error);
      await loadFolder();
    } finally {
      setIsReordering(false);
    }
  };

  // 重命名文件夹
  const handleRename = async () => {
    if (!newFolderName.trim() || !folder) return;
    
    try {
      const response = await fetch(`/api/gallery/${folderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", newName: newFolderName.trim() }),
        credentials: "include",
      });

      if (response.ok) {
        setFolder({ ...folder, name: newFolderName.trim() });
        setIsRenaming(false);
        setNewFolderName("");
      } else {
        const data = await response.json();
        alert(`重命名失败: ${data.error}`);
      }
    } catch (error) {
      console.error("重命名失败:", error);
      alert("重命名失败，请重试");
    }
  };

  // 开始重命名
  const startRenaming = () => {
    if (folder) {
      setNewFolderName(folder.name);
      setIsRenaming(true);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-black">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">加载中...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!folder) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-black">
      <Header />
      
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-12">
          {/* 返回链接和标题 */}
          <nav className="mb-6">
            <Link
              href="/gallery"
              className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <svg 
                className="h-4 w-4 transition-transform group-hover:-translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回相册
            </Link>
          </nav>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename();
                      if (e.key === "Escape") {
                        setIsRenaming(false);
                        setNewFolderName("");
                      }
                    }}
                    className="text-2xl font-bold px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleRename}
                    className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    title="保存"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setIsRenaming(false);
                      setNewFolderName("");
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    title="取消"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    {folder.name}
                  </h1>
                  {isAdmin && (
                    <button
                      onClick={startRenaming}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      title="重命名相册"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
            
            {isAdmin && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {uploading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      上传中...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      上传图片
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
          <ImageGrid
            images={folder.images}
            coverId={folder.cover}
            isAdmin={isAdmin}
            draggedIndex={draggedIndex}
            dragOverIndex={dragOverIndex}
            deletingId={deleting}
            isReordering={isReordering}
            onImageClick={setSelectedImageIndex}
            onSetCover={handleSetCover}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        </div>
      </main>
      
      <Footer />
      
      {/* 图片预览模态框 */}
      {selectedImageIndex !== null && folder && (
        <FullscreenPreview 
          images={folder.images}
          currentIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
          onNavigate={setSelectedImageIndex}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
