/**
 * Reset database local (chỉ dùng cho DEV/TEST).
 * Xoá toàn bộ schema `public` và `drizzle` rồi tạo lại — migration sẽ được
 * drizzle-kit migrate chạy lại từ đầu và ghi nhận vào drizzle.__drizzle_migrations.
 */

import postgres from "postgres";

const url =
  process.env.DATABASE_URL ??
  "postgresql://postgres:cookanything_local_dev@127.0.0.1:5433/planner";

const s = postgres(url, { max: 1, prepare: false, connect_timeout: 10 });

async function main() {
  await s.unsafe("drop schema if exists public cascade");
  await s.unsafe("drop schema if exists drizzle cascade");
  await s.unsafe("create schema public");
  console.log("✔ Đã reset schema public + drizzle");
  await s.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
