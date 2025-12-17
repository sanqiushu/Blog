export const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

export const CONTAINER_NAME = "blog-data";
export const IMAGES_CONTAINER_NAME = "blog-images";

export const POSTS_BLOB_NAME = "posts.json";
export const GALLERY_BLOB_NAME = "gallery.json";
export const ABOUT_BLOB_NAME = "about.json";

if (!AZURE_STORAGE_CONNECTION_STRING) {
  console.warn("⚠️ AZURE_STORAGE_CONNECTION_STRING 未设置");
}
