"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/icon";
import { Button } from "@/components/controls";
import {
  requestLoginCode,
  verifyLoginCode,
  type AuthState,
} from "@/app/actions/auth";

const initialState: AuthState = { status: "idle" };

export function LoginForm() {
  // Khoá form để reset sạch khi người dùng muốn đổi email khác.
  const [formKey, setFormKey] = useState(0);

  return (
    <LoginFormInner
      key={formKey}
      onBackToEmail={() => setFormKey((k) => k + 1)}
    />
  );
}

/**
 * Bước đăng nhập được suy ra trực tiếp từ trạng thái của action
 * (đã gửi mã => hiện ô nhập mã), nên không cần effect để chuyển màn hình.
 */
function LoginFormInner({
  onBackToEmail,
}: {
  onBackToEmail: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    requestLoginCode,
    initialState,
  );
  const [code, setCode] = useState("");
  const codeInputRef = useRef<HTMLInputElement>(null);

  const [verifyState, verifyAction, verifyPending] = useActionState(
    async (prev: AuthState, formData: FormData) => {
      const result = await verifyLoginCode(prev, formData);
      if (result.status === "error") setCode("");
      return result;
    },
    initialState,
  );

  const showCodeStep = state.status === "sent";

  // Chỉ đồng bộ DOM (đưa con trỏ vào ô mã), không cập nhật state.
  useEffect(() => {
    if (showCodeStep) codeInputRef.current?.focus();
  }, [showCodeStep]);

  if (state.status === "sent") {
    return (
      <form action={verifyAction} className="mt-5">
        <input type="hidden" name="email" value={state.email} />

        {verifyState.status === "error" ? (
          <p className="mb-3 flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-600">
            <Icon name="alert" size={16} />
            {verifyState.message}
          </p>
        ) : null}

        <label
          htmlFor="planner-code"
          className="block mb-1 text-sm font-bold text-[var(--p-ink)]"
        >
          Mã xác nhận
        </label>
        <input
          id="planner-code"
          ref={codeInputRef}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="6 chữ số"
          className="block w-full h-14 px-4 rounded-xl bg-[var(--p-row)] text-center text-2xl font-black tracking-[0.5em] text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-bold focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
        />

        {state.devCode ? (
          <p className="mt-2 rounded-lg bg-[var(--p-secondary)] px-3 py-2 text-xs font-bold text-[var(--p-on-secondary)]">
            Dev — mã của bạn:{" "}
            <span className="font-black tracking-widest">{state.devCode}</span>
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={code.length !== 6 || verifyPending}
          className="w-full mt-4"
        >
          {verifyPending ? "Đang kiểm tra…" : "Vào Planner"}
        </Button>

        <button
          type="button"
          onClick={onBackToEmail}
          className="w-full mt-3 min-h-[40px] text-sm font-bold text-[var(--p-muted)] hover:text-[var(--p-accent)]"
        >
          Đổi email khác
        </button>
      </form>
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

      <label
        htmlFor="planner-email"
        className="block mb-1 text-sm font-bold text-[var(--p-ink)]"
      >
        Email của bạn
      </label>
      <input
        id="planner-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="ten@gmail.com"
        className="block w-full h-12 px-4 rounded-xl bg-[var(--p-row)] text-base font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
      />

      <Button type="submit" size="lg" disabled={pending} className="w-full mt-4">
        {pending ? "Đang gửi…" : "Gửi mã xác nhận"}
      </Button>
    </form>
  );
}
