import {
  BlobSASPermissions,
  ContainerClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobServiceClient,
} from "@azure/storage-blob";
import sharp from "sharp";
import {
  AZURE_STORAGE_CONNECTION_STRING,
  IMAGES_CONTAINER_NAME,
} from "@/lib/storage/constants";

function parseConnectionString(): { accountName: string; accountKey: string } | null {
  if (!AZURE_STORAGE_CONNECTION_STRING) return null;

  const accountNameMatch = AZURE_STORAGE_CONNECTION_STRING.match(/AccountName=([^;]+)/);
  const accountKeyMatch = AZURE_STORAGE_CONNECTION_STRING.match(/AccountKey=([^;]+)/);

  if (accountNameMatch && accountKeyMatch) {
    return {
      accountName: accountNameMatch[1],
      accountKey: accountKeyMatch[1],
    };
  }
  return null;
}

async function getImagesContainer(): Promise<ContainerClient> {
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING 环境变量未设置");
  }
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(IMAGES_CONTAINER_NAME);

  await containerClient.createIfNotExists();

  return containerClient;
}

function generateSasUrl(
  blobClient: ReturnType<ContainerClient["getBlockBlobClient"]>
): string {
  const credentials = parseConnectionString();
  if (!credentials) {
    return blobClient.url;
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(
    credentials.accountName,
    credentials.accountKey
  );

  const expiresOn = new Date();
  expiresOn.setFullYear(expiresOn.getFullYear() + 10);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: IMAGES_CONTAINER_NAME,
      blobName: blobClient.name,
      permissions: BlobSASPermissions.parse("r"),
      expiresOn,
    },
    sharedKeyCredential
  ).toString();

  return `${blobClient.url}?${sasToken}`;
}

function generateImageName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  return `${timestamp}-${random}.${ext}`;
}

const IMAGE_SIZES = {
  original: { width: 1920, quality: 100 },
  thumbnail: { width: 800, quality: 80 },
};

async function compressImage(
  buffer: Buffer,
  maxWidth: number,
  quality: number
): Promise<Buffer> {
  try {
    const image = sharp(buffer).rotate();
    const metadata = await image.metadata();

    const isRotated = metadata.orientation && metadata.orientation >= 5;
    const actualWidth = isRotated ? metadata.height : metadata.width;

    const needsResize = actualWidth && actualWidth > maxWidth;

    let pipeline = image;

    if (needsResize) {
      pipeline = pipeline.resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: "inside",
      });
    }

    if (metadata.format === "png") {
      return await pipeline.png({ quality, compressionLevel: 9 }).toBuffer();
    } else if (metadata.format === "webp") {
      return await pipeline.webp({ quality }).toBuffer();
    } else if (metadata.format === "gif") {
      return buffer;
    } else {
      return await pipeline.jpeg({ quality, progressive: true }).toBuffer();
    }
  } catch (error) {
    console.error("图片压缩失败，使用原图:", error);
    return buffer;
  }
}

export async function uploadImage(
  file: Buffer,
  originalName: string,
  contentType: string
): Promise<{ thumbnailUrl: string; originalUrl: string }> {
  const containerClient = await getImagesContainer();
  const baseName = generateImageName(originalName);
  const ext = baseName.split(".").pop() || "jpg";
  const nameWithoutExt = baseName.replace(`.${ext}`, "");

  const thumbnailBuffer = await compressImage(
    file,
    IMAGE_SIZES.thumbnail.width,
    IMAGE_SIZES.thumbnail.quality
  );
  const thumbnailName = `${nameWithoutExt}-thumb.${ext}`;
  const thumbnailBlobClient = containerClient.getBlockBlobClient(thumbnailName);

  await thumbnailBlobClient.uploadData(thumbnailBuffer, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: "public, max-age=31536000",
    },
  });

  // 修改：直接上传原图，不进行压缩和调整大小，确保下载的是原始文件
  // const originalBuffer = await compressImage(
  //   file,
  //   IMAGE_SIZES.original.width,
  //   IMAGE_SIZES.original.quality
  // );
  const originalBlobClient = containerClient.getBlockBlobClient(baseName);

  await originalBlobClient.uploadData(file, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: "public, max-age=31536000",
    },
  });

  return {
    thumbnailUrl: generateSasUrl(thumbnailBlobClient),
    originalUrl: generateSasUrl(originalBlobClient),
  };
}

function deriveOriginalAndThumbnailNames(imageName: string): {
  originalName: string;
  thumbnailName: string;
} {
  let originalName = imageName;
  let thumbnailName = imageName;

  if (imageName.includes("-thumb.")) {
    originalName = imageName.replace("-thumb.", ".");
  } else {
    const ext = imageName.split(".").pop();
    if (ext) {
      const nameWithoutExt = imageName.substring(0, imageName.lastIndexOf("."));
      thumbnailName = `${nameWithoutExt}-thumb.${ext}`;
    }
  }

  return { originalName, thumbnailName };
}

export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    const containerClient = await getImagesContainer();
    const urlWithoutQuery = imageUrl.split("?")[0];
    const imageName = urlWithoutQuery.split("/").pop();
    if (!imageName) return;

    const { originalName, thumbnailName } = deriveOriginalAndThumbnailNames(imageName);

    const thumbBlobClient = containerClient.getBlockBlobClient(thumbnailName);
    await thumbBlobClient.deleteIfExists();

    const originalBlobClient = containerClient.getBlockBlobClient(originalName);
    await originalBlobClient.deleteIfExists();
  } catch (error) {
    console.error("删除图片失败:", error);
  }
}

export async function listImages(): Promise<string[]> {
  try {
    const containerClient = await getImagesContainer();
    const images: string[] = [];

    for await (const blob of containerClient.listBlobsFlat()) {
      const blobClient = containerClient.getBlobClient(blob.name);
      images.push(blobClient.url);
    }

    return images;
  } catch (error) {
    console.error("获取图片列表失败:", error);
    return [];
  }
}
