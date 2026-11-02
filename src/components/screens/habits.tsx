"use client";

import { useMemo, useState, useTransition } from "react";

import { Card } from "@/components/card";
import { Icon } from "@/components/icon";
import { ProgressBar } from "@/components/progress";
import { addHabit, removeHabit, toggleHabit } from "@/app/actions/planner";
import { daysInMonth, percent, toDateKey } from "@/lib/date";

type Habit = { id: string; name: string };
type CheckSet = Set<string>;

export function HabitsScreen({
  habits,
  checks,
  year,
  month,
}: {
  habits: Habit[];
  checks: CheckSet;
  year: number;
  month: number;
}) {
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [view, setView] = useState({ year, month });

  const days = daysInMonth(view.year, view.month);

  // "Hôm nay" được cố định theo vòng đời component để chuỗi thói quen
  // không nhảy giá trị giữa các lần render.
  const [now] = useState(() => new Date());
  const todayKey = toDateKey(now);
  const monthPrefix = `${view.year}-${String(view.month + 1).padStart(2, "0")}`;

  const stats = useMemo(() => {
    return habits.map((habit) => {
      let count = 0;
      let best = 0;
      let run = 0;

      for (let d = 1; d <= days; d++) {
        const key = `${monthPrefix}-${String(d).padStart(2, "0")}`;
        if (checks.has(`${habit.id}|${key}`)) {
          count++;
          run++;
          best = Math.max(best, run);
        } else {
          run = 0;
        }
      }

      let current = 0;
      for (let i = 0; ; i++) {
        const d = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i),
        );
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
        if (checks.has(`${habit.id}|${key}`)) {
          current++;
        } else if (i > 0) {
          break;
        }
        if (i > 400) break;
      }

      return { habit, count, current, best, pct: percent(count, days) };
    });
  }, [habits, checks, days, monthPrefix, now]);

  function shiftMonth(delta: number) {
    setView((v) => {
      const d = new Date(Date.UTC(v.year, v.month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  }

  return (
    <div className="planner-fade-in">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--p-muted)]">
            Thói quen
          </p>
          <h1 className="mt-0.5 text-2xl lg:text-4xl font-black text-[var(--p-ink)]">
            Theo dõi thói quen
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-[var(--p-primary)] text-[var(--p-on-primary)] font-extrabold shadow-sm hover:brightness-105 transition"
        >
          <Icon name="plus" size={18} />
          Thêm thói quen
        </button>
      </div>

      {adding ? (
        <Card className="p-4 lg:p-5 mb-3 lg:mb-4">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const text = name.trim();
              if (!text) return;
              setName("");
              startTransition(async () => {
                const ok = await addHabit(text);
                if (ok.ok) setAdding(false);
              });
            }}
          >
            <input
              autoFocus
              value={name}
              maxLength={60}
              placeholder="Ví dụ: Uống 2 lít nước"
              onChange={(e) => setName(e.target.value)}
              className="flex-1 min-w-0 h-11 px-3.5 rounded-xl bg-[var(--p-row)] text-sm lg:text-base font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-[var(--p-primary)] text-[var(--p-on-primary)] font-extrabold disabled:opacity-50"
            >
              <Icon name="check" size={18} />
              Thêm
            </button>
          </form>
        </Card>
      ) : null}

      <Card className="p-3.5 lg:p-5 mb-3 lg:mb-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Tháng trước"
            className="w-10 h-10 grid place-items-center rounded-xl bg-[var(--p-row)] text-[var(--p-ink)] hover:brightness-95"
          >
            <Icon name="chev-l" size={18} />
          </button>
          <h2 className="text-lg lg:text-xl font-extrabold text-[var(--p-ink)]">
            Tháng {view.month + 1}, {view.year}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Tháng sau"
            className="w-10 h-10 grid place-items-center rounded-xl bg-[var(--p-row)] text-[var(--p-ink)] hover:brightness-95"
          >
            <Icon name="chev-r" size={18} />
          </button>
        </div>

        {habits.length === 0 ? (
          <p className="py-3 text-sm text-[var(--p-muted)]">
            Chưa có thói quen nào. Thêm thói quen đầu tiên để bắt đầu theo dõi.
          </p>
        ) : (
          <div className="overflow-x-auto thin-scroll -mx-1 px-1">
            <table className="w-full border-collapse min-w-[520px]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-[var(--p-surface)] text-left text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)] pb-2 pr-2 min-w-[130px]">
                    Thói quen
                  </th>
                  {Array.from({ length: days }, (_, i) => {
                    const d = i + 1;
                    const key = `${monthPrefix}-${String(d).padStart(2, "0")}`;
                    return (
                      <th
                        key={d}
                        className={`pb-2 text-[10px] lg:text-xs font-bold tabular-nums ${
                          key === todayKey
                            ? "text-[var(--p-primary)]"
                            : "text-[var(--p-muted)]"
                        }`}
                      >
                        {d}
                      </th>
                    );
                  })}
                  <th className="pb-2 pl-2 text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)]">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {habits.map((habit) => (
                  <tr key={habit.id} className="border-t border-dashed border-[var(--p-line)]">
                    <td className="sticky left-0 z-10 bg-[var(--p-surface)] py-1.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs lg:text-sm font-bold text-[var(--p-ink)] truncate">
                          {habit.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            startTransition(async () => {
                              await removeHabit(habit.id);
                            })
                          }
                          aria-label={`Xoá thói quen: ${habit.name}`}
                          className="w-6 h-6 grid place-items-center rounded text-[var(--p-muted)] hover:text-rose-500 shrink-0"
                        >
                          <Icon name="x" size={13} />
                        </button>
                      </div>
                    </td>

                    {Array.from({ length: days }, (_, i) => {
                      const d = i + 1;
                      const key = `${monthPrefix}-${String(d).padStart(2, "0")}`;
                      const checked = checks.has(`${habit.id}|${key}`);
                      return (
                        <td key={d} className="py-1.5 text-center">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            aria-label={`${habit.name} ngày ${d}`}
                            onClick={() =>
                              startTransition(async () => {
                                await toggleHabit(habit.id, key, !checked);
                              })
                            }
                            className={`mx-auto grid place-items-center w-6 h-6 rounded-lg border-2 transition-all ${
                              checked
                                ? "bg-[var(--p-primary)] border-[var(--p-primary)] text-[var(--p-on-primary)]"
                                : "border-[var(--p-line)] text-transparent hover:border-[var(--p-primary)]"
                            }`}
                          >
                            <Icon name="check" size={13} strokeWidth={3} />
                          </button>
                        </td>
                      );
                    })}
                    <td className="pl-2">
                      <span className="text-xs font-black text-[var(--p-accent)] tabular-nums">
                        {percent(
                          stats.find((s) => s.habit.id === habit.id)?.count ?? 0,
                          days,
                        )}
                        %
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 lg:gap-3">
        {stats.map((s) => (
          <Card key={s.habit.id} className="p-3.5 lg:p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="grid place-items-center w-9 h-9 shrink-0 rounded-full bg-[var(--p-row)] text-[var(--p-accent)]">
                <Icon name="flame" size={18} />
              </span>
              <span className="flex-1 min-w-0 text-sm lg:text-[15px] font-extrabold text-[var(--p-ink)] break-words">
                {s.habit.name}
              </span>
              <span className="text-lg font-black text-[var(--p-primary)] tabular-nums">
                {s.pct}%
              </span>
            </div>

            <ProgressBar value={s.pct} height={7} />

            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-[var(--p-row)] px-1 py-1.5">
                <div className="text-sm font-black text-[var(--p-accent)] tabular-nums">
                  {s.count}
                </div>
                <div className="text-[10px] font-bold text-[var(--p-muted)]">
                  Ngày tích
                </div>
              </div>
              <div className="rounded-lg bg-[var(--p-row)] px-1 py-1.5">
                <div className="text-sm font-black text-[var(--p-accent)] tabular-nums">
                  {s.current}
                </div>
                <div className="text-[10px] font-bold text-[var(--p-muted)]">
                  Chuỗi
                </div>
              </div>
              <div className="rounded-lg bg-[var(--p-row)] px-1 py-1.5">
                <div className="text-sm font-black text-[var(--p-accent)] tabular-nums">
                  {s.best}
                </div>
                <div className="text-[10px] font-bold text-[var(--p-muted)]">
                  Tốt nhất
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
