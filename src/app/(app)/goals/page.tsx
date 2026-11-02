import { redirect } from "next/navigation";

import { GoalsScreen } from "@/components/screens/goals";
import { getCurrentUser } from "@/lib/auth";
import { getCustomAreas, getGoals } from "@/lib/data";

export default async function GoalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [goals, customAreas] = await Promise.all([
    getGoals(user.id),
    getCustomAreas(user.id),
  ]);

  return (
    <GoalsScreen
      goals={goals}
      customAreas={customAreas.map((a) => ({
        id: a.id,
        name: a.name,
        icon: a.icon,
      }))}
    />
  );
}
