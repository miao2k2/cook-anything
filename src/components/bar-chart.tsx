"use client";

/** Biểu đồ cột. */
export function BarChart({
  data,
  height = 170,
  ariaLabel,
}: {
  data: Array<{ label: string; value: number; note?: string }>;
  height?: number;
  ariaLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return (
      <div
        className="grid place-items-center text-sm text-[var(--p-muted)]"
        style={{ height }}
      >
        Chưa có dữ liệu
      </div>
    );
  }

  return (
    <div
      className="flex items-end gap-1.5"
      style={{ height }}
      role="img"
      aria-label={ariaLabel ?? "Biểu đồ cột"}
    >
      {data.map((item, i) => (
        <div
          key={`${item.label}-${i}`}
          className="flex-1 flex flex-col items-center justify-end gap-1.5 min-w-0"
          title={
            item.note ? `${item.label}: ${item.note}` : `${item.label}: ${item.value}`
          }
        >
          <div
            className="w-full max-w-[34px] rounded-t-lg bg-[var(--p-primary)] transition-all duration-500"
            style={{ height: `${Math.max(3, (item.value / max) * 100)}%` }}
          />
          <span className="text-[10px] lg:text-xs font-bold text-[var(--p-muted)] truncate w-full text-center">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
