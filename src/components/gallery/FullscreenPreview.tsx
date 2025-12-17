"use client";

import { useState, useEffect, useCallback } from "react";
import { GalleryImage } from "@/types/gallery";

interface FullscreenPreviewProps {
  images: GalleryImage[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

// 全屏预览组件
export default function FullscreenPreview({ 
  images,
  currentIndex,
  onClose,
  onNavigate
}: FullscreenPreviewProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const image = images[currentIndex];
  
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) {
      setIsLoaded(false);
      onNavigate(currentIndex - 1);
    }
  }, [hasPrev, currentIndex, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) {
      setIsLoaded(false);
      onNavigate(currentIndex + 1);
    }
  }, [hasNext, currentIndex, onNavigate]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext, onClose]);

  // 点击图片左右侧切换
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const imageWidth = rect.width;
    
    if (clickX < imageWidth / 2) {
      goPrev();
    } else {
      goNext();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
        onClick={onClose}
      >
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 上一张按钮 */}
      {hasPrev && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all z-10"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 下一张按钮 */}
      {hasNext && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-all z-10"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
      
      {/* 图片 */}
      <img
        src={isLoaded ? image.originalUrl : image.thumbnailUrl}
        alt="预览"
        className={`max-h-[90vh] max-w-[90vw] object-contain transition-all duration-300 cursor-pointer ${
          isLoaded ? '' : 'blur-sm'
        }`}
        onClick={handleImageClick}
      />
      
      {/* 加载提示 */}
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

      {/* 图片计数器 */}
      <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 rounded-full text-white/70 text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
