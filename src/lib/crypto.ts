import { createHash, randomBytes, randomInt } from "node:crypto";

/**
 * Tiện ích mã hoá cho phiên đăng nhập và mã xác nhận.
 */

function secret(): string {
  return process.env.AUTH_SECRET || "dev-secret-thay-bang-chuoi-ngau-nhien-32-byte";
}

/** SHA-256 của chuỗi, dùng để lưu token/mã đã băm. */
export function hashToken(value: string): string {
  return createHash("sha256").update(`${value}${secret()}`).digest("hex");
}

/** So sánh thời gian hằng số để tránh timing attack. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Mã 6 chữ số ngẫu nhiên. */
export function generateLoginCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Token phiên ngẫu nhiên (dạng hex). */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Id ngắn dùng cho các bản ghi mới. */
export function generateId(): string {
  return (
    Date.now().toString(36) + randomBytes(4).toString("hex")
  ).slice(0, 16);
}

/** Chuẩn hoá email để so sánh. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Kiểm tra định dạng email cơ bản. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
