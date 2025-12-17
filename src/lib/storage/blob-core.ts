import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import {
  AZURE_STORAGE_CONNECTION_STRING,
  CONTAINER_NAME,
} from "@/lib/storage/constants";

export function getContainerClient(): ContainerClient {
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING 环境变量未设置");
  }
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
  return blobServiceClient.getContainerClient(CONTAINER_NAME);
}

export async function ensureContainer(): Promise<ContainerClient> {
  const containerClient = getContainerClient();
  await containerClient.createIfNotExists();
  return containerClient;
}

export async function streamToBuffer(
  readableStream: NodeJS.ReadableStream
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data: Buffer) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on("error", reject);
  });
}
