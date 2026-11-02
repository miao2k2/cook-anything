import { redirect } from "next/navigation";

import { WeekScreen } from "@/components/screens/week";
import { getCurrentUser } from "@/lib/auth";
import { getTaskStats, getWeekBundle } from "@/lib/data";
import {
  percent,
  shiftWeek,
  startOfToday,
  toDateKey,
  weekDays,
  WEEKDAYS_FULL,
} from "@/lib/date";

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const offset = Number(params.offset ?? 0) || 0;

  const anchor = shiftWeek(startOfToday(), offset);
  const bundle = await getWeekBundle(user.id, anchor);

  const today = toDateKey(startOfToday());

  const days = bundle.days.map((d, i) => {
    const key = toDateKey(d);
    return {
      key,
      label: WEEKDAYS_FULL[i],
      date: key,
      isToday: key === today,
      tasks: (bundle.tasksByDate.get(key) ?? []).map((t) => ({
        id: t.id,
        text: t.text,
        done: t.done,
        priority: t.priority,
      })),
    };
  });

  // So sánh với tuần trước
  const prevAnchor = shiftWeek(anchor, -1);
  const prevDays = weekDays(prevAnchor);
  const prevStart = toDateKey(prevDays[0]);
  const prevEnd = toDateKey(prevDays[6]);
  const prevStats = await getTaskStats(user.id, prevStart, prevEnd);

  let prevTotal = 0;
  let prevDone = 0;
  for (const stat of prevStats.values()) {
    prevTotal += stat.total;
    prevDone += stat.done;
  }

  let total = 0;
  let done = 0;
  for (const day of days) {
    total += day.tasks.length;
    done += day.tasks.filter((t) => t.done).length;
  }

  return (
    <WeekScreen
      days={days}
      habits={bundle.habits.map((h) => ({ id: h.id, name: h.name }))}
      habitChecks={bundle.habitChecks}
      weekLabel={bundle.weekKey}
      prevPct={prevTotal > 0 ? percent(prevDone, prevTotal) : null}
      currentPct={percent(done, total)}
    />
  );
}
