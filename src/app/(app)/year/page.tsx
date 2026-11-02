import { redirect } from "next/navigation";

import { YearScreen } from "@/components/screens/year";
import { getCurrentUser } from "@/lib/auth";
import { getYearBundle } from "@/lib/data";
import { startOfToday } from "@/lib/date";

export default async function YearPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const currentYear = startOfToday().getUTCFullYear();
  const year = Number(params.year) || currentYear;

  const bundle = await getYearBundle(user.id, year);

  return (
    <YearScreen
      year={year}
      plansByMonth={bundle.byMonth}
      yearWord={user.yearWord}
      yearVision={user.yearVision}
    />
  );
}
