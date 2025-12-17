import { ensureContainer, streamToBuffer } from "@/lib/storage/blob-core";
import { deleteImage } from "@/lib/storage/images";
import { uploadImage } from "@/lib/storage/images";
import { GALLERY_BLOB_NAME } from "@/lib/storage/constants";

// 相册图片信息
export interface GalleryImage {
  id: string;
  thumbnailUrl: string;
  originalUrl: string;
  fileName: string;
  timestamp: number;
}

// 相册文件夹
export interface GalleryFolder {
  id: string;
  name: string;
  cover?: string;
  images: GalleryImage[];
  createdAt: string;
  updatedAt: string;
}

// 相册数据结构
export interface GalleryData {
  folders: GalleryFolder[];
}

export async function readGalleryData(): Promise<GalleryData> {
  try {
    const containerClient = await ensureContainer();
    const blobClient = containerClient.getBlobClient(GALLERY_BLOB_NAME);
    const blockBlobClient = blobClient.getBlockBlobClient();

    const exists = await blobClient.exists();
    if (!exists) {
      const initialData: GalleryData = { folders: [] };
      await blockBlobClient.upload(
        JSON.stringify(initialData, null, 2),
        Buffer.byteLength(JSON.stringify(initialData, null, 2))
      );
      return initialData;
    }

    const downloadResponse = await blockBlobClient.download(0);
    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);
    return JSON.parse(downloaded.toString("utf-8"));
  } catch (error) {
    console.error("读取相册数据失败:", error);
    return { folders: [] };
  }
}

export async function writeGalleryData(data: GalleryData): Promise<void> {
  try {
    const containerClient = await ensureContainer();
    const blockBlobClient = containerClient.getBlockBlobClient(GALLERY_BLOB_NAME);
    const jsonData = JSON.stringify(data, null, 2);

    await blockBlobClient.uploadData(Buffer.from(jsonData, "utf-8"), {
      blobHTTPHeaders: { blobContentType: "application/json" },
    });
  } catch (error) {
    console.error("保存相册数据失败:", error);
    throw error;
  }
}

export async function createGalleryFolder(name: string): Promise<GalleryFolder> {
  const data = await readGalleryData();

  const folder: GalleryFolder = {
    id: `folder-${Date.now()}`,
    name,
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.folders.push(folder);
  await writeGalleryData(data);

  return folder;
}

export async function deleteGalleryFolder(folderId: string): Promise<void> {
  const data = await readGalleryData();
  const folder = data.folders.find((f) => f.id === folderId);

  if (folder) {
    for (const image of folder.images) {
      try {
        await deleteImage(image.originalUrl);
      } catch (e) {
        console.error("删除图片失败:", e);
      }
    }

    data.folders = data.folders.filter((f) => f.id !== folderId);
    await writeGalleryData(data);
  }
}

export async function renameGalleryFolder(
  folderId: string,
  newName: string
): Promise<void> {
  const data = await readGalleryData();
  const folder = data.folders.find((f) => f.id === folderId);

  if (folder) {
    folder.name = newName;
    folder.updatedAt = new Date().toISOString();
    await writeGalleryData(data);
  }
}

export async function uploadImageToFolder(
  folderId: string,
  file: Buffer,
  originalName: string,
  contentType: string
): Promise<GalleryImage> {
  const { thumbnailUrl, originalUrl } = await uploadImage(file, originalName, contentType);

  const image: GalleryImage = {
    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    thumbnailUrl,
    originalUrl,
    fileName: originalName,
    timestamp: Date.now(),
  };

  const data = await readGalleryData();
  const folder = data.folders.find((f) => f.id === folderId);

  if (folder) {
    folder.images.push(image);
    folder.updatedAt = new Date().toISOString();

    if (!folder.cover) {
      folder.cover = image.id;
    }

    await writeGalleryData(data);
  }

  return image;
}

export async function deleteImageFromFolder(
  folderId: string,
  imageId: string
): Promise<void> {
  const data = await readGalleryData();
  const folder = data.folders.find((f) => f.id === folderId);

  if (folder) {
    const image = folder.images.find((img) => img.id === imageId);

    if (image) {
      await deleteImage(image.originalUrl);

      folder.images = folder.images.filter((img) => img.id !== imageId);

      if (folder.cover === imageId) {
        folder.cover = folder.images[0]?.id;
      }

      folder.updatedAt = new Date().toISOString();
      await writeGalleryData(data);
    }
  }
}

export async function setFolderCover(
  folderId: string,
  imageId: string
): Promise<void> {
  const data = await readGalleryData();
  const folder = data.folders.find((f) => f.id === folderId);

  if (folder && folder.images.some((img) => img.id === imageId)) {
    folder.cover = imageId;
    folder.updatedAt = new Date().toISOString();
    await writeGalleryData(data);
  }
}

export async function getGalleryFolders(): Promise<
  (GalleryFolder & { coverImage?: GalleryImage })[]
> {
  const data = await readGalleryData();

  return data.folders.map((folder) => {
    const coverImage = folder.cover
      ? folder.images.find((img) => img.id === folder.cover)
      : folder.images[0];

    return {
      ...folder,
      coverImage,
    };
  });
}

export async function getGalleryFolder(
  folderId: string
): Promise<GalleryFolder | null> {
  const data = await readGalleryData();
  return data.folders.find((f) => f.id === folderId) || null;
}
