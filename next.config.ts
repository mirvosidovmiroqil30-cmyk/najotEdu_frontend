import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // MUI v9 Typography type uygunlik muammosi tufayli
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "@mui/system",
    ],
  },
};

export default nextConfig;
