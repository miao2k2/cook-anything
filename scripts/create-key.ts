/**
 * Tạo một private key mẫu để thử đăng ký tài khoản ngoài giao diện.
 *
 *   npx tsx scripts/create-key.ts [label]
 *
 * In key ra stdout — key gốc chỉ hiện đúng 1 lần này (admin tạo trong UI
 * cũng chỉ thấy 1 lần tương tự).
 */

import { eq } from "drizzle-orm";
import postgres from "postgres";

import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "../src/db/schema";
import {
  apiKeyPrefix,
  generateApiKey,
  generateId,
  hashToken,
} from "../src/lib/crypto";

const { users, apiKeys } = schema;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Thiếu DATABASE_URL");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
const db = drizzle(sql, { schema });

const label = process.argv[2] ?? "Key mẫu";

async function main() {
  // Admin đầu tiên trong DB (nếu có) sẽ là người tạo key.
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.isAdmin, true))
    .limit(1);

  const plainKey = generateApiKey();

  await db.insert(apiKeys).values({
    id: generateId(),
    label,
    keyHash: hashToken(plainKey),
    keyPrefix: apiKeyPrefix(plainKey),
    createdBy: admins[0]?.id ?? null,
  });

  console.info("✔ Đã tạo private key mới.");
  console.info("");
  console.info(`  Nhãn : ${label}`);
  console.info(`  Key  : ${plainKey}`);
  console.info("");
  console.info("Dùng key này tại /register để tạo tài khoản.");

  await sql.end();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
