import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  // Увеличиваем лимиты для больших файлов
  experimental: {
    serverComponentsExternalPackages: [],
    // Увеличиваем лимит для всех API routes
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default nextConfig;
