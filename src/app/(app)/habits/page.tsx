import { redirect } from "next/navigation";

import { HabitsScreen } from "@/components/screens/habits";
import { getCurrentUser } from "@/lib/auth";
import { getHabitChecks, getHabits } from "@/lib/data";
import { startOfToday, toDateKey } from "@/lib/date";

export default async function HabitsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = startOfToday();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  // Lấy thêm 60 ngày trước để tính chuỗi hiện tại chính xác
  const from = toDateKey(
    new Date(Date.UTC(year, month, 1 - 60)),
  );
  const to = toDateKey(new Date(Date.UTC(year, month + 2, 0)));

  const [habits, checkMap] = await Promise.all([
    getHabits(user.id),
    getHabitChecks(user.id, from, to),
  ]);

  const checks = new Set<string>();
  for (const [habitId, dates] of checkMap) {
    for (const d of dates) checks.add(`${habitId}|${d}`);
  }

  return (
    <HabitsScreen habits={habits} checks={checks} year={year} month={month} />
  );
}
