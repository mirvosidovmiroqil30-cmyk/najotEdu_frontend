import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // <--- DOCKER UCHUN ENG MUHIM SOZLAMA
  experimental: {
    // MUI paketlarini tree-shake qiladi — icons-material juda katta
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "@mui/system",
      "@mui/lab",
    ],
  },
  // Webpack cache — qayta compile bo'lmasin
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: "filesystem",
      };
    }
    return config;
  },
};

export default nextConfig;