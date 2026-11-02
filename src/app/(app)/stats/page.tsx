import { redirect } from "next/navigation";

import { StatsScreen } from "@/components/screens/stats";
import { getCurrentUser } from "@/lib/auth";
import { getStats } from "@/lib/data";
import { addDays, startOfToday, toDateKey } from "@/lib/date";

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const raw = Number(params.range);
  const range = raw === 8 || raw === 12 ? raw : 4;

  const bundle = await getStats(user.id, range);

  const now = startOfToday();

  const daily: Array<{ date: string; total: number; done: number }> = [];
  for (let i = 0; i < range * 7; i++) {
    const date = toDateKey(addDays(now, -range * 7 + 1 + i));
    const stat = bundle.daily.get(date) ?? { total: 0, done: 0 };
    daily.push({ date, ...stat });
  }

  return (
    <StatsScreen
      range={range}
      stats={{
        streak: bundle.streak,
        doneCount: bundle.doneCount,
        totalCount: bundle.totalCount,
        habits: bundle.habits,
        weekday: bundle.weekday,
        recent: bundle.recent,
        daily,
      }}
    />
  );
}
