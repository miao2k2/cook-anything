import "server-only";

import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";

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
} from "@/db/schema";
import {
  addDays,
  monthKey,
  startOfToday,
  toDateKey,
  todayKey,
  weekDays,
  weekKey,
} from "@/lib/date";

/* ------------------------------------------------------------------ */
/* Việc                                                               */
/* ------------------------------------------------------------------ */

export async function getTasksForDate(userId: string, date: string) {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.date, date)))
    .orderBy(asc(tasks.sortOrder), asc(tasks.createdAt));
}

/** Việc chưa xong của các ngày trước — "Việc còn tồn". */
export async function getCarriedOverTasks(userId: string, date: string) {
  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.done, false),
        lte(tasks.date, date),
      ),
    )
    .orderBy(desc(tasks.date))
    .limit(50);
}

/** Thống kê việc trong một khoảng ngày. */
export async function getTaskStats(
  userId: string,
  fromDate: string,
  toDate: string,
) {
  const rows = await db
    .select({
      date: tasks.date,
      done: tasks.done,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        gte(tasks.date, fromDate),
        lte(tasks.date, toDate),
      ),
    );

  const byDate = new Map<string, { total: number; done: number }>();
  for (const row of rows) {
    const entry = byDate.get(row.date) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (row.done) entry.done += 1;
    byDate.set(row.date, entry);
  }
  return byDate;
}

/* ------------------------------------------------------------------ */
/* Thói quen                                                           */
/* ------------------------------------------------------------------ */

export async function getHabits(userId: string) {
  return db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.archived, false)))
    .orderBy(asc(habits.sortOrder), asc(habits.createdAt));
}

/** Ngày đã tích của các thói quen trong khoảng [from, to]. */
export async function getHabitChecks(
  userId: string,
  fromDate: string,
  toDate: string,
) {
  const rows = await db
    .select({
      habitId: habitChecks.habitId,
      date: habitChecks.date,
    })
    .from(habitChecks)
    .innerJoin(habits, eq(habitChecks.habitId, habits.id))
    .where(
      and(
        eq(habits.userId, userId),
        gte(habitChecks.date, fromDate),
        lte(habitChecks.date, toDate),
      ),
    );

  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!map.has(row.habitId)) map.set(row.habitId, new Set());
    map.get(row.habitId)!.add(row.date);
  }
  return map;
}

/* ------------------------------------------------------------------ */
/* Mục tiêu                                                            */
/* ------------------------------------------------------------------ */

export type GoalWithSteps = Awaited<ReturnType<typeof getGoals>>[number];

export async function getGoals(userId: string) {
  const goalRows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(asc(goals.sortOrder), asc(goals.createdAt));

  if (goalRows.length === 0) return [];

  const steps = await db
    .select()
    .from(goalSteps)
    .where(inArray(goalSteps.goalId, goalRows.map((g) => g.id)))
    .orderBy(asc(goalSteps.sortOrder));

  const byGoal = new Map<string, typeof steps>();
  for (const step of steps) {
    if (!byGoal.has(step.goalId)) byGoal.set(step.goalId, []);
    byGoal.get(step.goalId)!.push(step);
  }

  return goalRows.map((goal) => ({
    ...goal,
    steps: byGoal.get(goal.id) ?? [],
  }));
}

export async function getCustomAreas(userId: string) {
  return db
    .select()
    .from(customAreas)
    .where(eq(customAreas.userId, userId))
    .orderBy(asc(customAreas.sortOrder), asc(customAreas.createdAt));
}

/* ------------------------------------------------------------------ */
/* Kế hoạch tháng / năm                                                */
/* ------------------------------------------------------------------ */

export async function getMonthPlans(userId: string, year: number) {
  const rows = await db
    .select()
    .from(monthPlans)
    .where(eq(monthPlans.userId, userId))
    .orderBy(asc(monthPlans.month), asc(monthPlans.sortOrder));

  return rows.filter((row) => row.month.startsWith(String(year)));
}

/* ------------------------------------------------------------------ */
/* Ghi chú                                                             */
/* ------------------------------------------------------------------ */

export async function getNote(userId: string, date: string) {
  const rows = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.date, date)))
    .limit(1);
  return rows[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Tổng hợp cho màn "Hôm nay"                                          */
/* ------------------------------------------------------------------ */

export type TodayBundle = {
  date: string;
  tasks: Awaited<ReturnType<typeof getTasksForDate>>;
  carriedOver: Awaited<ReturnType<typeof getCarriedOverTasks>>;
  habits: Awaited<ReturnType<typeof getHabits>>;
  /** Ngày đã tích, dạng "habitId|date". */
  habitChecks: Set<string>;
  weekTasks: Map<string, Awaited<ReturnType<typeof getTasksForDate>>>;
};

/** Gom toàn bộ dữ liệu cần cho màn "Hôm nay" trong 1 lần gọi. */
export async function getTodayBundle(userId: string): Promise<TodayBundle> {
  const date = todayKey();
  const now = startOfToday();

  const week = weekDays(now);
  const weekDates = week.map(toDateKey);
  const weekStartKey = weekDates[0];
  const weekEndKey = weekDates[6];

  const [taskRows, carriedRows, habitRows, checkMap, weekTaskRows] =
    await Promise.all([
      getTasksForDate(userId, date),
      getCarriedOverTasks(userId, date),
      getHabits(userId),
      getHabitChecks(userId, weekStartKey, weekEndKey),
      db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, userId),
            gte(tasks.date, weekStartKey),
            lte(tasks.date, weekEndKey),
          ),
        )
        .orderBy(asc(tasks.sortOrder), asc(tasks.createdAt)),
    ]);

  const weekTasks = new Map<string, Awaited<ReturnType<typeof getTasksForDate>>>();
  for (const row of weekTaskRows) {
    if (!weekTasks.has(row.date)) weekTasks.set(row.date, []);
    weekTasks.get(row.date)!.push(row);
  }

  const flatChecks = new Set<string>();
  for (const [habitId, dates] of checkMap) {
    for (const d of dates) flatChecks.add(`${habitId}|${d}`);
  }

  return {
    date,
    tasks: taskRows,
    carriedOver: carriedRows,
    habits: habitRows,
    habitChecks: flatChecks,
    weekTasks,
  };
}

/* ------------------------------------------------------------------ */
/* Thống kê                                                            */
/* ------------------------------------------------------------------ */

export type StatsBundle = {
  /** Task stats theo ngày trong khoảng đang xét. */
  daily: Map<string, { total: number; done: number }>;
  /** Số ngày có hoạt động liên tiếp tính từ hôm nay. */
  streak: number;
  /** Tổng số việc đã xong trong khoảng. */
  doneCount: number;
  /** Tổng số việc trong khoảng. */
  totalCount: number;
  /** Thói quen: tỉ lệ hoàn thành, số ngày tích, chuỗi hiện tại, chuỗi dài nhất. */
  habits: Array<{
    id: string;
    name: string;
    pct: number;
    checks: number;
    days: number;
    current: number;
    best: number;
  }>;
  /** Năng suất theo thứ trong tuần. */
  weekday: Array<{ idx: number; avg: number; total: number }>;
  /** Nhịp làm việc hằng ngày trong 7 ngày gần nhây. */
  recent: Array<{
    date: string;
    done: number;
    habits: number;
    total: number;
  }>;
};

function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function countHabitChecksOn(
  checkMap: Map<string, Set<string>>,
  date: string,
): number {
  let count = 0;
  for (const checks of checkMap.values()) {
    if (checks.has(date)) count++;
  }
  return count;
}

export async function getStats(
  userId: string,
  weeks: 4 | 8 | 12,
): Promise<StatsBundle> {
  const now = startOfToday();
  const from = addDays(now, -weeks * 7 + 1);
  const fromKey = toDateKey(from);
  const toKey = toDateKey(now);

  const [daily, habitList, checkMap, weekdayRows] = await Promise.all([
    getTaskStats(userId, fromKey, toKey),
    getHabits(userId),
    getHabitChecks(userId, fromKey, toKey),
    db
      .select({
        date: tasks.date,
        done: tasks.done,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          gte(tasks.date, toDateKey(addDays(now, -83))),
          lte(tasks.date, toKey),
        ),
      ),
  ]);

  // Chuỗi ngày liên tiếp có hoạt động
  let streak = 0;
  for (let i = 0; ; i++) {
    const key = toDateKey(addDays(now, -i));
    const stat = daily.get(key);
    const habitCount = countHabitChecksOn(checkMap, key);
    const active =
      (stat && (stat.total > 0 || stat.done > 0)) || habitCount > 0;
    if (!active) {
      if (i === 0) continue;
      break;
    }
    streak++;
    if (i > 400) break;
  }

  // Thống kê thói quen
  const days = weeks * 7;
  const habitStats = habitList.map((habit) => {
    const checks = checkMap.get(habit.id) ?? new Set<string>();
    const checkedCount = [...checks].filter((d) => d >= fromKey).length;
    const pct = days ? Math.round((checkedCount / days) * 100) : 0;

    let current = 0;
    for (let i = 0; ; i++) {
      const key = toDateKey(addDays(now, -i));
      if (checks.has(key)) {
        current++;
      } else if (i > 0) {
        break;
      }
      if (i > 400) break;
    }

    let best = 0;
    let run = 0;
    let prev: string | null = null;
    for (const key of [...checks].filter((d) => d >= fromKey).sort()) {
      if (prev && toDateKey(addDays(fromDateKey(prev), 1)) === key) {
        run++;
      } else {
        run = 1;
      }
      best = Math.max(best, run);
      prev = key;
    }

    return {
      id: habit.id,
      name: habit.name,
      pct,
      checks: checkedCount,
      days,
      current,
      best,
    };
  });

  // Năng suất theo thứ
  const weekdayTotals = Array.from({ length: 7 }, () => ({
    total: 0,
    count: 0,
    done: 0,
  }));
  for (const row of weekdayRows) {
    const d = fromDateKey(row.date);
    const idx = (d.getUTCDay() + 6) % 7;
    weekdayTotals[idx].count += 1;
    weekdayTotals[idx].total += 1;
    if (row.done) weekdayTotals[idx].done += 1;
  }
  const weekday = weekdayTotals.map((bucket, idx) => ({
    idx,
    avg: bucket.count ? Number((bucket.done / bucket.count).toFixed(2)) : 0,
    total: bucket.done,
  }));

  // 7 ngày gần nhất
  const recent: StatsBundle["recent"] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(now, -i);
    const key = toDateKey(date);
    const stat = daily.get(key) ?? { total: 0, done: 0 };
    recent.push({
      date: key,
      done: stat.done,
      habits: countHabitChecksOn(checkMap, key),
      total: stat.total,
    });
  }

  let doneCount = 0;
  let totalCount = 0;
  for (const stat of daily.values()) {
    doneCount += stat.done;
    totalCount += stat.total;
  }

  return {
    daily,
    streak,
    doneCount,
    totalCount,
    habits: habitStats,
    weekday,
    recent,
  };
}

/* ------------------------------------------------------------------ */
/* Tuần                                                                */
/* ------------------------------------------------------------------ */

export async function getWeekBundle(userId: string, anchor: Date) {
  const days = weekDays(anchor);
  const keys = days.map(toDateKey);
  const startKey = keys[0];
  const endKey = keys[6];

  const [taskRows, habitRows, checkMap] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          gte(tasks.date, startKey),
          lte(tasks.date, endKey),
        ),
      )
      .orderBy(asc(tasks.sortOrder), asc(tasks.createdAt)),
    getHabits(userId),
    getHabitChecks(userId, startKey, endKey),
  ]);

  const byDate = new Map<string, typeof taskRows>();
  for (const row of taskRows) {
    if (!byDate.has(row.date)) byDate.set(row.date, []);
    byDate.get(row.date)!.push(row);
  }

  const flatChecks = new Set<string>();
  for (const [habitId, dates] of checkMap) {
    for (const d of dates) flatChecks.add(`${habitId}|${d}`);
  }

  return {
    weekKey: weekKey(anchor),
    startKey,
    endKey,
    days,
    tasksByDate: byDate,
    habits: habitRows,
    habitChecks: flatChecks,
  };
}

/* ------------------------------------------------------------------ */
/* Năm                                                                 */
/* ------------------------------------------------------------------ */

export async function getYearBundle(userId: string, year: number) {
  const plans = await getMonthPlans(userId, year);

  const byMonth = new Map<string, typeof plans>();
  for (let m = 0; m < 12; m++) {
    byMonth.set(monthKey(new Date(Date.UTC(year, m, 1))), []);
  }
  for (const plan of plans) {
    const key = plan.month;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(plan);
  }

  return { year, byMonth };
}
