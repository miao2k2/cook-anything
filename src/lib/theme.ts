/**
 * Theme engine cho Planner.
 *
 * Mỗi bộ màu được định nghĩa bằng 5 mã màu gốc. Toàn bộ biến `--p-*` được
 * tính toán từ 5 màu đó bằng cách pha trộn (mix) và tự động chọn màu chữ
 * tương phản theo chuẩn WCAG 2.1, nên mọi bộ màu đều dễ đọc.
 */

export type ThemeDefinition = {
  id: string;
  name: string;
  /** [ink, primary, iconA, iconB, accent] — không có dấu # */
  colors: [string, string, string, string, string];
  /** Màu nền tuỳ chọn, ghi đè màu HSL tính từ hue */
  bg?: string;
  /** Màu vỏ ngoài tuỳ chọn */
  shell?: string;
  /** Màu nhấn riêng cho menu */
  menu?: string;
  /** Ép nền tối */
  mono?: boolean;
  /** Ghi đè hue HSL */
  hue?: number;
};

export const THEMES: ThemeDefinition[] = [
  {
    id: "pandavocab",
    name: "Rừng tre xanh",
    colors: ["064E3B", "047857", "34D399", "A7F3D0", "D1FAE5"],
    hue: 95,
  },
  {
    id: "keo-bong",
    name: "Kẹo bông pastel",
    colors: ["6C7EE1", "92B9E3", "FFC4A4", "FBA2D0", "C688EB"],
  },
  {
    id: "lavender",
    name: "Hoàng hôn lavender",
    colors: ["3C284B", "8F89B7", "C7D7FB", "F1B0DA", "FEC4B6"],
  },
  {
    id: "y2k",
    name: "Kẹo ngọt Y2K",
    colors: ["956AD6", "F179B8", "EBDFEB", "F0BD74", "70C2B4"],
    menu: "F179B8",
  },
  {
    id: "bien-he",
    name: "Biển hè",
    colors: ["0B3C6E", "1E6FB8", "4FA3E0", "A7D3F5", "E3F2FD"],
  },
  {
    id: "matcha",
    name: "Vườn matcha",
    colors: ["384B20", "5B7F2E", "89AA4E", "C2D89A", "ECF4DD"],
  },
  {
    id: "vintage",
    name: "Vintage hồng đất",
    colors: ["BD637E", "E2B4B7", "FEF8EC", "A0C9C3", "657D81"],
  },
  {
    id: "neon",
    name: "Đêm neon",
    colors: ["070544", "361D9D", "E04483", "E67FC4", "FAC140"],
  },
  {
    id: "den-trang",
    name: "Đen trắng",
    colors: ["111111", "3F3F3F", "777777", "B5B5B5", "E8E8E8"],
    bg: "EDEDED",
    shell: "FAFAFA",
    mono: true,
  },
];

export const DEFAULT_THEME_ID = "pandavocab";

export function getTheme(id: string | null | undefined): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/* ------------------------------------------------------------------ */
/* Thuật toán màu                                                     */
/* ------------------------------------------------------------------ */

/** "#RRGGBB" -> [r, g, b] */
function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(1, 3), 16),
    parseInt(clean.slice(3, 5), 16),
    parseInt(clean.slice(5, 7), 16),
  ];
}

function toHex(rgb: number[]): string {
  return (
    "#" +
    rgb
      .map((v) =>
        Math.round(Math.max(0, Math.min(255, v)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

/** Pha trộn hai màu theo tỉ lệ `amount` (0 = a, 1 = b). */
export function mix(a: string, b: string, amount: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  return toHex(ca.map((v, i) => v * (1 - amount) + cb[i] * amount));
}

/** Độ sáng tương đối theo WCAG 2.1 (0..1). */
export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Tỉ lệ tương phản WCAG giữa hai màu. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Hue (0..360) của một màu. */
export function hueOf(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (!d) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round(((h * 60 + 360) % 360));
}

/** HSL -> hex. */
export function hslToHex(h: number, s: number, l: number): string {
  h /= 100;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 30;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: number[];
  if (hp < 1) rgb = [c, x, 0];
  else if (hp < 2) rgb = [x, c, 0];
  else if (hp < 3) rgb = [0, c, x];
  else if (hp < 4) rgb = [0, x, c];
  else if (hp < 5) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const m = l - c / 2;
  return toHex(rgb.map((v) => (v + m) * 255));
}

/**
 * Trả về màu gần nhất đạt tỉ lệ tương phản `target` so với `bg`,
 * pha dần từ `from` về `fallback`.
 */
export function ensureContrast(
  from: string,
  bg: string,
  target: number,
  fallback = "#000000",
): string {
  for (let s = 0; s <= 1; s += 0.05) {
    const candidate = mix(from, fallback, s);
    if (contrastRatio(candidate, bg) >= target) return candidate;
  }
  return fallback;
}

/** Chọn màu chữ đen/trắng tương phản nhất trên nền. */
export function onColor(bg: string): string {
  return contrastRatio(bg, "#ffffff") >= contrastRatio(bg, "#111827")
    ? "#ffffff"
    : "#111827";
}

export type ThemeTokens = {
  vars: Record<string, string>;
  primary: string;
  secondary: string;
  pageBg: string;
  palette: string[];
};

/**
 * Tính toàn bộ design token của một bộ màu.
 * `dark` ép dùng nền tối (bộ màu đơn sắc hoặc chế độ tối).
 */
export function buildThemeTokens(
  themeId: string,
  dark = false,
): ThemeTokens {
  const theme = getTheme(themeId);
  const isDark = dark || !!theme.mono;
  const mono = !!theme.mono;

  // Sắp xếp 5 màu theo độ sáng tăng dần để lấy đúng thứ tự dùng chung.
  const sorted = theme.colors
    .map((c) => `#${c.toLowerCase()}`)
    .sort((a, b) => luminance(a) - luminance(b));

  const hue = theme.hue ?? hueOf(sorted[1]);

  const surface = isDark
    ? mono
      ? "#1b1b1b"
      : "#1f2937"
    : "#ffffff";

  const pageBg = isDark
    ? mono
      ? "#121212"
      : hslToHex(hue, 22, 9)
    : theme.bg
      ? `#${theme.bg.toLowerCase()}`
      : hslToHex(hue, 42, 92);

  const primary = isDark
    ? ensureContrast(sorted[3], surface, 3, "#ffffff")
    : ensureContrast(sorted[1], "#ffffff", 3);

  const menuColor = theme.menu ? `#${theme.menu.toLowerCase()}` : null;

  const secondary = isDark
    ? mix(menuColor ?? sorted[1], "#111827", 0.6)
    : mix(menuColor ?? sorted[2], "#ffffff", 0.62);

  const vars: Record<string, string> = {
    "--p-bg": pageBg,
    "--p-shell": isDark
      ? mix(pageBg, "#000000", 0.35)
      : theme.shell
        ? `#${theme.shell.toLowerCase()}`
        : mix(pageBg, "#ffffff", 0.55),
    "--p-ic-a": isDark
      ? mix(sorted[2], "#111827", 0.45)
      : mix(sorted[2], "#ffffff", 0.45),
    "--p-ic-b": mix(sorted[3], "#ffffff", 0.2),
    "--p-surface": surface,
    "--p-accent": isDark
      ? ensureContrast(sorted[4], pageBg, 4.5, "#ffffff")
      : ensureContrast(sorted[0], pageBg, 4.5),
    "--p-primary": primary,
    "--p-on-primary": onColor(primary),
    "--p-secondary": secondary,
    "--p-on-secondary": isDark
      ? ensureContrast(sorted[4], secondary, 4.5, "#ffffff")
      : ensureContrast(sorted[0], secondary, 4.5),
    "--p-row": isDark
      ? mix(surface, sorted[2], 0.18)
      : mix("#ffffff", sorted[1], 0.09),
    "--p-ink": isDark ? "#f3f4f6" : "#111827",
    "--p-muted": isDark ? "#9ca3af" : "#6b7280",
    "--p-line": isDark ? "rgba(255,255,255,0.14)" : "rgba(17,24,39,0.14)",
    "--p-grid": isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)",
  };

  // 3 màu pill phụ trợ
  [sorted[1], sorted[2], sorted[3]].forEach((color, idx) => {
    const pill = isDark
      ? mix(color, mono ? "#141414" : "#111827", 0.55)
      : mix(color, "#ffffff", 0.62);
    vars[`--p-pill-${idx + 1}`] = pill;
    vars[`--p-pill-text-${idx + 1}`] = isDark
      ? ensureContrast(color, pill, 4.5, "#ffffff")
      : ensureContrast(color, pill, 4.5);
  });

  return {
    vars,
    primary,
    secondary,
    pageBg,
    palette: [primary, sorted[2], sorted[3], sorted[1], mix(sorted[2], "#ffffff", 0.3)],
  };
}

/** Style object cho thẻ <html>/<body> dựa trên theme hiện tại. */
export function themeVars(
  themeId: string,
  dark = false,
): Record<string, string> {
  return buildThemeTokens(themeId, dark).vars;
}

/** Chuỗi style inline cho thẻ <html>/<body> dựa trên theme hiện tại. */
export function themeStyle(themeId: string, dark = false): string {
  const { vars } = buildThemeTokens(themeId, dark);
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
