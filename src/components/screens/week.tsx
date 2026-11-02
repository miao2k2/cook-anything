"use client";

import { useState, useTransition } from "react";

import { Card } from "@/components/card";
import { Icon } from "@/components/icon";
import { Checkbox, ProgressRing } from "@/components/progress";
import { QuickAdd } from "@/components/quick-add";
import { addTask, toggleTask } from "@/app/actions/planner";
import { percent } from "@/lib/date";

export type WeekDay = {
  key: string;
  label: string;
  date: string;
  isToday: boolean;
  tasks: Array<{
    id: string;
    text: string;
    done: boolean;
    priority: number | null;
  }>;
};

export function WeekScreen({
  days,
  habits,
  habitChecks,
  weekLabel,
  prevPct,
  currentPct,
}: {
  days: WeekDay[];
  habits: Array<{ id: string; name: string }>;
  habitChecks: Set<string>;
  weekLabel: string;
  prevPct: number | null;
  currentPct: number;
}) {
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalTasks = days.reduce((sum, d) => sum + d.tasks.length, 0);
  const totalDone = days.reduce((sum, d) => sum + d.tasks.filter((t) => t.done).length, 0);

  const delta =
    prevPct === null ? null : currentPct - prevPct;

  return (
    <div className="planner-fade-in">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--p-muted)]">
            Tuần {weekLabel}
          </p>
          <h1 className="mt-0.5 text-2xl lg:text-4xl font-black text-[var(--p-ink)]">
            Kế hoạch tuần
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/week?offset=-1"
            className="w-11 h-11 grid place-items-center rounded-xl bg-[var(--p-row)] text-[var(--p-ink)] hover:brightness-95"
            aria-label="Tuần trước"
          >
            <Icon name="chev-l" size={20} />
          </a>
          <a
            href="/week"
            className="inline-flex items-center min-h-[44px] px-4 rounded-xl bg-[var(--p-row)] text-sm font-extrabold text-[var(--p-ink)] hover:brightness-95"
          >
            Tuần này
          </a>
          <a
            href="/week?offset=1"
            className="w-11 h-11 grid place-items-center rounded-xl bg-[var(--p-row)] text-[var(--p-ink)] hover:brightness-95"
            aria-label="Tuần sau"
          >
            <Icon name="chev-r" size={20} />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-3 lg:gap-4 mb-3 lg:mb-4 items-start">
        <Card className="p-4 lg:p-5 flex flex-col items-center gap-3">
          <ProgressRing value={currentPct} size={140}>
            <div className="text-center">
              <div className="text-4xl font-black text-[var(--p-ink)] leading-none">
                {currentPct}%
              </div>
              <div className="mt-1 text-xs font-bold text-[var(--p-muted)]">
                hoàn thành tuần
              </div>
            </div>
          </ProgressRing>

          <p className="text-sm font-bold text-[var(--p-muted)] text-center">
            {totalDone}/{totalTasks} việc trong tuần
          </p>

          {delta !== null ? (
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold ${
                delta >= 0
                  ? "bg-[var(--p-secondary)] text-[var(--p-on-secondary)]"
                  : "bg-rose-500/10 text-rose-600"
              }`}
            >
              <Icon name={delta >= 0 ? "chev-d" : "chev-d"} size={16} />
              {delta >= 0 ? "+" : ""}
              {delta}% so với tuần trước
            </div>
          ) : null}

          {habits.length > 0 ? (
            <div className="w-full">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)] mb-1.5">
                Thói quen trong tuần
              </p>
              <ul className="m-0 p-0 list-none grid gap-1">
                {habits.map((habit) => {
                  const checked = days.filter((d) =>
                    habitChecks.has(`${habit.id}|${d.key}`),
                  ).length;
                  return (
                    <li
                      key={habit.id}
                      className="flex items-center gap-2 text-xs font-bold text-[var(--p-ink)]"
                    >
                      <span className="flex-1 min-w-0 truncate">{habit.name}</span>
                      <span className="tabular-nums text-[var(--p-muted)]">
                        {checked}/{days.length}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 lg:gap-3 min-w-0">
          {days.map((day) => {
            const done = day.tasks.filter((t) => t.done).length;
            const pct = percent(done, day.tasks.length);
            const isOpen = expanded === day.key;
            const visible = isOpen ? day.tasks : day.tasks.slice(0, 3);

            return (
              <Card key={day.key} className="p-3 lg:p-3.5 flex flex-col">
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-extrabold ${
                        day.isToday
                          ? "text-[var(--p-primary)]"
                          : "text-[var(--p-ink)]"
                      }`}
                    >
                      {day.label}
                    </div>
                    <div className="text-[11px] font-bold text-[var(--p-muted)] tabular-nums">
                      {day.date.slice(8, 10)}/{day.date.slice(5, 7)}
                    </div>
                  </div>
                  <span className="text-xs font-black text-[var(--p-accent)] tabular-nums shrink-0">
                    {day.tasks.length ? `${pct}%` : "—"}
                  </span>
                </div>

                <ul className="m-0 p-0 list-none flex-1">
                  {visible.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-start gap-2 min-h-[38px] py-1 border-b border-dashed border-[var(--p-line)] last:border-b-0"
                    >
                      <div className="pt-0.5">
                        <Checkbox
                          checked={task.done}
                          label={`Đánh dấu hoàn thành: ${task.text}`}
                          onChange={(next) =>
                            startTransition(async () => {
                              await toggleTask(task.id, next);
                            })
                          }
                        />
                      </div>
                      <span
                        className={`flex-1 min-w-0 text-xs lg:text-[13px] font-bold break-words ${
                          task.done
                            ? "text-[var(--p-muted)] line-through"
                            : "text-[var(--p-ink)]"
                        }`}
                      >
                        {task.text}
                      </span>
                    </li>
                  ))}
                  {day.tasks.length === 0 ? (
                    <li className="py-2 text-xs text-[var(--p-muted)]">
                      Chưa có việc nào
                    </li>
                  ) : null}
                </ul>

                {day.tasks.length > 3 ? (
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : day.key)}
                    className="mt-1 min-h-[32px] px-1 text-[11px] font-bold text-[var(--p-accent)] hover:underline underline-offset-4 self-start"
                  >
                    {isOpen ? "Thu gọn" : `Xem thêm ${day.tasks.length - 3}`}
                  </button>
                ) : null}

                <div className="mt-2 pt-2 border-t border-dashed border-[var(--p-line)]">
                  <QuickAdd
                    placeholder="Thêm việc…"
                    label={`Thêm việc cho ${day.date}`}
                    maxLength={120}
                    onAdd={(text) =>
                      startTransition(async () => {
                        await addTask({ date: day.key, text });
                      })
                    }
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
