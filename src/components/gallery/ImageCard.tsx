"use client";

import { GalleryImage } from "@/types/gallery";
import ProgressiveImage from "./ProgressiveImage";

interface ImageCardProps {
  image: GalleryImage;
  index: number;
  isCover: boolean;
  isAdmin: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  isDeleting: boolean;
  onImageClick: () => void;
  onSetCover: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export default function ImageCard({
  image,
  isCover,
  isAdmin,
  isDragging,
  isDragOver,
  isDeleting,
  onImageClick,
  onSetCover,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
}: ImageCardProps) {
  return (
    <div
      className={`group relative aspect-square overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800 transition-all duration-200 ${
        isAdmin ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${
        isDragOver && !isDragging 
          ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-black scale-105' 
          : ''
      }`}
      draggable={isAdmin}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    >
      <ProgressiveImage 
        image={image} 
        onClick={onImageClick}
        isDragging={isDragging}
      />
      
      {/* 封面标记 */}
      {isCover && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
          封面
        </div>
      )}
      
      {/* 拖拽指示器 */}
      {isAdmin && (
        <div className="absolute bottom-2 left-2 p-1 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      )}
      
      {/* 悬停遮罩 */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />
      
      {/* 操作按钮 */}
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isCover && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetCover();
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
              onDelete();
            }}
            disabled={isDeleting}
            className="p-1.5 rounded-full bg-black/50 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            title="删除图片"
          >
            {isDeleting ? (
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
  );
}
