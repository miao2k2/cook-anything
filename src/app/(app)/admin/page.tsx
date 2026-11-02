import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AdminScreen } from "@/components/screens/admin";
import { getApiKeys, getRegisteredUsers } from "@/lib/api-keys";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Chỉ admin mới vào được màn hình này.
  if (!user.isAdmin) redirect("/today");

  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminContent currentUserId={user.id} />
    </Suspense>
  );
}

/** Phần dữ liệu động — nằm sau Suspense để App Shell không bị gắn với URL. */
async function AdminContent({ currentUserId }: { currentUserId: string }) {
  const keys = await getApiKeys();
  const users = await getRegisteredUsers();

  return (
    <AdminScreen
      currentUserId={currentUserId}
      keys={keys.map((key) => ({
        id: key.id,
        label: key.label,
        keyPrefix: key.keyPrefix,
        isActive: key.isActive,
        maxUses: key.maxUses,
        usedCount: key.usedCount,
        expiresAt: key.expiresAt?.toISOString() ?? null,
        note: key.note,
        createdAt: key.createdAt.toISOString(),
        revokedAt: key.revokedAt?.toISOString() ?? null,
        createdByEmail: key.createdByEmail,
        usedBy: key.usedBy.map((usage) => ({
          userId: usage.userId,
          email: usage.email,
          usedAt: usage.usedAt.toISOString(),
        })),
      }))}
      users={users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        isAdmin: u.isAdmin,
        registeredByKeyId: u.registeredByKeyId,
        createdAt: u.createdAt.toISOString(),
      }))}
    />
  );
}

function AdminFallback() {
  return (
    <div className="max-w-[1200px]">
      <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--p-muted)]">
        Quản trị
      </p>
      <h1 className="mt-0.5 text-2xl lg:text-4xl font-black text-[var(--p-ink)]">
        Admin
      </h1>
      <p className="mt-3 text-sm font-bold text-[var(--p-muted)]">
        Đang tải danh sách private key…
      </p>
    </div>
  );
}
