import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 图片优化
  images: {
    remotePatterns: [],
    unoptimized: true,
  },

  // 外部包（原生模块）
  serverExternalPackages: ["better-sqlite3"],

  // 关闭开发模式左下角图标
  devIndicators: false,

  // 生产优化
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  // 关闭 X-Powered-By 头部
  poweredByHeader: false,

  // 静态页面过期时间（秒）
  expireTime: 3600,
};

export default nextConfig;
