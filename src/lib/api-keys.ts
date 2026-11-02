import "server-only";

import { desc, eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { apiKeys, apiKeyUsages, users } from "@/db/schema";

/* ------------------------------------------------------------------ */
/* Kiểu dữ liệu                                                        */
/* ------------------------------------------------------------------ */

export type ApiKeySummary = {
  id: string;
  label: string;
  keyPrefix: string;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  note: string | null;
  createdAt: Date;
  revokedAt: Date | null;
  createdByEmail: string | null;
  usedBy: Array<{ userId: string; email: string; usedAt: Date }>;
};

/* ------------------------------------------------------------------ */
/* Truy vấn                                                            */
/* ------------------------------------------------------------------ */

/** Danh sách toàn bộ key kèm user đã dùng. */
export async function getApiKeys(): Promise<ApiKeySummary[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 10, expire: 300 });
  cacheTag("api-keys");

  const rows = await db
    .select({
      id: apiKeys.id,
      label: apiKeys.label,
      keyPrefix: apiKeys.keyPrefix,
      isActive: apiKeys.isActive,
      maxUses: apiKeys.maxUses,
      usedCount: apiKeys.usedCount,
      expiresAt: apiKeys.expiresAt,
      note: apiKeys.note,
      createdAt: apiKeys.createdAt,
      revokedAt: apiKeys.revokedAt,
      createdBy: apiKeys.createdBy,
      createdByEmail: users.email,
    })
    .from(apiKeys)
    .leftJoin(users, eq(apiKeys.createdBy, users.id))
    .orderBy(desc(apiKeys.createdAt));

  const usageRows = await db
    .select({
      keyId: apiKeyUsages.keyId,
      userId: apiKeyUsages.userId,
      email: users.email,
      usedAt: apiKeyUsages.usedAt,
    })
    .from(apiKeyUsages)
    .innerJoin(users, eq(apiKeyUsages.userId, users.id))
    .orderBy(desc(apiKeyUsages.usedAt));

  const byKey = new Map<string, ApiKeySummary["usedBy"]>();
  for (const usage of usageRows) {
    const list = byKey.get(usage.keyId) ?? [];
    list.push({
      userId: usage.userId,
      email: usage.email,
      usedAt: usage.usedAt,
    });
    byKey.set(usage.keyId, list);
  }

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    keyPrefix: row.keyPrefix,
    isActive: row.isActive,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    expiresAt: row.expiresAt,
    note: row.note,
    createdAt: row.createdAt,
    revokedAt: row.revokedAt,
    createdByEmail: row.createdByEmail,
    usedBy: byKey.get(row.id) ?? [],
  }));
}

/** Tìm key theo băm — dùng khi người dùng đăng ký bằng key. */
export async function findApiKeyByHash(keyHash: string) {
  const rows = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);
  return rows[0] ?? null;
}

/** Đếm số lần dùng thực tế của một key. */
export async function countApiKeyUsages(keyId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(apiKeyUsages)
    .where(eq(apiKeyUsages.keyId, keyId));
  return Number(rows[0]?.count ?? 0);
}

/** Tất cả user đã từng đăng ký (kể cả bằng email OTP). */
export async function getRegisteredUsers() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 10, expire: 300 });
  cacheTag("api-users");

  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isAdmin: users.isAdmin,
      registeredByKeyId: users.registeredByKeyId,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}
