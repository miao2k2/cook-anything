"use client";

/**
 * Biểu đồ radar — "Cân bằng các lĩnh vực".
 */
export function RadarChart({
  axes,
  size = 240,
}: {
  axes: Array<{ label: string; value: number; note?: string }>;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 34;
  const count = axes.length;

  if (count < 3) {
    return (
      <div
        className="grid place-items-center text-sm text-[var(--p-muted)] text-center px-4"
        style={{ height: size }}
      >
        Cần ít nhất 3 lĩnh vực để vẽ biểu đồ cân bằng
      </div>
    );
  }

  const angleAt = (i: number) => (Math.PI * 2 * i) / count - Math.PI / 2;

  const pointAt = (i: number, ratio: number) => {
    const angle = angleAt(i);
    return {
      x: cx + Math.cos(angle) * radius * ratio,
      y: cy + Math.sin(angle) * radius * ratio,
    };
  };

  const polygon = axes
    .map((axis, i) => {
      const p = pointAt(i, Math.max(0, Math.min(100, axis.value)) / 100);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Biểu đồ cân bằng các lĩnh vực"
    >
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={axes
            .map((_, i) => {
              const p = pointAt(i, ring);
              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            })
            .join(" ")}
          fill="none"
          stroke="var(--p-grid)"
          strokeWidth="1"
        />
      ))}

      {axes.map((_, i) => {
        const p = pointAt(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="var(--p-grid)"
            strokeWidth="1"
          />
        );
      })}

      <polygon
        points={polygon}
        fill="var(--p-primary)"
        fillOpacity="0.22"
        stroke="var(--p-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {axes.map((axis, i) => {
        const p = pointAt(i, Math.max(0, Math.min(100, axis.value)) / 100);
        return (
          <circle
            key={axis.label}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="var(--p-surface)"
            stroke="var(--p-primary)"
            strokeWidth="2"
          >
            <title>{`${axis.label}: ${axis.note ?? axis.value + "%"}`}</title>
          </circle>
        );
      })}

      {axes.map((axis, i) => {
        const angle = angleAt(i);
        const lx = cx + Math.cos(angle) * (radius + 20);
        const ly = cy + Math.sin(angle) * (radius + 20);
        const cos = Math.cos(angle);
        const anchor = Math.abs(cos) < 0.3 ? "middle" : cos > 0 ? "start" : "end";
        return (
          <text
            key={`label-${axis.label}`}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-[var(--p-muted)] text-[11px] font-bold"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
