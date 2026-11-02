import { redirect } from "next/navigation";

import { TodayScreen } from "@/components/screens/today";
import { getCurrentUser } from "@/lib/auth";
import { getTodayBundle } from "@/lib/data";

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const bundle = await getTodayBundle(user.id);

  return <TodayScreen bundle={bundle} />;
}
