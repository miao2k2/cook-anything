"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  customAreas,
  goals,
  goalSteps,
  habitChecks,
  habits,
  monthPlans,
  notes,
  tasks,
  users,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateId } from "@/lib/crypto";
import { todayKey } from "@/lib/date";

const MAX_TASKS_PER_DAY = 15;
const MAX_TASK_LENGTH = 120;
const MAX_HABITS = 12;
const MAX_HABIT_NAME = 60;
const MAX_GOALS = 30;
const MAX_GOAL_TITLE = 120;
const MAX_GOAL_STEPS = 12;
const MAX_CUSTOM_AREAS = 5;
const MAX_MONTH_ITEMS = 12;

function revalidatePlanner() {
  revalidatePath("/", "layout");
}

/* ------------------------------------------------------------------ */
/* Việc                                                               */
/* ------------------------------------------------------------------ */

export async function addTask(input: {
  date?: string;
  text: string;
  priority?: number | null;
  carriedFrom?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const date = input.date ?? todayKey();
  const text = input.text.trim().slice(0, MAX_TASK_LENGTH);

  if (!text) return { ok: false, error: "Nội dung việc không được để trống." };

  const existing = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.userId, user.id), eq(tasks.date, date)));

  if (existing.length >= MAX_TASKS_PER_DAY) {
    return {
      ok: false,
      error: `Mỗi ngày tối đa ${MAX_TASKS_PER_DAY} việc.`,
    };
  }

  const maxOrder = await db
    .select({ sortOrder: tasks.sortOrder })
    .from(tasks)
    .where(and(eq(tasks.userId, user.id), eq(tasks.date, date)))
    .orderBy(tasks.sortOrder);

  const nextOrder =
    maxOrder.length > 0
      ? Math.max(...maxOrder.map((r) => r.sortOrder)) + 1
      : 0;

  await db.insert(tasks).values({
    id: generateId(),
    userId: user.id,
    date,
    text,
    priority: input.priority ?? null,
    carriedFrom: input.carriedFrom ?? null,
    sortOrder: nextOrder,
  });

  revalidatePlanner();
  return { ok: true };
}

export async function toggleTask(
  taskId: string,
  done: boolean,
): Promise<void> {
  const user = await requireUser();

  await db
    .update(tasks)
    .set({
      done,
      completedAt: done ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));

  revalidatePlanner();
}

export async function updateTask(
  taskId: string,
  patch: { text?: string; priority?: number | null },
): Promise<void> {
  const user = await requireUser();
  const set: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };

  if (patch.text !== undefined) {
    set.text = patch.text.trim().slice(0, MAX_TASK_LENGTH);
  }
  if (patch.priority !== undefined) {
    set.priority = patch.priority;
  }

  await db
    .update(tasks)
    .set(set)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));

  revalidatePlanner();
}

export async function removeTask(taskId: string): Promise<void> {
  const user = await requireUser();

  await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));

  revalidatePlanner();
}

/** Chuyển việc sang ngày khác. */
export async function moveTask(
  taskId: string,
  toDate: string,
): Promise<void> {
  const user = await requireUser();

  await db
    .update(tasks)
    .set({ date: toDate, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));

  revalidatePlanner();
}

/** Chuyển toàn bộ việc còn tồn sang hôm nay. */
export async function carryAllOverToToday(date = todayKey()): Promise<void> {
  const user = await requireUser();

  await db
    .update(tasks)
    .set({ date, carriedFrom: date, updatedAt: new Date() })
    .where(
      and(
        eq(tasks.userId, user.id),
        eq(tasks.done, false),
        // chỉ chuyển những việc thực sự nằm ở ngày trước
        isNull(tasks.carriedFrom),
      ),
    );

  revalidatePlanner();
}

/* ------------------------------------------------------------------ */
/* Thói quen                                                           */
/* ------------------------------------------------------------------ */

export async function toggleHabit(
  habitId: string,
  date: string,
  checked: boolean,
): Promise<void> {
  const user = await requireUser();

  const habit = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)))
    .limit(1);

  if (!habit.length) return;

  if (checked) {
    await db
      .insert(habitChecks)
      .values({ habitId, date })
      .onConflictDoNothing();
  } else {
    await db
      .delete(habitChecks)
      .where(and(eq(habitChecks.habitId, habitId), eq(habitChecks.date, date)));
  }

  revalidatePlanner();
}

export async function addHabit(name: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const clean = name.trim().slice(0, MAX_HABIT_NAME);

  if (!clean) return { ok: false, error: "Tên thói quen không được để trống." };

  const existing = await db
    .select({ id: habits.id })
    .from(habits)
    .where(and(eq(habits.userId, user.id), eq(habits.archived, false)));

  if (existing.length >= MAX_HABITS) {
    return { ok: false, error: `Tối đa ${MAX_HABITS} thói quen.` };
  }

  await db.insert(habits).values({
    id: generateId(),
    userId: user.id,
    name: clean,
    sortOrder: existing.length,
  });

  revalidatePlanner();
  return { ok: true };
}

export async function removeHabit(habitId: string): Promise<void> {
  const user = await requireUser();

  await db
    .delete(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)));

  revalidatePlanner();
}

/* ------------------------------------------------------------------ */
/* Mục tiêu                                                            */
/* ------------------------------------------------------------------ */

export async function addGoal(input: {
  areaId: string;
  title: string;
  description?: string;
  deadline?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const title = input.title.trim().slice(0, MAX_GOAL_TITLE);

  if (!title) return { ok: false, error: "Tên mục tiêu không được để trống." };

  const existing = await db
    .select({ id: goals.id })
    .from(goals)
    .where(eq(goals.userId, user.id));

  if (existing.length >= MAX_GOALS) {
    return { ok: false, error: `Tối đa ${MAX_GOALS} mục tiêu.` };
  }

  await db.insert(goals).values({
    id: generateId(),
    userId: user.id,
    areaId: input.areaId,
    title,
    description: input.description?.trim() ?? null,
    deadline: input.deadline ?? null,
    sortOrder: existing.length,
  });

  revalidatePlanner();
  return { ok: true };
}

export async function updateGoal(
  goalId: string,
  patch: {
    title?: string;
    description?: string | null;
    deadline?: string | null;
    areaId?: string;
  },
): Promise<void> {
  const user = await requireUser();
  const set: Partial<typeof goals.$inferInsert> = { updatedAt: new Date() };

  if (patch.title !== undefined) {
    set.title = patch.title.trim().slice(0, MAX_GOAL_TITLE);
  }
  if (patch.description !== undefined) set.description = patch.description;
  if (patch.deadline !== undefined) set.deadline = patch.deadline;
  if (patch.areaId !== undefined) set.areaId = patch.areaId;

  await db
    .update(goals)
    .set(set)
    .where(and(eq(goals.id, goalId), eq(goals.userId, user.id)));

  revalidatePlanner();
}

export async function toggleGoal(
  goalId: string,
  done: boolean,
): Promise<void> {
  const user = await requireUser();

  await db
    .update(goals)
    .set({ done, updatedAt: new Date() })
    .where(and(eq(goals.id, goalId), eq(goals.userId, user.id)));

  revalidatePlanner();
}

export async function removeGoal(goalId: string): Promise<void> {
  const user = await requireUser();

  await db
    .delete(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, user.id)));

  revalidatePlanner();
}

export async function addGoalStep(
  goalId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const clean = text.trim().slice(0, 100);

  if (!clean) return { ok: false, error: "Bước không được để trống." };

  const goal = await db
    .select({ id: goals.id })
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, user.id)))
    .limit(1);

  if (!goal.length) return { ok: false, error: "Không tìm thấy mục tiêu." };

  const steps = await db
    .select({ id: goalSteps.id })
    .from(goalSteps)
    .where(eq(goalSteps.goalId, goalId));

  if (steps.length >= MAX_GOAL_STEPS) {
    return { ok: false, error: `Tối đa ${MAX_GOAL_STEPS} bước nhỏ.` };
  }

  await db.insert(goalSteps).values({
    id: generateId(),
    goalId,
    text: clean,
    sortOrder: steps.length,
  });

  revalidatePlanner();
  return { ok: true };
}

export async function toggleGoalStep(
  stepId: string,
  done: boolean,
): Promise<void> {
  const user = await requireUser();

  const step = await db
    .select({ goalId: goalSteps.goalId })
    .from(goalSteps)
    .innerJoin(goals, eq(goalSteps.goalId, goals.id))
    .where(and(eq(goalSteps.id, stepId), eq(goals.userId, user.id)))
    .limit(1);

  if (!step.length) return;

  await db
    .update(goalSteps)
    .set({ done })
    .where(eq(goalSteps.id, stepId));

  revalidatePlanner();
}

export async function removeGoalStep(stepId: string): Promise<void> {
  const user = await requireUser();

  const step = await db
    .select({ goalId: goalSteps.goalId })
    .from(goalSteps)
    .innerJoin(goals, eq(goalSteps.goalId, goals.id))
    .where(and(eq(goalSteps.id, stepId), eq(goals.userId, user.id)))
    .limit(1);

  if (!step.length) return;

  await db.delete(goalSteps).where(eq(goalSteps.id, stepId));

  revalidatePlanner();
}

/* ------------------------------------------------------------------ */
/* Lĩnh vực tuỳ chỉnh                                                */
/* ------------------------------------------------------------------ */

export async function addCustomArea(
  name: string,
  icon = "sprout",
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const clean = name.trim().slice(0, 24);

  if (!clean) return { ok: false, error: "Tên lĩnh vực không được để trống." };

  const existing = await db
    .select({ id: customAreas.id })
    .from(customAreas)
    .where(eq(customAreas.userId, user.id));

  if (existing.length >= MAX_CUSTOM_AREAS) {
    return { ok: false, error: `Tối đa ${MAX_CUSTOM_AREAS} lĩnh vực tuỳ chỉnh.` };
  }

  await db.insert(customAreas).values({
    id: generateId(),
    userId: user.id,
    name: clean,
    icon,
    sortOrder: existing.length,
  });

  revalidatePlanner();
  return { ok: true };
}

export async function removeCustomArea(areaId: string): Promise<void> {
  const user = await requireUser();

  await db
    .delete(customAreas)
    .where(and(eq(customAreas.id, areaId), eq(customAreas.userId, user.id)));

  revalidatePlanner();
}

/* ------------------------------------------------------------------ */
/* Kế hoạch năm                                                        */
/* ------------------------------------------------------------------ */

export async function updateYearMeta(
  patch: { yearWord?: string | null; yearVision?: string | null },
): Promise<void> {
  const user = await requireUser();
  const set: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

  if (patch.yearWord !== undefined) {
    set.yearWord = patch.yearWord?.trim().slice(0, 40) || null;
  }
  if (patch.yearVision !== undefined) {
    set.yearVision = patch.yearVision?.trim().slice(0, 600) || null;
  }

  await db.update(users).set(set).where(eq(users.id, user.id));

  revalidatePlanner();
}

export async function addMonthPlan(input: {
  month: string;
  title: string;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const title = input.title.trim().slice(0, 120);

  if (!title) return { ok: false, error: "Kế hoạch không được để trống." };

  const existing = await db
    .select({ id: monthPlans.id })
    .from(monthPlans)
    .where(
      and(
        eq(monthPlans.userId, user.id),
        eq(monthPlans.month, input.month),
      ),
    );

  if (existing.length >= MAX_MONTH_ITEMS) {
    return { ok: false, error: `Tối đa ${MAX_MONTH_ITEMS} kế hoạch mỗi tháng.` };
  }

  await db.insert(monthPlans).values({
    id: generateId(),
    userId: user.id,
    month: input.month,
    title,
    sortOrder: existing.length,
  });

  revalidatePlanner();
  return { ok: true };
}

export async function toggleMonthPlan(
  planId: string,
  done: boolean,
): Promise<void> {
  const user = await requireUser();

  await db
    .update(monthPlans)
    .set({ done })
    .where(and(eq(monthPlans.id, planId), eq(monthPlans.userId, user.id)));

  revalidatePlanner();
}

export async function removeMonthPlan(planId: string): Promise<void> {
  const user = await requireUser();

  await db
    .delete(monthPlans)
    .where(and(eq(monthPlans.id, planId), eq(monthPlans.userId, user.id)));

  revalidatePlanner();
}

/* ------------------------------------------------------------------ */
/* Ghi chú nhanh                                                       */
/* ------------------------------------------------------------------ */

export async function saveNote(date: string, content: string): Promise<void> {
  const user = await requireUser();
  const clean = content.slice(0, 1000);

  await db
    .insert(notes)
    .values({
      id: generateId(),
      userId: user.id,
      date,
      content: clean,
    })
    .onConflictDoUpdate({
      target: [notes.userId, notes.date],
      set: { content: clean, updatedAt: new Date() },
    });

  revalidatePlanner();
}

/* ------------------------------------------------------------------ */
/* Cài đặt                                                             */
/* ------------------------------------------------------------------ */

export async function updateSettings(
  patch: {
    themeId?: string;
    darkMode?: boolean;
    name?: string | null;
    reminderEnabled?: boolean;
    reminderHour?: number;
  },
): Promise<void> {
  const user = await requireUser();
  const set: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

  if (patch.themeId !== undefined) set.themeId = patch.themeId;
  if (patch.darkMode !== undefined) set.darkMode = patch.darkMode;
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.reminderEnabled !== undefined) {
    set.reminderEnabled = patch.reminderEnabled;
  }
  if (patch.reminderHour !== undefined) {
    set.reminderHour = Math.max(0, Math.min(23, patch.reminderHour));
  }

  await db.update(users).set(set).where(eq(users.id, user.id));

  revalidatePlanner();
}

export async function completeOnboarding(): Promise<void> {
  const user = await requireUser();

  await db.update(users).set({ onboarded: true }).where(eq(users.id, user.id));

  revalidatePlanner();
}
