import type { NextConfig } from "next";
import path from "node:path";
const projectRoot=path.resolve(__dirname);
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: projectRoot,
  turbopack: {root: projectRoot},
};
export default nextConfig;
