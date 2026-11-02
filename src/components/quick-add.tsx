"use client";

import { useId, useState, type ReactNode } from "react";

import { Icon } from "@/components/icon";
import { Button } from "@/components/controls";

export function QuickAdd({
  placeholder,
  label,
  onAdd,
  maxLength = 120,
  disabled,
}: {
  placeholder: string;
  label: string;
  onAdd: (text: string) => void | Promise<void>;
  maxLength?: number;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const inputId = useId();

  async function submit() {
    const text = value.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      await onAdd(text);
      setValue("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        id={inputId}
        value={value}
        disabled={disabled || busy}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void submit();
          }
        }}
        className="flex-1 min-w-0 h-11 px-3.5 rounded-xl bg-[var(--p-row)] text-sm lg:text-base font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)] disabled:opacity-50"
      />
      <Button onClick={() => void submit()} disabled={!value.trim() || busy}>
        <Icon name="plus" size={18} />
        <span className="sr-only">Thêm</span>
      </Button>
    </div>
  );
}

export function EmptyState({
  icon = "note",
  children,
}: {
  icon?: string;
  children: ReactNode;
}) {
  return (
    <p className="flex items-center gap-2 py-3 text-sm text-[var(--p-muted)]">
      <Icon name={icon} size={16} />
      {children}
    </p>
  );
}
