import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
     // 新的 PPR 配置方式
  },
  cacheComponents: true,
  // 允许开发环境的跨域请求
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.2.33:3000',
    'https://localhost:3000',
    'https://127.0.0.1:3000',
    'https://192.168.2.33:3000',
  ],
  // 路径别名配置 (在 tsconfig.json 中已配置)
};

export default nextConfig;
