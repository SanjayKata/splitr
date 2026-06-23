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

/** Apply the theme to the document (toggle .dark + set the accent attribute). */
export function applyTheme(settings: ThemeSettings): void {
  const root = document.documentElement;
  root.dataset.accent = settings.accent;
  root.classList.toggle("dark", isDark(settings.mode));
}
