"use client";

import { useMemo, useState, useTransition } from "react";

import { Card, CardTitle } from "@/components/card";
import { Checkbox, ProgressRing } from "@/components/progress";
import { QuickAdd } from "@/components/quick-add";
import { TaskList } from "@/components/task-list";
import { Icon } from "@/components/icon";
import {
  addTask,
  carryAllOverToToday,
  toggleHabit,
} from "@/app/actions/planner";
import type { TodayBundle } from "@/lib/data";
import { percent, WEEKDAYS_SHORT, formatDayMonth } from "@/lib/date";

export function TodayScreen({ bundle }: { bundle: TodayBundle }) {
  const [, startTransition] = useTransition();
  const [expandedCarry, setExpandedCarry] = useState(false);

  const { tasks, habits, carriedOver, habitChecks, weekTasks, date } = bundle;

  const doneCount = tasks.filter((t) => t.done).length;
  const taskPct = percent(doneCount, tasks.length);

  const habitChecked = habits.filter((h) =>
    habitChecks.has(`${h.id}|${date}`),
  ).length;
  const habitPct = percent(habitChecked, habits.length);

  const overallPct = percent(
    doneCount + habitChecked,
    tasks.length + habits.length,
  );

  const carryList = useMemo(
    () => carriedOver.filter((t) => !t.done && t.date < date),
    [carriedOver, date],
  );

  const weekSummary = useMemo(
    () =>
      [...weekTasks.entries()].map(([day, list]) => ({
        day,
        done: list.filter((t) => t.done).length,
        total: list.length,
      })),
    [weekTasks],
  );

  const today = new Date(`${date}T00:00:00Z`);

  return (
    <div className="planner-fade-in">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--p-muted)]">
            {formatDayMonth(today)}
          </p>
          <h1 className="mt-0.5 text-2xl lg:text-4xl font-black text-[var(--p-ink)]">
            Hôm nay
          </h1>
        </div>
        <p className="text-sm font-bold text-[var(--p-muted)]">
          {doneCount}/{tasks.length} việc · {habitChecked}/{habits.length} thói quen
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-3 lg:gap-4 mb-3 lg:mb-4 items-start">
        <Card className="p-4 lg:p-5 flex flex-col items-center gap-3">
          <ProgressRing value={overallPct} size={150}>
            <div className="text-center">
              <div className="text-4xl font-black text-[var(--p-ink)] leading-none">
                {overallPct}%
              </div>
              <div className="mt-1 text-xs font-bold text-[var(--p-muted)]">
                tiến độ hôm nay
              </div>
            </div>
          </ProgressRing>

          <div className="w-full grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[var(--p-row)] px-3 py-2 text-center">
              <div className="text-lg font-black text-[var(--p-accent)]">
                {taskPct}%
              </div>
              <div className="text-[11px] font-bold text-[var(--p-muted)]">Việc</div>
            </div>
            <div className="rounded-xl bg-[var(--p-row)] px-3 py-2 text-center">
              <div className="text-lg font-black text-[var(--p-accent)]">
                {habitPct}%
              </div>
              <div className="text-[11px] font-bold text-[var(--p-muted)]">
                Thói quen
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-5">
          <CardTitle icon="week">Tuần này</CardTitle>
          <p className="text-sm text-[var(--p-muted)] mb-3">
            Nhìn tổng quan 7 ngày để lên kế hoạch trước.
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {weekSummary.map((day, i) => {
              const d = new Date(`${day.day}T00:00:00Z`);
              const isToday = day.day === date;
              const pct = percent(day.done, day.total);
              return (
                <a
                  key={day.day}
                  href={`/week?date=${day.day}`}
                  className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors ${
                    isToday
                      ? "bg-[var(--p-primary)] text-[var(--p-on-primary)]"
                      : "bg-[var(--p-row)] text-[var(--p-ink)] hover:brightness-95"
                  }`}
                  title={`${WEEKDAYS_SHORT[i]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}: ${day.done}/${day.total} việc`}
                >
                  <span className="text-[10px] lg:text-xs font-black">
                    {WEEKDAYS_SHORT[i]}
                  </span>
                  <span className="text-[10px] lg:text-xs font-bold tabular-nums opacity-80">
                    {d.getUTCDate()}/{d.getUTCMonth() + 1}
                  </span>
                  <span
                    className={`mt-0.5 text-[10px] font-black tabular-nums ${
                      isToday ? "" : "text-[var(--p-accent)]"
                    }`}
                  >
                    {day.total ? `${pct}%` : "—"}
                  </span>
                </a>
              );
            })}
          </div>
        </Card>
      </div>

      {carryList.length > 0 ? (
        <Card className="p-3.5 lg:p-5 mb-3 lg:mb-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="flex items-center gap-1 text-lg lg:text-xl font-extrabold text-[var(--p-ink)]">
              Việc còn tồn{" "}
              <span className="text-[var(--p-muted)] font-bold">
                ({carryList.length})
              </span>
            </h2>
            {carryList.length > 1 ? (
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    await carryAllOverToToday(date);
                  })
                }
                title="Chuyển tất cả vào hôm nay"
                className="min-h-[40px] px-1 text-sm font-bold text-[var(--p-accent)] hover:underline underline-offset-4 shrink-0"
              >
                <span className="lg:hidden">Chuyển hết</span>
                <span className="hidden lg:inline">
                  Chuyển tất cả vào hôm nay
                </span>
              </button>
            ) : null}
          </div>
          <p className="text-sm text-[var(--p-muted)] mb-2">
            Việc chưa xong từ những ngày trước. Chuyển vào hôm nay để làm
            tiếp, hoặc xoá nếu không cần nữa.
          </p>

          <ul className="m-0 p-0 list-none grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8">
            {carryList
              .slice(0, expandedCarry ? carryList.length : 4)
              .map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2 min-h-[44px] border-b border-dashed border-[var(--p-line)]"
                >
                  <span className="text-[11px] font-bold text-[var(--p-muted)] shrink-0 tabular-nums">
                    {task.date.slice(8, 10)}/{task.date.slice(5, 7)}
                  </span>
                  <span className="flex-1 min-w-0 text-sm lg:text-[15px] font-bold text-[var(--p-ink)] break-words">
                    {task.text}
                  </span>
                  <a
                    href={`/week?date=${task.date}`}
                    className="w-8 h-8 grid place-items-center rounded-lg text-[var(--p-muted)] hover:text-[var(--p-accent)]"
                    title="Xem ngày này"
                    aria-label={`Xem ngày ${task.date}`}
                  >
                    <Icon name="chev-r" size={16} />
                  </a>
                </li>
              ))}
          </ul>

          {carryList.length > 4 ? (
            <button
              type="button"
              onClick={() => setExpandedCarry((v) => !v)}
              className="mt-1 min-h-[40px] px-1 inline-flex items-center gap-1 text-sm font-bold text-[var(--p-accent)] hover:underline underline-offset-4"
            >
              {expandedCarry
                ? "Thu gọn"
                : `Xem thêm ${carryList.length - 4} việc`}
              <Icon
                name="chev-d"
                size={16}
                className={`transition-transform ${expandedCarry ? "rotate-180" : ""}`}
              />
            </button>
          ) : null}
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 items-start">
        <Card className="p-3.5 lg:p-5 min-w-0">
          <CardTitle icon="list">Việc hôm nay</CardTitle>
          <TaskList tasks={tasks} showMoveButton />
          <QuickAdd
            placeholder="Thêm việc cho hôm nay…"
            label="Thêm việc hôm nay"
            onAdd={(text) =>
              startTransition(async () => {
                await addTask({ date, text });
              })
            }
          />
        </Card>

        <Card className="p-3.5 lg:p-5 min-w-0">
          <CardTitle
            icon="habit"
            action={
              <a
                href="/habits"
                className="min-h-[40px] px-1 inline-flex items-center text-sm font-bold text-[var(--p-accent)] hover:underline underline-offset-4 shrink-0"
              >
                Quản lý →
              </a>
            }
          >
            Thói quen hôm nay
          </CardTitle>

          {habits.length > 0 ? (
            <ul className="m-0 p-0 list-none">
              {habits.map((habit) => {
                const checked = habitChecks.has(`${habit.id}|${date}`);
                return (
                  <li
                    key={habit.id}
                    className="flex items-center gap-2.5 min-h-[44px] border-b border-dashed border-[var(--p-line)] last:border-b-0"
                  >
                    <Checkbox
                      checked={checked}
                      label={`Tích thói quen: ${habit.name}`}
                      onChange={(next) =>
                        startTransition(async () => {
                          await toggleHabit(habit.id, date, next);
                        })
                      }
                    />
                    <span
                      className={`flex-1 min-w-0 text-sm lg:text-[15px] font-bold break-words ${
                        checked
                          ? "text-[var(--p-muted)] line-through"
                          : "text-[var(--p-ink)]"
                      }`}
                    >
                      {habit.name}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-3 text-sm text-[var(--p-muted)]">
              Chưa có thói quen nào. Thêm thói quen ở màn “Theo dõi thói quen”.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
