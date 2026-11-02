/**
 * Dọn dẹp dữ liệu test: xoá private key và tài khoản tạo trong lúc E2E.
 *
 *   npx tsx scripts/cleanup-test-data.ts
 *
 * Chỉ chạy ở môi trường dev — script sẽ bỏ qua nếu DATABASE_URL trỏ
 * tới host không phải localhost.
 */

import { eq, like, or } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "../src/db/schema";

const { users, apiKeys, apiKeyUsages } = schema;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Thiếu DATABASE_URL");
  process.exit(1);
}

if (!/localhost|127\.0\.0\.1/.test(url)) {
  console.error("⚠ DATABASE_URL không trỏ về localhost — huỷ thao tác dọn dẹp.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
const db = drizzle(sql, { schema });

async function main() {
  const testUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(
      or(
        like(users.email, "%@planner.local"),
        like(users.email, "%e2e%"),
        like(users.email, "%test%"),
      ),
    );

  for (const user of testUsers) {
    if (user.email === "demo@planner.local") continue;
    await db.delete(apiKeyUsages).where(eq(apiKeyUsages.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
    console.info(`  ✔ xoá user ${user.email}`);
  }

  await db.delete(apiKeys);
  console.info("  ✔ xoá toàn bộ private key");

  await sql.end();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
