"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Icon } from "@/components/icon";
import { Button } from "@/components/controls";
import { registerWithKey, type RegisterState } from "@/app/actions/admin";

const initialState: RegisterState = { status: "idle" };

/** Chuẩn hoá key về dạng PLN-XXXX-XXXX-XXXX-XXXX khi người dùng gõ. */
function formatKey(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^PLN/, "");

  const groups = cleaned.match(/.{1,4}/g) ?? [];
  const formatted = groups.slice(0, 4).join("-");

  return `PLN-${formatted}`;
}

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    registerWithKey,
    initialState,
  );
  const [key, setKey] = useState("");

  if (state.status === "success") {
    return (
      <div className="mt-5">
        <div className="flex items-center gap-2.5 rounded-xl bg-[var(--p-secondary)] px-3 py-2.5 text-sm font-bold text-[var(--p-on-secondary)]">
          <Icon name="check" size={16} />
          Đã tạo tài khoản cho {state.email}. Đang vào Planner…
        </div>
        <Button
          type="button"
          size="lg"
          className="w-full mt-4"
          onClick={() => {
            router.push("/today");
            router.refresh();
          }}
        >
          Vào Planner
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-5" noValidate>
      {state.status === "error" ? (
        <p className="mb-3 flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-600">
          <Icon name="alert" size={16} />
          {state.message}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="register-email"
          className="block mb-1 text-sm font-bold text-[var(--p-ink)]"
        >
          Email của bạn
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="ten@gmail.com"
          className="block w-full h-12 px-4 rounded-xl bg-[var(--p-row)] text-base font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
        />
      </div>

      <div className="mt-3">
        <label
          htmlFor="register-name"
          className="block mb-1 text-sm font-bold text-[var(--p-ink)]"
        >
          Tên hiển thị <span className="font-normal text-[var(--p-muted)]">(tuỳ chọn)</span>
        </label>
        <input
          id="register-name"
          name="name"
          maxLength={60}
          placeholder="Ví dụ: Minh"
          className="block w-full h-12 px-4 rounded-xl bg-[var(--p-row)] text-base font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
        />
      </div>

      <div className="mt-3">
        <label
          htmlFor="register-key"
          className="block mb-1 text-sm font-bold text-[var(--p-ink)]"
        >
          Private key
        </label>
        <input
          id="register-key"
          name="key"
          required
          spellCheck={false}
          autoCapitalize="characters"
          autoComplete="off"
          value={key}
          onChange={(e) => setKey(formatKey(e.target.value))}
          placeholder="PLN-XXXX-XXXX-XXXX-XXXX"
          className="block w-full h-12 px-4 rounded-xl bg-[var(--p-row)] font-mono text-base font-bold tracking-wider text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
        />
        <p className="mt-1.5 text-xs text-[var(--p-muted)]">
          Key do quản trị viên cấp, dạng{" "}
          <code className="font-mono font-bold">PLN-XXXX-XXXX-XXXX-XXXX</code>.
        </p>
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full mt-4">
        {pending ? "Đang đăng ký…" : "Đăng ký tài khoản"}
      </Button>

      <p className="w-full mt-3 text-center text-sm font-bold text-[var(--p-muted)]">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="text-[var(--p-accent)] hover:underline underline-offset-4"
        >
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
