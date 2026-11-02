"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/icon";
import { LogoutButton } from "@/components/logout-btn";
import { PRIMARY_NAV, SECONDARY_NAV, isActive } from "@/lib/nav";

/**
 * Sidebar — chỉ hiện từ breakpoint `md` trở lên.
 */
export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  const links = (items: typeof PRIMARY_NAV) =>
    items.map((item) => {
      const active = isActive(pathname, item.href);
      return (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-bold transition-colors ${
              active
                ? "bg-[var(--p-primary)] text-[var(--p-on-primary)]"
                : "text-[var(--p-ink)] hover:bg-[var(--p-row)]"
            }`}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </Link>
        </li>
      );
    });

  return (
    <aside className="hidden md:flex md:flex-col w-[236px] lg:w-[264px] shrink-0 h-dvh sticky top-0 border-r border-[var(--p-line)] bg-[var(--p-surface)]">
      <div className="px-5 py-5 border-b border-[var(--p-line)]">
        <Link
          href="/today"
          className="inline-flex items-center gap-2 text-[26px] leading-none -rotate-2"
          style={{ fontFamily: "var(--font-brand)" }}
        >
          <span className="text-[var(--p-primary)]">P</span>
          <span className="text-[var(--p-accent)]">lanner</span>
        </Link>
      </div>

      <nav aria-label="Điều hướng" className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="grid gap-1">{links(PRIMARY_NAV)}</ul>

        <div className="my-4 border-t border-dashed border-[var(--p-line)]" />

        <ul className="grid gap-1">{links(SECONDARY_NAV)}</ul>
      </nav>

      <div className="px-4 py-4 border-t border-[var(--p-line)]">
        <p className="truncate text-xs font-bold text-[var(--p-muted)] mb-1">
          {email}
        </p>
        <LogoutButton />
      </div>
    </aside>
  );
}
