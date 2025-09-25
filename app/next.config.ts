import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Отключаем проверку типов для хакатона
    ignoreBuildErrors: true,
  },
  eslint: {
    // Отключаем ESLint для хакатона
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
