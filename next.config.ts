import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    cacheComponents: true,  // 新的 PPR 配置方式
  },
  // 路径别名配置 (在 tsconfig.json 中已配置)
};

export default nextConfig;
