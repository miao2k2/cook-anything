"use client";

import { useId } from "react";

/** Biểu đồ đường — dùng cho tiến độ theo ngày. */
export function LineChart({
  points,
  height = 170,
  max = 100,
  ariaLabel,
}: {
  points: number[];
  height?: number;
  max?: number;
  ariaLabel?: string;
}) {
  const gradientId = useId();

  if (points.length === 0) {
    return (
      <div
        className="grid place-items-center text-sm text-[var(--p-muted)]"
        style={{ height }}
      >
        Chưa có dữ liệu
      </div>
    );
  }

  const width = 100;
  const heightUnits = 100;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((value, i) => ({
    x: points.length > 1 ? i * step : width / 2,
    y: heightUnits - (Math.min(value, max) / max) * heightUnits,
  }));

  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(" ");

  const area = `${line} L${coords[coords.length - 1].x.toFixed(2)},${heightUnits} L${coords[0].x.toFixed(2)},${heightUnits} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${heightUnits}`}
      preserveAspectRatio="none"
      style={{ height, width: "100%" }}
      role="img"
      aria-label={ariaLabel ?? "Biểu đồ đường"}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--p-primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--p-primary)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[0, 25, 50, 75, 100].map((y) => (
        <line
          key={y}
          x1="0"
          x2="100"
          y1={y}
          y2={y}
          stroke="var(--p-grid)"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      <path d={area} fill={`url(#${gradientId})`} />

      <path
        d={line}
        fill="none"
        stroke="var(--p-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {coords.map((c, i) => (
        <circle
          key={i}
          cx={c.x}
          cy={c.y}
          r="1.8"
          fill="var(--p-surface)"
          stroke="var(--p-primary)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
