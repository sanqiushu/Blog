import { BlogPost } from "@/types/blog";
import { ensureContainer, streamToBuffer } from "@/lib/storage/blob-core";
import { POSTS_BLOB_NAME, IMAGES_CONTAINER_NAME } from "@/lib/storage/constants";
import { deleteImage } from "@/lib/storage/images";

function generateId(posts: BlogPost[]): string {
  const maxId =
    posts.length > 0
      ? Math.max(...posts.map((p) => parseInt(p.id) || 0))
      : 0;
  return (maxId + 1).toString();
}

export async function readPosts(): Promise<BlogPost[]> {
  try {
    const containerClient = await ensureContainer();
    const blobClient = containerClient.getBlobClient(POSTS_BLOB_NAME);
    const blockBlobClient = blobClient.getBlockBlobClient();

    const exists = await blobClient.exists();
    if (!exists) {
      const initialData: BlogPost[] = [];
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
    console.error("读取博客数据失败:", error);
    return [];
  }
}

export async function writePosts(posts: BlogPost[]): Promise<void> {
  try {
    const containerClient = await ensureContainer();
    const blockBlobClient = containerClient.getBlockBlobClient(POSTS_BLOB_NAME);
    const data = JSON.stringify(posts, null, 2);

    await blockBlobClient.uploadData(Buffer.from(data, "utf-8"), {
      blobHTTPHeaders: { blobContentType: "application/json" },
    });
  } catch (error) {
    console.error("写入博客数据失败:", error);
    throw error;
  }
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const posts = await readPosts();
  return posts.find((p) => p.id === id) || null;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await readPosts();
  return posts.find((p) => p.slug === slug) || null;
}

export async function createPost(
  postData: Omit<BlogPost, "id">
): Promise<BlogPost> {
  const posts = await readPosts();
  const newPost: BlogPost = {
    id: generateId(posts),
    ...postData,
  };
  posts.push(newPost);
  await writePosts(posts);
  return newPost;
}

export async function updatePost(
  id: string,
  postData: Partial<BlogPost>
): Promise<BlogPost | null> {
  const posts = await readPosts();
  const index = posts.findIndex((p) => p.id === id);

  if (index === -1) return null;

  posts[index] = {
    ...posts[index],
    ...postData,
    id,
  };

  await writePosts(posts);
  return posts[index];
}

function extractImageUrls(content: string): string[] {
  const urls: string[] = [];

  const markdownRegex = /!\[.*?\]\((.*?)\)/g;
  let match: RegExpExecArray | null;
  while ((match = markdownRegex.exec(content)) !== null) {
    if (match[1]) urls.push(match[1]);
  }

  const htmlRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
  while ((match = htmlRegex.exec(content)) !== null) {
    if (match[1]) urls.push(match[1]);
  }

  return urls;
}

export async function deletePost(id: string): Promise<BlogPost | null> {
  const posts = await readPosts();
  const index = posts.findIndex((p) => p.id === id);

  if (index === -1) return null;

  const postToDelete = posts[index];

  if (
    postToDelete.coverImage &&
    postToDelete.coverImage.includes(IMAGES_CONTAINER_NAME)
  ) {
    await deleteImage(postToDelete.coverImage);
  }

  if (postToDelete.content) {
    const imageUrls = extractImageUrls(postToDelete.content);
    for (const url of imageUrls) {
      if (url.includes(IMAGES_CONTAINER_NAME)) {
        await deleteImage(url);
      }
    }
  }

  const deletedPost = posts.splice(index, 1)[0];
  await writePosts(posts);
  return deletedPost;
}
