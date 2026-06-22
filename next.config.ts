import type { NextConfig } from "next";

// On GitHub Pages the site is served from https://<user>.github.io/<repo>/,
// so the app needs a basePath. The deploy workflow sets NEXT_PUBLIC_BASE_PATH
// to "/<repo>". Locally it stays empty, so the app runs at http://localhost:3000/.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export", // emit a fully static site into ./out (no server needed)
  images: { unoptimized: true }, // no image-optimization server on static hosts
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true, // GitHub Pages serves /path/ -> /path/index.html
};

export default nextConfig;
