"use client";

import { Card, CardTitle } from "@/components/card";
import { Icon } from "@/components/icon";
import { BarChart } from "@/components/bar-chart";
import { LineChart } from "@/components/line-chart";
import { ProgressBar } from "@/components/progress";
import { percent, WEEKDAYS_FULL } from "@/lib/date";

type Stats = {
  streak: number;
  doneCount: number;
  totalCount: number;
  habits: Array<{
    id: string;
    name: string;
    pct: number;
    checks: number;
    days: number;
    current: number;
    best: number;
  }>;
  weekday: Array<{ idx: number; avg: number; total: number }>;
  recent: Array<{
    date: string;
    done: number;
    habits: number;
    total: number;
  }>;
  daily: Array<{ date: string; total: number; done: number }>;
};

export function StatsScreen({
  stats,
  range,
}: {
  stats: Stats;
  range: 4 | 8 | 12;
}) {
  const completionPct = percent(stats.doneCount, stats.totalCount);
  const trendPoints = stats.daily.map((d) => percent(d.done, d.total));

  const recentBars = stats.recent.map((r) => ({
    label: `${r.date.slice(8, 10)}/${r.date.slice(5, 7)}`,
    value: r.done,
    note: `${r.done}/${r.total} việc, ${r.habits} thói quen`,
  }));

  const weekdayBars = stats.weekday.map((w) => ({
    label: WEEKDAYS_FULL[w.idx].replace("Chủ ", "CN ").replace("Thứ ", "T"),
    value: Number(w.avg.toFixed(1)),
    note: `${w.avg} việc/ngày, tổng ${w.total}`,
  }));

  return (
    <div className="planner-fade-in">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--p-muted)]">
            Phân tích
          </p>
          <h1 className="mt-0.5 text-2xl lg:text-4xl font-black text-[var(--p-ink)]">
            Thống kê
          </h1>
        </div>
        <div
          role="group"
          aria-label="Khoảng thời gian"
          className="inline-flex p-1 rounded-xl bg-[var(--p-row)] gap-1"
        >
          {([4, 8, 12] as const).map((w) => (
            <a
              key={w}
              href={`/stats?range=${w}`}
              aria-current={range === w ? "true" : undefined}
              className={`inline-flex items-center min-h-[36px] px-3 rounded-lg text-sm font-extrabold transition-colors ${
                range === w
                  ? "bg-[var(--p-primary)] text-[var(--p-on-primary)]"
                  : "text-[var(--p-ink)] hover:brightness-95"
              }`}
            >
              {w} tuần
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3 mb-3 lg:mb-4">
        <Card className="p-3.5 lg:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="flame" size={18} className="text-[var(--p-primary)]" />
            <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)]">
              Chuỗi ngày
            </span>
          </div>
          <div className="text-3xl font-black text-[var(--p-ink)] tabular-nums">
            {stats.streak}
            <span className="text-base text-[var(--p-muted)]"> ngày</span>
          </div>
        </Card>

        <Card className="p-3.5 lg:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="check" size={18} className="text-[var(--p-primary)]" />
            <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)]">
              Việc đã xong
            </span>
          </div>
          <div className="text-3xl font-black text-[var(--p-ink)] tabular-nums">
            {stats.doneCount}
            <span className="text-base text-[var(--p-muted)]">/{stats.totalCount}</span>
          </div>
        </Card>

        <Card className="p-3.5 lg:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="trophy" size={18} className="text-[var(--p-primary)]" />
            <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)]">
              Tỉ lệ hoàn thành
            </span>
          </div>
          <div className="text-3xl font-black text-[var(--p-ink)] tabular-nums">
            {completionPct}%
          </div>
          <ProgressBar value={completionPct} height={6} className="mt-1.5" />
        </Card>

        <Card className="p-3.5 lg:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="habit" size={18} className="text-[var(--p-primary)]" />
            <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)]">
              Thói quen đang theo
            </span>
          </div>
          <div className="text-3xl font-black text-[var(--p-ink)] tabular-nums">
            {stats.habits.length}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 items-start">
        <Card className="p-3.5 lg:p-5">
          <CardTitle icon="chart">Tỉ lệ hoàn thành theo ngày</CardTitle>
          <p className="text-sm text-[var(--p-muted)] mb-2">
            Số việc đã xong trên tổng số việc của từng ngày
          </p>
          <LineChart
            points={trendPoints}
            height={150}
            ariaLabel="Biểu đồ tỉ lệ hoàn thành theo ngày"
          />
        </Card>

        <Card className="p-3.5 lg:p-5">
          <CardTitle icon="list">7 ngày gần đây</CardTitle>
          <p className="text-sm text-[var(--p-muted)] mb-2">
            Số việc đã xong trên tổng số việc của từng ngày
          </p>
          <BarChart
            data={recentBars}
            height={150}
            ariaLabel="Biểu đồ số việc đã xong trong 7 ngày gần đây"
          />
        </Card>

        <Card className="p-3.5 lg:p-5">
          <CardTitle icon="clock">Năng suất theo thứ</CardTitle>
          <p className="text-sm text-[var(--p-muted)] mb-2">
            Số việc xong trung bình mỗi ngày
          </p>
          <BarChart
            data={weekdayBars}
            height={150}
            ariaLabel="Biểu đồ năng suất theo thứ trong tuần"
          />
        </Card>

        <Card className="p-3.5 lg:p-5">
          <CardTitle icon="habit">Độ đều đặn của thói quen</CardTitle>
          <p className="text-sm text-[var(--p-muted)] mb-3">
            Tỉ lệ số ngày bạn tích trong {range} tuần qua
          </p>

          {stats.habits.length === 0 ? (
            <p className="py-3 text-sm text-[var(--p-muted)]">
              Chưa có thói quen nào để thống kê.
            </p>
          ) : (
            <ul className="m-0 p-0 list-none grid gap-3">
              {stats.habits.map((habit) => (
                <li key={habit.id}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold text-[var(--p-ink)] truncate">
                      {habit.name}
                    </span>
                    <span className="text-sm font-black text-[var(--p-accent)] tabular-nums shrink-0">
                      {habit.pct}%
                    </span>
                  </div>
                  <ProgressBar value={habit.pct} height={7} />
                  <p className="mt-1 text-[11px] font-bold text-[var(--p-muted)] tabular-nums">
                    {habit.checks}/{habit.days} ngày tích · Chuỗi hiện tại{" "}
                    {habit.current} · Chuỗi dài nhất {habit.best}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
