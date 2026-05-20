import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@mylife/db', '@mylife/ui', '@mylife/validators'],
};

export default nextConfig;
