"use client";

import { useRouter } from "next/navigation";

import { logout } from "@/app/actions/auth";
import { Icon } from "@/components/icon";

/** Nút đăng xuất — gọi server action rồi chuyển về trang đăng nhập. */
export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void handleLogout()}
        aria-label="Đăng xuất"
        title="Đăng xuất"
        className="w-10 h-10 -mr-2 grid place-items-center rounded-xl text-[var(--p-muted)] hover:text-[var(--p-ink)]"
      >
        <Icon name="logout" size={20} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className="flex items-center gap-2 min-h-[40px] px-2 text-sm font-bold text-[var(--p-muted)] hover:text-[var(--p-accent)] transition-colors"
    >
      <Icon name="logout" size={18} />
      Đăng xuất
    </button>
  );
}
