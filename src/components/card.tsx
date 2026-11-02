import type { ReactNode } from "react";

import { Icon } from "@/components/icon";

/* ------------------------------------------------------------------ */
/* Thẻ vẽ tay                                                        */
/* ------------------------------------------------------------------ */

type CardProps = {
  children: ReactNode;
  className?: string;
  radius?: number;
  plain?: boolean;
  as?: "div" | "section" | "article" | "li";
};

export function Card({
  children,
  className = "",
  radius = 18,
  plain = false,
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag
      className={`${plain ? "" : "hand-card"} ${className}`}
      style={plain ? undefined : { borderRadius: radius }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Tiêu đề khối                                                       */
/* ------------------------------------------------------------------ */

export function CardTitle({
  children,
  icon,
  action,
}: {
  children: ReactNode;
  icon?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-1">
      <h2 className="flex items-center gap-2 text-lg lg:text-xl font-extrabold text-[var(--p-ink)]">
        {icon ? (
          <span className="grid place-items-center w-8 h-8 rounded-full bg-[var(--p-row)] text-[var(--p-accent)]">
            <Icon name={icon} size={18} />
          </span>
        ) : null}
        {children}
      </h2>
      {action}
    </div>
  );
}
