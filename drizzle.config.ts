import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "drizzle-kit";

/**
 * `drizzle-kit` chạy ngoài Next.js nên không tự nạp `.env.local`
 * (dotenv mặc định chỉ đọc `.env`). Ta nạp thủ công trước khi đọc biến.
 *
 * Thứ tự ưu tiên:
 *  1. `.env.local`  — biến riêng cho local dev (không commit)
 *  2. `.env`       — fallback
 *
 * Vì `process.loadEnvFile()` KHÔNG ghi đè biến đã tồn tại trong môi trường,
 * ta tự parse file để `.env.local` luôn được ưu tiên — tránh trường hợp
 * shell vẫn còn `DATABASE_URL` cũ (trỏ về DB local) làm CLI kết nối sai DB.
 */
function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);

    if (!existsSync(path)) continue;

    const content = readFileSync(path, "utf8");

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) continue;

      const separator = line.indexOf("=");

      if (separator < 1) continue;

      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();

      // Bỏ dấu nháy bao quanh nếu có
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}

loadEnvFiles();

const url = process.env.DATABASE_URL ?? process.env.DATABASE_URL_DIRECT ?? "";

if (!url) {
  throw new Error(
    "Thiếu DATABASE_URL. Hãy copy .env.example thành .env.local rồi khai báo chuỗi kết nối PostgreSQL.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
  strict: true,
  verbose: true,
});
