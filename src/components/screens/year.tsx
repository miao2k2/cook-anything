"use client";

import { useState, useTransition } from "react";

import { Card } from "@/components/card";
import { Icon } from "@/components/icon";
import { ProgressRing } from "@/components/progress";
import {
  addMonthPlan,
  removeMonthPlan,
  toggleMonthPlan,
  updateYearMeta,
} from "@/app/actions/planner";
import { MONTHS, percent } from "@/lib/date";

export type MonthPlanItem = {
  id: string;
  month: string;
  title: string;
  done: boolean;
};

export function YearScreen({
  year,
  plansByMonth,
  yearWord,
  yearVision,
}: {
  year: number;
  plansByMonth: Map<string, MonthPlanItem[]>;
  yearWord: string | null;
  yearVision: string | null;
}) {
  const [, startTransition] = useTransition();
  const [word, setWord] = useState(yearWord ?? "");
  const [vision, setVision] = useState(yearVision ?? "");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const allPlans = [...plansByMonth.values()].flat();
  const totalDone = allPlans.filter((p) => p.done).length;
  const overallPct = percent(totalDone, allPlans.length);

  function saveMeta() {
    startTransition(async () => {
      await updateYearMeta({ yearWord: word, yearVision: vision });
    });
  }

  return (
    <div className="planner-fade-in">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--p-muted)]">
            Tầm nhìn dài hạn
          </p>
          <h1 className="mt-0.5 text-2xl lg:text-4xl font-black text-[var(--p-ink)]">
            Kế hoạch năm {year}
          </h1>
        </div>
        <a
          href="/year?year=0"
          className="inline-flex items-center min-h-[44px] px-4 rounded-xl bg-[var(--p-row)] text-sm font-extrabold text-[var(--p-ink)] hover:brightness-95"
        >
          Năm hiện tại
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-3 lg:gap-4 mb-3 lg:mb-4 items-start">
        <Card className="p-4 lg:p-5">
          <div className="flex items-center gap-4">
            <ProgressRing value={overallPct} size={92} strokeWidth={9}>
              <div className="text-center">
                <div className="text-xl font-black text-[var(--p-ink)] leading-none">
                  {overallPct}%
                </div>
                <div className="text-[10px] font-bold text-[var(--p-muted)]">
                  cả năm
                </div>
              </div>
            </ProgressRing>
            <div className="min-w-0">
              <div className="text-base lg:text-lg font-extrabold text-[var(--p-ink)]">
                {totalDone}
                <span className="text-[var(--p-muted)]">/{allPlans.length}</span>{" "}
                kế hoạch
              </div>
              <div className="text-sm font-bold text-[var(--p-muted)]">đã xong</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 lg:p-5">
          <label
            htmlFor="year-word"
            className="block mb-1 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]"
          >
            Từ khóa của năm
          </label>
          <input
            id="year-word"
            value={word}
            maxLength={40}
            placeholder="Ví dụ: Bứt phá"
            onChange={(e) => setWord(e.target.value)}
            onBlur={saveMeta}
            className="block w-full h-10 bg-transparent px-3 text-base font-bold text-[var(--p-accent)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none rounded-xl bg-[var(--p-row)]"
          />

          <label
            htmlFor="year-vision"
            className="block mt-2.5 mb-1 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]"
          >
            Tầm nhìn năm nay
          </label>
          <textarea
            id="year-vision"
            value={vision}
            maxLength={600}
            rows={4}
            placeholder="Một năm mới mình muốn có gì?"
            onChange={(e) => setVision(e.target.value)}
            onBlur={saveMeta}
            className="block w-full bg-[var(--p-row)] px-3 py-2.5 text-sm lg:text-base font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none rounded-xl resize-y"
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 lg:gap-3">
        {MONTHS.map((label, index) => {
          const monthKey = `${year}-${String(index + 1).padStart(2, "0")}`;
          const plans = plansByMonth.get(monthKey) ?? [];
          const done = plans.filter((p) => p.done).length;
          const pct = percent(done, plans.length);
          const draft = drafts[monthKey] ?? "";

          return (
            <Card key={monthKey} className="p-3.5 lg:p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="text-base lg:text-lg font-extrabold text-[var(--p-ink)]">
                  {label}
                </h2>
                <span className="text-sm font-black text-[var(--p-primary)] tabular-nums">
                  {plans.length ? `${pct}%` : "—"}
                </span>
              </div>

              <ul className="m-0 p-0 list-none">
                {plans.map((plan) => (
                  <li
                    key={plan.id}
                    className="flex items-start gap-2 min-h-[34px] py-0.5"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={plan.done}
                      onClick={() =>
                        startTransition(async () => {
                          await toggleMonthPlan(plan.id, !plan.done);
                        })
                      }
                      className={`mt-0.5 grid place-items-center w-5 h-5 shrink-0 rounded-md border-2 transition ${
                        plan.done
                          ? "bg-[var(--p-primary)] border-[var(--p-primary)] text-[var(--p-on-primary)]"
                          : "border-[var(--p-line)] text-transparent"
                      }`}
                    >
                      <Icon name="check" size={12} strokeWidth={3} />
                    </button>
                    <span
                      className={`flex-1 min-w-0 text-xs lg:text-[13px] font-bold break-words ${
                        plan.done
                          ? "text-[var(--p-muted)] line-through"
                          : "text-[var(--p-ink)]"
                      }`}
                    >
                      {plan.title}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(async () => {
                          await removeMonthPlan(plan.id);
                        })
                      }
                      aria-label={`Xoá: ${plan.title}`}
                      className="w-6 h-6 grid place-items-center rounded text-[var(--p-muted)] hover:text-rose-500 shrink-0"
                    >
                      <Icon name="x" size={13} />
                    </button>
                  </li>
                ))}
              </ul>

              <form
                className="flex items-center gap-1.5 mt-2 pt-2 border-t border-dashed border-[var(--p-line)]"
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = draft.trim();
                  if (!text) return;
                  setDrafts((d) => ({ ...d, [monthKey]: "" }));
                  startTransition(async () => {
                    await addMonthPlan({ month: monthKey, title: text });
                  });
                }}
              >
                <input
                  value={draft}
                  maxLength={120}
                  placeholder="Thêm kế hoạch…"
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [monthKey]: e.target.value }))
                  }
                  className="flex-1 min-w-0 h-9 px-2.5 rounded-lg bg-[var(--p-row)] text-xs font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Thêm kế hoạch"
                  className="w-9 h-9 grid place-items-center rounded-lg bg-[var(--p-primary)] text-[var(--p-on-primary)] disabled:opacity-50 shrink-0"
                >
                  <Icon name="plus" size={16} />
                </button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
