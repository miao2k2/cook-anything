"use client";

import Link from "next/link";

import { Icon } from "@/components/icon";
import { LogoutButton } from "@/components/logout-btn";
import { SECONDARY_NAV, PRIMARY_NAV, ADMIN_NAV, isActive } from "@/lib/nav";

export function Drawer({
  pathname,
  email,
  isAdmin,
  onClose,
}: {
  pathname: string;
  email: string;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const renderLinks = (items: typeof PRIMARY_NAV) =>
    items.map((item) => {
      const active = isActive(pathname, item.href);
      return (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={onClose}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 font-bold transition-colors ${
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
    <div className="md:hidden fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Đóng menu"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 w-[82%] max-w-[300px] bg-[var(--p-surface)] shadow-2xl flex flex-col planner-fade-in">
        <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--p-line)]">
          <span
            className="inline-flex items-center leading-none -rotate-2"
            style={{ fontFamily: "var(--font-brand)" }}
          >
            <span className="text-[var(--p-primary)] text-[22px]">P</span>
            <span className="text-[var(--p-accent)] text-[22px]">lanner</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className="w-10 h-10 grid place-items-center rounded-xl text-[var(--p-muted)]"
          >
            <Icon name="x" size={22} />
          </button>
        </div>

        <nav aria-label="Menu" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="grid gap-1">{renderLinks(PRIMARY_NAV)}</ul>

          <div className="my-4 border-t border-dashed border-[var(--p-line)]" />

          <ul className="grid gap-1">{renderLinks(SECONDARY_NAV)}</ul>

          {isAdmin ? (
            <>
              <div className="my-4 border-t border-dashed border-[var(--p-line)]" />

              <ul className="grid gap-1">{renderLinks(ADMIN_NAV)}</ul>
            </>
          ) : null}
        </nav>

        <div className="px-4 py-4 border-t border-[var(--p-line)]">
          <p className="truncate text-xs font-bold text-[var(--p-muted)] mb-1">
            {email}
          </p>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
