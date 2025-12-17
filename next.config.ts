import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // 优化客户端导航
  experimental: {
    // 启用 PPR (Partial Prerendering) 如果需要
    // ppr: true,
  },
  // 图片优化
  images: {
    // 减少图片处理的内存使用
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
