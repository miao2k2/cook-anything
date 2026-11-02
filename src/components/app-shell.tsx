"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/icon";
import { BottomNav } from "@/components/mobile-nav";
import { Drawer } from "@/components/drawer";
import { Sidebar } from "@/components/sidebar";

/**
 * Khung ứng dụng:
 *  - Desktop (>= md): sidebar cố định + nội dung
 *  - Mobile: header dính trên + bottom nav dưới + drawer menu
 */
export function AppShell({
  email,
  isAdmin,
  children,
}: {
  email: string;
  isAdmin: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar email={email} isAdmin={isAdmin} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden sticky top-0 z-20 flex items-center gap-2.5 h-14 px-4 border-b border-[var(--p-line)] bg-[var(--p-bg)]/85 backdrop-blur">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Mở menu"
            title="Mở menu"
            className="w-10 h-10 -ml-2 grid place-items-center rounded-xl text-[var(--p-muted)] hover:text-[var(--p-ink)]"
          >
            <Icon name="menu" size={22} />
          </button>

          <Link
            href="/today"
            className="inline-flex items-center gap-1 leading-none -rotate-2"
            style={{ fontFamily: "var(--font-brand)" }}
          >
            <span className="text-[var(--p-primary)] text-[22px]">P</span>
            <span className="text-[var(--p-accent)] text-[22px]">lanner</span>
          </Link>

          <span className="flex-1" />

          <Link
            href="/stats"
            aria-label="Thống kê"
            title="Thống kê"
            className="w-10 h-10 -mr-2 grid place-items-center rounded-xl text-[var(--p-muted)] hover:text-[var(--p-ink)]"
          >
            <Icon name="chart" size={21} />
          </Link>
        </header>

        <main className="flex-1 max-w-[1760px] w-full mx-auto px-4 pt-3 md:pt-5 pb-24 md:pb-10 lg:px-7 lg:pb-12">
          {children}
        </main>
      </div>

      <BottomNav />

      {drawerOpen ? (
        <Drawer
          pathname={pathname}
          email={email}
          isAdmin={isAdmin}
          onClose={() => setDrawerOpen(false)}
        />
      ) : null}
    </div>
  );
}
