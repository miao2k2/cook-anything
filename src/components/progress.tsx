"use client";

import { type ReactNode } from "react";

import { Icon } from "@/components/icon";

/* ------------------------------------------------------------------ */
/* Ô tích                                                             */
/* ------------------------------------------------------------------ */

export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`grid place-items-center w-6 h-6 shrink-0 rounded-lg border-2 transition-all duration-200 ${
        checked
          ? "bg-[var(--p-primary)] border-[var(--p-primary)] text-[var(--p-on-primary)]"
          : "border-[var(--p-line)] text-transparent hover:border-[var(--p-primary)]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-90"}`}
    >
      {checked ? (
        <span className="planner-check">
          <Icon name="check" size={14} strokeWidth={2.6} />
        </span>
      ) : null}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Vòng phần trăm                                                      */
/* ------------------------------------------------------------------ */

export function ProgressRing({
  value,
  size = 132,
  strokeWidth = 11,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--p-row)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--p-primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Thanh tiến độ                                                       */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  className = "",
  height = 8,
}: {
  value: number;
  className?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-[var(--p-row)] ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-[var(--p-primary)]"
        style={{
          width: `${clamped}%`,
          transition: "width .5s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}
