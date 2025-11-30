/**
 * Slug 生成工具
 * 用于将中文标题转换为 URL 友好的 slug
 */

/**
 * 检测字符串是否包含中文字符
 */
export function hasChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/.test(str);
}

/**
 * 生成 URL 友好的 slug
 * @param title - 博客标题
 * @param id - 博客 ID（可选，用于生成唯一 slug）
 * @returns 生成的 slug
 */
export function generateSlug(title: string, id?: string): string {
  // 如果标题包含中文，使用 ID 或时间戳生成 slug
  if (hasChinese(title)) {
    if (id) {
      return `post-${id}`;
    }
    // 使用时间戳确保唯一性
    return `post-${Date.now()}`;
  }
  
  // 英文标题：转换为 URL 友好格式
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-')      // 空格转为连字符
    .replace(/--+/g, '-')      // 多个连字符合并为一个
    .replace(/^-+|-+$/g, '');  // 移除首尾连字符
}

/**
 * 验证 slug 是否有效（不包含中文）
 */
export function isValidSlug(slug: string): boolean {
  return !hasChinese(slug) && /^[a-z0-9-]+$/.test(slug);
}

/**
 * 清理 slug（如果包含中文则生成新的）
 */
export function sanitizeSlug(slug: string, title: string, id?: string): string {
  if (isValidSlug(slug)) {
    return slug;
  }
  return generateSlug(title, id);
}
