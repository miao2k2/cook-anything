import { redirect } from "next/navigation";
import Link from "next/link";

import { Icon } from "@/components/icon";
import { LoginForm } from "@/components/login";
import { getCurrentUser } from "@/lib/auth";

/** Trang đọc cookie phiên để chuyển hướng — cho phép blocking route. */
export const instant = false;

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/today");

  return (
    <div className="paper-grid min-h-[100dvh] grid place-items-center px-4 py-8 text-[var(--p-ink)]">
      <div className="w-full max-w-[400px] p-6 lg:p-8 shadow-xl planner-item-in">
        <div className="flex flex-col items-center text-center">
          <span className="planner-float text-[var(--p-accent)]">
            <Icon name="logo" size={64} />
          </span>
          <div className="mt-3 inline-flex items-baseline gap-0.5 leading-none -rotate-2">
            <span
              className="text-[34px] font-bold text-[var(--p-primary)]"
              style={{ fontFamily: "var(--font-brand)" }}
            >
              P
            </span>
            <span
              className="text-[34px] text-[var(--p-accent)]"
              style={{ fontFamily: "var(--font-brand)" }}
            >
              lanner
            </span>
          </div>

          <h1 className="mt-5 text-lg lg:text-xl font-extrabold text-[var(--p-ink)]">
            Nhập email để vào Planner
          </h1>
          <p className="mt-1 text-sm text-[var(--p-muted)]">
            Mình sẽ gửi mã 6 số tới email này; chỉ cần nhập ở lần đầu trên
            mỗi thiết bị.
          </p>
        </div>

        <LoginForm />

        <p className="w-full mt-4 text-center text-sm font-bold text-[var(--p-muted)]">
          Có private key?{" "}
          <Link
            href="/register"
            className="inline-flex items-center gap-1 text-[var(--p-accent)] hover:underline underline-offset-4"
          >
            <Icon name="key" size={14} />
            Đăng ký tài khoản
          </Link>
        </p>
      </div>
    </div>
  );
}
