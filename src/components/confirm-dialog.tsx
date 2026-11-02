"use client";

import { useEffect, type ReactNode } from "react";

import { Icon } from "@/components/icon";

/**
 * Hộp thoại xác nhận cho hành động không thể hoàn tác (xoá key…).
 *
 * Render inline (không dùng portal) để giữ đúng thứ tự DOM trong cây
 * React — an toàn với RSC và streaming của Next.js.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Đóng bằng phím Escape.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-4 bg-black/45 backdrop-blur-[2px]"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[420px] p-5 lg:p-6 rounded-2xl bg-[var(--p-surface)] shadow-2xl planner-item-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={`grid place-items-center w-10 h-10 shrink-0 rounded-xl ${
              tone === "danger"
                ? "bg-rose-500/10 text-rose-600"
                : "bg-[var(--p-row)] text-[var(--p-primary)]"
            }`}
          >
            <Icon name={tone === "danger" ? "alert" : "info"} size={20} />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-[var(--p-ink)]">{title}</h2>
            <div className="mt-1 text-sm text-[var(--p-muted)]">{description}</div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[42px] px-4 rounded-xl bg-[var(--p-row)] text-[var(--p-ink)] font-extrabold text-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[42px] px-4 rounded-xl font-extrabold text-sm ${
              tone === "danger"
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-[var(--p-primary)] text-[var(--p-on-primary)]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
