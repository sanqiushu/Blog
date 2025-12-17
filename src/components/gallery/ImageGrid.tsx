"use client";

import { GalleryImage } from "@/types/gallery";
import ImageCard from "./ImageCard";

interface ImageGridProps {
  images: GalleryImage[];
  coverId?: string;
  isAdmin: boolean;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  deletingId: string | null;
  isReordering: boolean;
  onImageClick: (index: number) => void;
  onSetCover: (imageId: string) => void;
  onDelete: (imageId: string) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export default function ImageGrid({
  images,
  coverId,
  isAdmin,
  draggedIndex,
  dragOverIndex,
  deletingId,
  isReordering,
  onImageClick,
  onSetCover,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
}: ImageGridProps) {
  if (images.length === 0) {
    return (
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
    );
  }

  return (
    <>
      {/* 管理员拖拽提示 */}
      {isAdmin && images.length > 1 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span>拖拽图片可调整顺序</span>
          {isReordering && (
            <span className="ml-2 flex items-center gap-1 text-blue-500">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              保存中...
            </span>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <ImageCard
            key={image.id}
            image={image}
            index={index}
            isCover={coverId === image.id}
            isAdmin={isAdmin}
            isDragging={draggedIndex === index}
            isDragOver={dragOverIndex === index}
            isDeleting={deletingId === image.id}
            onImageClick={() => onImageClick(index)}
            onSetCover={() => onSetCover(image.id)}
            onDelete={() => onDelete(image.id)}
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragLeave={onDragLeave}
            onDragEnd={onDragEnd}
            onDrop={(e) => onDrop(e, index)}
          />
        ))}
      </div>
    </>
  );
}
