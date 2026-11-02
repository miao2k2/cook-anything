"use client";

import type { ReactNode } from "react";
export function Pill({
  children,
  tone = "row",
  className = "",
}: {
  children: ReactNode;
  tone?: "row" | "primary" | "secondary" | "muted";
  className?: string;
}) {
  const tones: Record<string, string> = {
    row: "bg-[var(--p-row)] text-[var(--p-ink)]",
    primary: "bg-[var(--p-primary)] text-[var(--p-on-primary)]",
    secondary: "bg-[var(--p-secondary)] text-[var(--p-on-secondary)]",
    muted:
      "bg-transparent text-[var(--p-muted)] border border-[var(--p-line)]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs lg:text-sm font-bold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  title?: string;
  "aria-label"?: string;
};

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled,
  className = "",
  title,
  ...rest
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary:
      "bg-[var(--p-primary)] text-[var(--p-on-primary)] hover:brightness-105 shadow-sm",
    ghost: "bg-[var(--p-row)] text-[var(--p-ink)] hover:brightness-95",
    outline:
      "bg-transparent text-[var(--p-accent)] border-2 border-[var(--p-line)] hover:border-[var(--p-primary)]",
  };

  const sizes: Record<string, string> = {
    sm: "min-h-[36px] px-3 text-sm",
    md: "min-h-[44px] px-4 text-sm lg:text-base",
    lg: "min-h-[52px] px-6 text-base lg:text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-extrabold transition-all duration-200 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
