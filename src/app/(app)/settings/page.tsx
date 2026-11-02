import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { SettingsScreen } from "@/components/screens/settings";
import { db } from "@/db";
import { favoriteSongs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const songs = await db
    .select({
      id: favoriteSongs.id,
      title: favoriteSongs.title,
      url: favoriteSongs.url,
    })
    .from(favoriteSongs)
    .where(eq(favoriteSongs.userId, user.id))
    .orderBy(asc(favoriteSongs.createdAt));

  return (
    <SettingsScreen
      email={user.email}
      name={user.name}
      themeId={user.themeId}
      darkMode={user.darkMode}
      reminderEnabled={user.reminderEnabled}
      reminderHour={user.reminderHour}
      songs={songs}
    />
  );
}
