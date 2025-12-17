"use client";

import { useState } from "react";
import { GalleryImage } from "@/types/gallery";

interface ProgressiveImageProps {
  image: GalleryImage;
  onClick: () => void;
  isDragging?: boolean;
}

// 渐进式加载的图片组件
export default function ProgressiveImage({ 
  image, 
  onClick,
  isDragging,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      <img
        src={isLoaded ? image.originalUrl : image.thumbnailUrl}
        alt={image.fileName}
        className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 cursor-pointer ${
          isLoaded ? '' : 'blur-[1px]'
        } ${isDragging ? 'opacity-50' : ''}`}
        loading="lazy"
        onClick={onClick}
        draggable={false}
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
