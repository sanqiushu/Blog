"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface GalleryImage {
  id: string;
  thumbnailUrl: string;
  originalUrl: string;
  fileName: string;
  timestamp: number;
}

interface GalleryFolder {
  id: string;
  name: string;
  cover?: string;
  images: GalleryImage[];
  createdAt: string;
  updatedAt: string;
}

// 渐进式加载的图片组件
function ProgressiveImage({ 
  image, 
  onClick 
}: { 
  image: GalleryImage; 
  onClick: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      <img
        src={isLoaded ? image.originalUrl : image.thumbnailUrl}
        alt={image.fileName}
        className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 cursor-pointer ${
          isLoaded ? '' : 'blur-[1px]'
        }`}
        loading="lazy"
        onClick={onClick}
      />
      {!isLoaded && (
        <img
          src={image.originalUrl}
          alt=""
          className="hidden"
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </>
  );
}

// 全屏预览组件
function FullscreenPreview({ 
  image, 
  onClose 
}: { 
  image: GalleryImage; 
  onClose: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
        onClick={onClose}
      >
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <img
        src={isLoaded ? image.originalUrl : image.thumbnailUrl}
        alt="预览"
        className={`max-h-[90vh] max-w-[90vw] object-contain transition-all duration-300 ${
          isLoaded ? '' : 'blur-sm'
        }`}
        onClick={(e) => e.stopPropagation()}
      />
      
      {!isLoaded && (
        <>
          <img
            src={image.originalUrl}
            alt=""
            className="hidden"
            onLoad={() => setIsLoaded(true)}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            正在加载高清图片...
          </div>
        </>
      )}
    </div>
  );
}

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;
  
  const [folder, setFolder] = useState<GalleryFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (selectedImage?.id === imageId) {
          setSelectedImage(null);
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {folder.name}
            </h1>
            
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
          
          {folder.images.length === 0 ? (
            <div className="text-center py-20">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                相册还没有图片
              </p>
              {isAdmin && (
                <p className="mt-2 text-sm text-gray-400">
                  点击上方「上传图片」按钮添加图片
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {folder.images.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800"
                >
                  <ProgressiveImage 
                    image={image} 
                    onClick={() => setSelectedImage(image)} 
                  />
                  
                  {/* 封面标记 */}
                  {folder.cover === image.id && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
                      封面
                    </div>
                  )}
                  
                  {/* 悬停遮罩 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />
                  
                  {/* 操作按钮 */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {folder.cover !== image.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetCover(image.id);
                          }}
                          className="p-1.5 rounded-full bg-black/50 text-white hover:bg-blue-600 transition-colors"
                          title="设为封面"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image.id);
                        }}
                        disabled={deleting === image.id}
                        className="p-1.5 rounded-full bg-black/50 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                        title="删除图片"
                      >
                        {deleting === image.id ? (
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      {/* 图片预览模态框 */}
      {selectedImage && (
        <FullscreenPreview 
          image={selectedImage} 
          onClose={() => setSelectedImage(null)} 
        />
      )}
    </div>
  );
}
