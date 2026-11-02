import type { Metadata, Viewport } from "next";
import { Baloo_2, Quicksand } from "next/font/google";

import { getCurrentUser } from "@/lib/auth";
import { themeVars } from "@/lib/theme";

import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin", "vietnamese"],
  variable: "--font-quicksand",
  display: "swap",
});

const baloo = Baloo_2({
  subsets: ["latin", "vietnamese"],
  variable: "--font-baloo",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Planner — Lên kế hoạch ngày, tuần, năm",
  description:
    "Lên kế hoạch ngày, tuần, năm gói gọn trong một nơi: việc hôm nay, mục tiêu, thói quen và tiến độ của bạn.",
  applicationName: "Planner",
  appleWebApp: {
    capable: true,
    title: "Planner",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#e9f3e2",
};

/** Trang cần đọc cookie (phiên đăng nhập) nên phải render động. */
export const instant = false;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const themeId = user?.themeId ?? "pandavocab";
  const dark = user?.darkMode ?? false;

  return (
    <html
      lang="vi"
      className={`${quicksand.variable} ${baloo.variable}`}
      style={themeVars(themeId, dark) as React.CSSProperties}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-[var(--p-bg)] text-[var(--p-ink)] antialiased">
        {children}
      </body>
    </html>
  );
}
