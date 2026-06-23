import type { MetadataRoute } from "next";

// On GitHub Pages the app is served under /<repo>, so start_url/scope/icons
// must include the basePath. Next emits this as /manifest.webmanifest and adds
// the <link rel="manifest"> automatically.
// Required for `output: export` (the manifest is emitted as a static file).
export const dynamic = "force-static";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Splitr — split expenses",
    short_name: "Splitr",
    description:
      "Split expenses with friends and family, see who owes whom, and settle up.",
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#059669",
    icons: [
      {
        src: `${basePath}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${basePath}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${basePath}/icons/maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
