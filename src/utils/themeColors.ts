/** Default brand blue (matches previous Tailwind brand scale). */
export const DEFAULT_BRAND = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
  950: '#172554',
} as const;

export type BrandScale = keyof typeof DEFAULT_BRAND;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (c: number) => clamp(Math.round(c), 0, 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
      break;
  }
  h /= 6;
  return { h, s, l };
}

function hue2rgb(p: number, q: number, t: number) {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Ensure brand-600 has enough contrast for white button text. */
function ensureButtonContrast(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  let { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  // White text needs a reasonably dark fill
  for (let i = 0; i < 8; i++) {
    const { r, g, b } = hslToRgb(h, s, l);
    const contrast = (1.05) / (relativeLuminance(r, g, b) + 0.05);
    if (contrast >= 4.5) break;
    l = clamp(l - 0.06, 0.18, 0.55);
    s = clamp(s + 0.04, 0.35, 0.78);
  }
  return hslToHex(h, s, l);
}

/**
 * Build a brand scale from the page background colour.
 * Near-neutral backgrounds keep the default blue.
 */
export function brandPaletteFromBackground(backgroundHex: string): Record<BrandScale, string> {
  const rgb = hexToRgb(backgroundHex);
  if (!rgb) return { ...DEFAULT_BRAND };

  const { h, s } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  // Slate / gray washes → keep classic blue CTAs
  if (s < 0.08) return { ...DEFAULT_BRAND };

  const sat = clamp(s + 0.28, 0.48, 0.72);
  const base600 = ensureButtonContrast(hslToHex(h, sat, 0.42));
  const baseRgb = hexToRgb(base600)!;
  const base = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);

  return {
    50: hslToHex(base.h, clamp(base.s * 0.35, 0.2, 0.45), 0.96),
    100: hslToHex(base.h, clamp(base.s * 0.45, 0.25, 0.55), 0.92),
    200: hslToHex(base.h, clamp(base.s * 0.55, 0.3, 0.6), 0.84),
    300: hslToHex(base.h, clamp(base.s * 0.7, 0.35, 0.65), 0.72),
    400: hslToHex(base.h, base.s, 0.58),
    500: hslToHex(base.h, base.s, 0.5),
    600: base600,
    700: hslToHex(base.h, clamp(base.s + 0.02, 0.4, 0.78), clamp(base.l - 0.1, 0.22, 0.42)),
    800: hslToHex(base.h, clamp(base.s + 0.04, 0.4, 0.8), clamp(base.l - 0.18, 0.18, 0.36)),
    900: hslToHex(base.h, clamp(base.s + 0.05, 0.4, 0.82), clamp(base.l - 0.26, 0.14, 0.3)),
    950: hslToHex(base.h, clamp(base.s + 0.06, 0.4, 0.85), clamp(base.l - 0.34, 0.1, 0.22)),
  };
}

export function hexToRgbChannels(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '37 99 235';
  return `${rgb.r} ${rgb.g} ${rgb.b}`;
}

const BRAND_STEPS: BrandScale[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export function applyBrandPaletteToDocument(backgroundHex: string) {
  const palette = brandPaletteFromBackground(backgroundHex);
  const root = document.documentElement;
  BRAND_STEPS.forEach((step) => {
    root.style.setProperty(`--brand-${step}`, palette[step]);
    root.style.setProperty(`--brand-${step}-rgb`, hexToRgbChannels(palette[step]));
  });
  // Soft button glow tinted to the accent
  root.style.setProperty('--brand-shadow', `0 4px 16px -4px rgb(${hexToRgbChannels(palette[600])} / 0.22)`);
}
