import { redirect } from "next/navigation";

import { Icon } from "@/components/icon";
import { RegisterForm } from "@/components/register";
import { getCurrentUser } from "@/lib/auth";

/** Trang đọc cookie phiên để chuyển hướng — cho phép blocking route. */
export const instant = false;

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/today");

  return (
    <div className="paper-grid min-h-[100dvh] grid place-items-center px-4 py-8 text-[var(--p-ink)]">
      <div className="w-full max-w-[440px] p-6 lg:p-8 shadow-xl planner-item-in">
        <div className="flex flex-col items-center text-center">
          <span className="planner-float text-[var(--p-accent)]">
            <Icon name="key" size={64} />
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
            Đăng ký bằng private key
          </h1>
          <p className="mt-1 text-sm text-[var(--p-muted)]">
            Nhập private key do quản trị viên cấp để tạo tài khoản mới.
          </p>
        </div>

        <RegisterForm />
      </div>
    </div>
  );
}
