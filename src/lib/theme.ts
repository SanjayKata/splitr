/** Theme settings model (light/dark mode + a selectable accent color). */

export type Mode = "light" | "dark" | "system";
export type Accent =
  | "emerald"
  | "blue"
  | "violet"
  | "rose"
  | "amber"
  | "teal"
  | "pink";

export interface ThemeSettings {
  mode: Mode;
  accent: Accent;
}

export const DEFAULT_THEME: ThemeSettings = {
  mode: "system",
  accent: "emerald",
};

export const STORAGE_KEY = "splitr-theme";

/** Accent presets, with a representative swatch color for the picker. */
export const ACCENTS: { key: Accent; label: string; swatch: string }[] = [
  { key: "emerald", label: "Emerald", swatch: "#059669" },
  { key: "blue", label: "Blue", swatch: "#2563eb" },
  { key: "violet", label: "Violet", swatch: "#7c3aed" },
  { key: "rose", label: "Rose", swatch: "#e11d48" },
  { key: "amber", label: "Amber", swatch: "#d97706" },
  { key: "teal", label: "Teal", swatch: "#0d9488" },
  { key: "pink", label: "Pink", swatch: "#db2777" },
];

/** Whether the given mode should render dark right now. */
export function isDark(mode: Mode): boolean {
  if (mode === "system") {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }
  return mode === "dark";
}

/** Apply the theme to the document (toggle .dark, set accent, recolor favicon). */
export function applyTheme(settings: ThemeSettings): void {
  const root = document.documentElement;
  root.dataset.accent = settings.accent;
  root.classList.toggle("dark", isDark(settings.mode));
  updateFavicon(settings.accent);
}

/** The Splitr mark as an SVG string, with the brand (green) half in `brand`. */
function iconSvg(brand: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs><clipPath id="r"><rect width="512" height="512" rx="112"/></clipPath></defs>
    <g clip-path="url(#r)">
      <polygon points="0,0 512,0 0,512" fill="${brand}"/>
      <polygon points="512,0 512,512 0,512" fill="#0a0a0a"/>
      <line x1="512" y1="0" x2="0" y2="512" stroke="#ffffff" stroke-width="6" stroke-opacity="0.5"/>
      <g transform="translate(95 95) scale(6.25)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01"/><path d="M18 12h.01"/>
      </g>
      <g transform="translate(266 266) scale(6.25)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </g>
    </g>
  </svg>`;
}

/** Redraw the browser-tab favicon in the current accent color. */
export function updateFavicon(accent: Accent): void {
  if (typeof document === "undefined") return;
  const brand = ACCENTS.find((a) => a.key === accent)?.swatch ?? "#059669";

  const img = new Image();
  img.onload = () => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, size, size);

    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/png";
    link.href = canvas.toDataURL("image/png");
  };
  img.src = "data:image/svg+xml," + encodeURIComponent(iconSvg(brand));
}
