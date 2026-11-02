import "server-only";

import { cookies, headers } from "next/headers";
import { cacheLife } from "next/cache";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { generateSessionToken, hashToken } from "@/lib/crypto";

const SESSION_COOKIE = "planner_session";
const SESSION_TTL_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  themeId: string;
  darkMode: boolean;
  onboarded: boolean;
  isAdmin: boolean;
  registeredByKeyId: string | null;
  yearWord: string | null;
  yearVision: string | null;
  reminderEnabled: boolean;
  reminderHour: number;
};

/** Tạo phiên mới và ghi cookie. */
export async function createSession(userId: string): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  const headerList = await headers();

  await db.insert(sessions).values({
    id: hashToken(token).slice(0, 32),
    userId,
    tokenHash: hashToken(token),
    userAgent: headerList.get("user-agent"),
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Xoá phiên hiện tại. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db
      .delete(sessions)
      .where(eq(sessions.tokenHash, hashToken(token)));
  }

  cookieStore.delete(SESSION_COOKIE);
}

/** Lấy người dùng hiện tại (null nếu chưa đăng nhập). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  "use cache: private";

  // Phiên có thời hạn 30 ngày, nhưng cache client chỉ cần đủ lâu để điều
  // hướng giữa các trang là tức thì. `stale` tối thiểu 5 phút.
  cacheLife({ stale: 300, revalidate: 60, expire: 3600 });

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      themeId: users.themeId,
      darkMode: users.darkMode,
      onboarded: users.onboarded,
      isAdmin: users.isAdmin,
      registeredByKeyId: users.registeredByKeyId,
      yearWord: users.yearWord,
      yearVision: users.yearVision,
      reminderEnabled: users.reminderEnabled,
      reminderHour: users.reminderHour,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        // So sánh trong DB bằng `now()` (transaction-stable) thay vì `new Date()`
        // ở tầng JS — giá trị không đổi giữa các lần render nên không phá cache.
        sql`${sessions.expiresAt} > now()`,
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // `expiresAt` chỉ dùng để lọc trong truy vấn, không trả về cho client.
  const { expiresAt: _expiresAt, ...user } = row;
  void _expiresAt;
  return user;
}

/** Bắt buộc đăng nhập — dùng trong server action. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Bạn cần đăng nhập để thực hiện thao tác này.");
  }
  return user;
}

/**
 * Bắt buộc là quản trị viên — dùng cho màn hình Admin và các action quản lý key.
 * Ném lỗi nếu người dùng hiện tại không có quyền.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) {
    throw new Error("Bạn không có quyền truy cập khu vực quản trị.");
  }
  return user;
}

export { SESSION_COOKIE };
