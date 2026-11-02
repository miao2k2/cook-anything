"use client";

import { useMemo, useState, useTransition } from "react";

import { Card, CardTitle } from "@/components/card";
import { Icon } from "@/components/icon";
import { ProgressBar } from "@/components/progress";
import { RadarChart } from "@/components/radar-chart";
import {
  addGoal,
  addGoalStep,
  removeGoal,
  removeGoalStep,
  toggleGoal,
  toggleGoalStep,
} from "@/app/actions/planner";
import { DEFAULT_AREAS, areaById } from "@/lib/areas";
import { deadlineInfo, percent } from "@/lib/date";
import type { GoalWithSteps } from "@/lib/data";

type AreaOption = { id: string; name: string; icon: string; short?: string };

export function GoalsScreen({
  goals,
  customAreas,
}: {
  goals: GoalWithSteps[];
  customAreas: AreaOption[];
}) {
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("all");
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newArea, setNewArea] = useState<string>(DEFAULT_AREAS[0].id);
  const [newDeadline, setNewDeadline] = useState("");
  const [openGoalId, setOpenGoalId] = useState<string | null>(null);
  const [stepDraft, setStepDraft] = useState("");

  const areas = useMemo<AreaOption[]>(
    () => [
      ...DEFAULT_AREAS.map((a) => ({
        id: a.id,
        name: a.name,
        icon: a.icon,
        short: a.short,
      })),
      ...customAreas.map((a) => ({
        id: a.id,
        name: a.name,
        icon: a.icon || "sprout",
      })),
    ],
    [customAreas],
  );

  const filtered = useMemo(
    () => (filter === "all" ? goals : goals.filter((g) => g.areaId === filter)),
    [goals, filter],
  );

  const balance = useMemo(() => {
    return areas.map((area) => {
      const list = goals.filter((g) => g.areaId === area.id);
      const avg =
        list.length === 0
          ? 0
          : Math.round(
              list.reduce((sum, g) => {
                if (g.done) return sum + 100;
                const doneSteps = g.steps.filter((s) => s.done).length;
                const pct =
                  g.steps.length > 0
                    ? percent(doneSteps, g.steps.length)
                    : 0;
                return sum + pct;
              }, 0) / list.length,
            );
      return {
        label: area.short ?? area.name,
        value: avg,
        note: list.length ? `${list.length} mục tiêu` : "Chưa có mục tiêu",
      };
    });
  }, [areas, goals]);

  return (
    <div className="planner-fade-in">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--p-muted)]">
            Tầm nhìn
          </p>
          <h1 className="mt-0.5 text-2xl lg:text-4xl font-black text-[var(--p-ink)]">
            Mục tiêu
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-[var(--p-primary)] text-[var(--p-on-primary)] font-extrabold shadow-sm hover:brightness-105 transition"
        >
          <Icon name="plus" size={18} />
          Thêm mục tiêu
        </button>
      </div>

      {adding ? (
        <Card className="p-4 lg:p-5 mb-3 lg:mb-4">
          <CardTitle icon="plus">Thêm mục tiêu mới</CardTitle>

          <div className="mt-3 grid gap-3">
            <div>
              <label
                htmlFor="goal-title"
                className="block mb-1 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]"
              >
                Tên mục tiêu
              </label>
              <input
                id="goal-title"
                value={newTitle}
                maxLength={120}
                placeholder="Ví dụ: Chạy 5km mỗi tuần"
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[var(--p-row)] text-sm lg:text-base font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="goal-area"
                  className="block mb-1 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]"
                >
                  Lĩnh vực
                </label>
                <select
                  id="goal-area"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[var(--p-row)] text-sm font-bold text-[var(--p-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
                >
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="goal-deadline"
                  className="block mb-1 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]"
                >
                  Hạn chót
                </label>
                <input
                  id="goal-deadline"
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[var(--p-row)] text-sm font-bold text-[var(--p-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    const ok = await addGoal({
                      areaId: newArea,
                      title: newTitle,
                      deadline: newDeadline || null,
                    });
                    if (ok.ok) {
                      setNewTitle("");
                      setNewDeadline("");
                      setAdding(false);
                    }
                  })
                }
                disabled={!newTitle.trim()}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-[var(--p-primary)] text-[var(--p-on-primary)] font-extrabold disabled:opacity-50"
              >
                <Icon name="check" size={18} />
                Lưu mục tiêu
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="min-h-[44px] px-4 rounded-xl bg-[var(--p-row)] text-[var(--p-ink)] font-extrabold"
              >
                Huỷ
              </button>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(0,360px)] gap-3 lg:gap-4 items-start">
        <div className="min-w-0">
          <div
            role="group"
            aria-label="Lọc theo lĩnh vực"
            className="flex flex-wrap justify-center gap-2 mb-3"
          >
            <button
              type="button"
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs lg:text-sm font-bold transition-colors"
              style={
                filter === "all"
                  ? { background: "var(--p-primary)", color: "var(--p-on-primary)" }
                  : { background: "var(--p-row)", color: "var(--p-ink)" }
              }
            >
              <Icon name="list" size={16} />
              Tất cả
              <span className="opacity-70 tabular-nums">{goals.length}</span>
            </button>

            {areas.map((area) => {
              const count = goals.filter((g) => g.areaId === area.id).length;
              const active = filter === area.id;
              return (
                <button
                  key={area.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(active ? "all" : area.id)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs lg:text-sm font-bold transition-colors"
                  style={
                    active
                      ? {
                          background: "var(--p-primary)",
                          color: "var(--p-on-primary)",
                        }
                      : { background: "var(--p-row)", color: "var(--p-ink)" }
                  }
                >
                  <Icon name={area.icon} size={16} />
                  {area.name}
                  <span className="opacity-70 tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="font-bold text-[var(--p-ink)]">
                {goals.length === 0
                  ? "Chưa có mục tiêu nào"
                  : "Không có mục tiêu trong lĩnh vực này"}
              </p>
              <p className="mt-1 text-sm text-[var(--p-muted)]">
                {goals.length === 0
                  ? "Thêm mục tiêu đầu tiên để bắt đầu theo dõi tiến độ."
                  : "Chọn lĩnh vực khác để xem thêm."}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 lg:gap-3">
              {filtered.map((goal) => {
                const area = areaById(goal.areaId);
                const doneSteps = goal.steps.filter((s) => s.done).length;
                const pct = goal.done
                  ? 100
                  : percent(doneSteps, goal.steps.length);
                const deadline = deadlineInfo(goal.deadline);
                const open = openGoalId === goal.id;

                return (
                  <Card key={goal.id} className="p-3.5 lg:p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="grid place-items-center w-9 h-9 shrink-0 rounded-full bg-[var(--p-row)] text-[var(--p-accent)]">
                        <Icon name={area?.icon ?? "flag"} size={18} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            startTransition(async () => {
                              await toggleGoal(goal.id, !goal.done);
                            })
                          }
                          className={`text-left text-sm lg:text-[15px] font-extrabold break-words w-full ${
                            goal.done
                              ? "text-[var(--p-muted)] line-through"
                              : "text-[var(--p-ink)]"
                          }`}
                        >
                          {goal.title}
                        </button>
                        <p className="text-[11px] font-bold text-[var(--p-muted)] mt-0.5">
                          {area?.name ?? "Lĩnh vực riêng"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            await removeGoal(goal.id);
                          })
                        }
                        title="Xoá mục tiêu"
                        aria-label={`Xoá mục tiêu: ${goal.title}`}
                        className="w-8 h-8 grid place-items-center rounded-lg text-[var(--p-muted)] hover:text-rose-500 shrink-0"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>

                    {deadline ? (
                      <p
                        className={`text-[11px] font-bold mb-2 ${
                          deadline.late ? "text-rose-500" : "text-[var(--p-muted)]"
                        }`}
                      >
                        <Icon name="clock" size={12} className="inline mb-0.5 mr-1" />
                        {deadline.text}
                      </p>
                    ) : null}

                    <ProgressBar value={pct} height={7} />

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[var(--p-muted)] tabular-nums">
                        {goal.steps.length > 0
                          ? `${doneSteps}/${goal.steps.length} bước`
                          : "Chưa có bước nhỏ"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenGoalId(open ? null : goal.id)
                        }
                        className="min-h-[32px] px-1 text-[11px] font-bold text-[var(--p-accent)] hover:underline underline-offset-4"
                      >
                        {open ? "Thu gọn" : "Bước nhỏ"}
                      </button>
                    </div>

                    {open ? (
                      <div className="mt-2 pt-2 border-t border-dashed border-[var(--p-line)]">
                        <ul className="m-0 p-0 list-none grid gap-1">
                          {goal.steps.map((step) => (
                            <li key={step.id} className="flex items-center gap-2">
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={step.done}
                                onClick={() =>
                                  startTransition(async () => {
                                    await toggleGoalStep(step.id, !step.done);
                                  })
                                }
                                className={`grid place-items-center w-5 h-5 shrink-0 rounded-md border-2 transition ${
                                  step.done
                                    ? "bg-[var(--p-primary)] border-[var(--p-primary)] text-[var(--p-on-primary)]"
                                    : "border-[var(--p-line)] text-transparent"
                                }`}
                              >
                                <Icon name="check" size={12} strokeWidth={3} />
                              </button>
                              <span
                                className={`flex-1 min-w-0 text-xs font-bold break-words ${
                                  step.done
                                    ? "text-[var(--p-muted)] line-through"
                                    : "text-[var(--p-ink)]"
                                }`}
                              >
                                {step.text}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  startTransition(async () => {
                                    await removeGoalStep(step.id);
                                  })
                                }
                                aria-label={`Xoá bước: ${step.text}`}
                                className="w-6 h-6 grid place-items-center rounded text-[var(--p-muted)] hover:text-rose-500"
                              >
                                <Icon name="x" size={13} />
                              </button>
                            </li>
                          ))}
                        </ul>

                        <form
                          className="flex items-center gap-1.5 mt-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const text = stepDraft.trim();
                            if (!text) return;
                            setStepDraft("");
                            startTransition(async () => {
                              await addGoalStep(goal.id, text);
                            });
                          }}
                        >
                          <input
                            value={stepDraft}
                            maxLength={100}
                            placeholder="Thêm bước nhỏ…"
                            onChange={(e) => setStepDraft(e.target.value)}
                            className="flex-1 min-w-0 h-9 px-2.5 rounded-lg bg-[var(--p-row)] text-xs font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
                          />
                          <button
                            type="submit"
                            disabled={!stepDraft.trim()}
                            className="w-9 h-9 grid place-items-center rounded-lg bg-[var(--p-primary)] text-[var(--p-on-primary)] disabled:opacity-50 shrink-0"
                            aria-label="Thêm bước"
                          >
                            <Icon name="plus" size={16} />
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Card className="p-4 lg:p-5">
          <CardTitle icon="chart">Cân bằng các lĩnh vực</CardTitle>
          <p className="text-sm text-[var(--p-muted)] mb-2">
            Tiến độ trung bình các mục tiêu trong từng lĩnh vực
          </p>
          <RadarChart axes={balance} />
        </Card>
      </div>
    </div>
  );
}
