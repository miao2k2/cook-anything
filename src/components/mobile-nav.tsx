"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/icon";
import { PRIMARY_NAV, isActive } from "@/lib/nav";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--p-line)] bg-[var(--p-surface)]/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch">
        {PRIMARY_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 min-h-[58px] transition-colors ${
                  active
                    ? "text-[var(--p-primary)]"
                    : "text-[var(--p-muted)] hover:text-[var(--p-ink)]"
                }`}
              >
                <span
                  className={`grid place-items-center w-8 h-8 rounded-xl transition-all ${
                    active ? "bg-[var(--p-primary)]/12" : ""
                  }`}
                >
                  <Icon name={item.icon} size={20} />
                </span>
                <span className="text-[10px] font-extrabold leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
