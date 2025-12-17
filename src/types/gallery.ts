// 相册相关类型定义

export interface GalleryImage {
  id: string;
  thumbnailUrl: string;
  originalUrl: string;
  fileName: string;
  timestamp: number;
}

export interface GalleryFolder {
  id: string;
  name: string;
  cover?: string;
  images: GalleryImage[];
  createdAt: string;
  updatedAt: string;
}
