// Generate PWA icons (run once, output committed to public/icons/).
//   node scripts/generate-icons.mjs
//
// Design: a square split by the B→C diagonal into two triangles.
//   - triangle B-A-C (top-left, green)  → banknote  = money / expenses
//   - triangle B-D-C (bottom-right, black) → people  = members
// (A=top-left, B=top-right, C=bottom-left, D=bottom-right)
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const outDir = fileURLToPath(new URL("../public/icons/", import.meta.url));
mkdirSync(outDir, { recursive: true });

const GREEN = "#059669";
const BLACK = "#0a0a0a";

// Lucide-style line icons (24x24), placed at each triangle's centroid (scale 6.25).
const note = `
  <g transform="translate(95,95) scale(6.25)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <circle cx="12" cy="12" r="2"/>
    <path d="M6 12h.01"/><path d="M18 12h.01"/>
  </g>`;

const people = `
  <g transform="translate(266,266) scale(6.25)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </g>`;

const svg = (
  rx,
) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><clipPath id="round"><rect width="512" height="512" rx="${rx}"/></clipPath></defs>
  <g clip-path="url(#round)">
    <polygon points="0,0 512,0 0,512" fill="${GREEN}"/>
    <polygon points="512,0 512,512 0,512" fill="${BLACK}"/>
    <line x1="512" y1="0" x2="0" y2="512" stroke="#ffffff" stroke-width="6" stroke-opacity="0.5"/>
    ${note}
    ${people}
  </g>
</svg>`;

await sharp(Buffer.from(svg(112)))
  .resize(512, 512)
  .png()
  .toFile(outDir + "icon-512.png");
await sharp(Buffer.from(svg(112)))
  .resize(192, 192)
  .png()
  .toFile(outDir + "icon-192.png");
await sharp(Buffer.from(svg(0)))
  .resize(512, 512)
  .png()
  .toFile(outDir + "maskable-512.png");

console.log("Icons written to public/icons/");
