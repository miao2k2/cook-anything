import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Kết nối PostgreSQL.
 *
 * Biến môi trường:
 *  - DATABASE_URL: chuỗi kết nối (bắt buộc)
 *  - DATABASE_SSL: "true" để bật TLS (dùng cho Neon/Supabase...)
 */
function createClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Thiếu biến môi trường DATABASE_URL. Copy .env.example thành .env.local rồi khai báo kết nối PostgreSQL.",
    );
  }

  // URL có `?sslmode=require` (Supabase/Neon/RDS) thì tự bật TLS.
  // Ngoài ra có thể bật thủ công bằng DATABASE_SSL=true.
  const needsSsl =
    process.env.DATABASE_SSL === "true" ||
    /[?&]sslmode=require/i.test(connectionString);

  return postgres(connectionString, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
    prepare: false,
    ssl: needsSsl ? "require" : undefined,
    onnotice: () => {},
  });
}

declare global {
  var __plannerSql: ReturnType<typeof createClient> | undefined;
}

// Tái sử dụng connection trong dev để tránh mở quá nhiều kết nối.
const sql = global.__plannerSql ?? createClient();

if (process.env.NODE_ENV !== "production") {
  global.__plannerSql = sql;
}

export const db = drizzle(sql, { schema });
export { schema };
