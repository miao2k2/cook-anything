import { Suspense } from "react";
import { redirect } from "next/navigation";

import { TodayScreen } from "@/components/screens/today";
import { getCurrentUser } from "@/lib/auth";
import { getTodayBundle } from "@/lib/data";

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <Suspense fallback={<TodayFallback />}>
      <TodayContent userId={user.id} />
    </Suspense>
  );
}

/** Phần dữ liệu phụ thuộc ngày hôm nay — nằm sau Suspense để render ở request-time. */
async function TodayContent({ userId }: { userId: string }) {
  const bundle = await getTodayBundle(userId);
  return <TodayScreen bundle={bundle} />;
}

function TodayFallback() {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--p-muted)]">
        Hôm nay
      </p>
      <h1 className="mt-0.5 text-2xl lg:text-4xl font-black text-[var(--p-ink)]">
        Đang tải…
      </h1>
    </div>
  );
}
