import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";

/**
 * Layout này đọc cookie phiên nên không thể prerender — cho phép route chặn
 * (blocking) thay vì bắt buộc điều hướng tức thì.
 */
export const instant = false;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell email={user.email} isAdmin={user.isAdmin}>
      {children}
    </AppShell>
  );
}
