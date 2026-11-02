/**
 * Kiểm tra nhanh trạng thái private key & user trong DB (chỉ dùng dev).
 *
 *   npx tsx scripts/check-keys.ts
 */

import { desc, eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "../src/db/schema";

const { users, apiKeys, apiKeyUsages } = schema;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Thiếu DATABASE_URL");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
const db = drizzle(sql, { schema });

async function main() {
  const keys = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  console.info("── API KEYS ──");
  for (const key of keys) {
    console.info(
      [
        `  ${key.label}`,
        `prefix=${key.keyPrefix}`,
        `active=${key.isActive}`,
        `used=${key.usedCount}/${key.maxUses ?? "∞"}`,
        `expires=${key.expiresAt?.toISOString() ?? "never"}`,
      ].join("  "),
    );
  }

  const usages = await db
    .select({
      keyLabel: apiKeys.label,
      email: users.email,
      usedAt: apiKeyUsages.usedAt,
    })
    .from(apiKeyUsages)
    .innerJoin(apiKeys, eq(apiKeyUsages.keyId, apiKeys.id))
    .innerJoin(users, eq(apiKeyUsages.userId, users.id))
    .orderBy(desc(apiKeyUsages.usedAt));

  console.info("\n── USAGES ──");
  for (const u of usages) {
    console.info(`  ${u.email}  <-  ${u.keyLabel}  @ ${u.usedAt.toISOString()}`);
  }

  const allUsers = await db
    .select({
      email: users.email,
      isAdmin: users.isAdmin,
      key: users.registeredByKeyId,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  console.info("\n── USERS ──");
  for (const u of allUsers) {
    console.info(
      `  ${u.email}  admin=${u.isAdmin}  key=${u.key ?? "(email otp)"}`,
    );
  }

  await sql.end();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
