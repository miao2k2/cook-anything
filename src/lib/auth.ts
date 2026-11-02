import "server-only";

import { cookies, headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";

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
        gt(sessions.expiresAt, new Date()),
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

export { SESSION_COOKIE };
