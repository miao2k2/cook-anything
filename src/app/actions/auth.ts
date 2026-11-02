"use server";

import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { loginCodes, users } from "@/db/schema";
import {
  generateId,
  generateLoginCode,
  hashToken,
  isValidEmail,
  normalizeEmail,
  safeEqual,
} from "@/lib/crypto";
import { createSession, destroySession } from "@/lib/auth";
import { sendLoginCode } from "@/lib/mail";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export type AuthState =
  | { status: "idle" }
  | { status: "sent"; email: string; expiresAt: string; devCode?: string }
  | { status: "error"; message: string };

/**
 * Bước 1: gửi mã xác nhận 6 số tới email.
 */
export async function requestLoginCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!isValidEmail(email)) {
    return { status: "error", message: "Email không hợp lệ." };
  }

  const normalized = normalizeEmail(email);

  // Tìm hoặc tạo user
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.emailNormalized, normalized))
    .limit(1);

  let userId = existing[0]?.id;

  if (!userId) {
    userId = generateId();
    await db.insert(users).values({
      id: userId,
      email,
      emailNormalized: normalized,
    });
  }

  const code = generateLoginCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  // Vô hiệu hoá các mã cũ chưa dùng
  await db
    .update(loginCodes)
    .set({ consumedAt: new Date() })
    .where(and(eq(loginCodes.userId, userId), gt(loginCodes.expiresAt, new Date())));

  await db.insert(loginCodes).values({
    id: generateId(),
    userId,
    codeHash: hashToken(code),
    expiresAt,
  });

  const { devCode } = await sendLoginCode({ to: email, code });

  revalidatePath("/", "layout");
  return {
    status: "sent",
    email,
    expiresAt: expiresAt.toISOString(),
    ...(devCode ? { devCode } : {}),
  };
}

/**
 * Bước 2: xác minh mã 6 số và tạo phiên.
 */
export async function verifyLoginCode(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();

  if (!email || !code) {
    return { status: "error", message: "Vui lòng nhập email và mã xác nhận." };
  }

  const normalized = normalizeEmail(email);

  const rows = await db
    .select({
      id: loginCodes.id,
      userId: loginCodes.userId,
      codeHash: loginCodes.codeHash,
      expiresAt: loginCodes.expiresAt,
      attempts: loginCodes.attempts,
    })
    .from(loginCodes)
    .innerJoin(users, eq(loginCodes.userId, users.id))
    .where(
      and(
        eq(users.emailNormalized, normalized),
        gt(loginCodes.expiresAt, new Date()),
        // Chỉ dùng mã còn hiệu lực và chưa được tiêu thụ.
        isNull(loginCodes.consumedAt),
      ),
    )
    // Mới nhất trước: nếu người dùng yêu cầu lại mã, mã cũ đã bị vô hiệu hoá.
    .orderBy(desc(loginCodes.createdAt))
    .limit(1);

  const record = rows[0];

  if (!record) {
    return {
      status: "error",
      message: "Mã đã hết hạn hoặc không tồn tại. Hãy yêu cầu mã mới.",
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return {
      status: "error",
      message: "Bạn đã nhập sai quá nhiều lần. Hãy yêu cầu mã mới.",
    };
  }

  if (!safeEqual(hashToken(code), record.codeHash)) {
    await db
      .update(loginCodes)
      .set({ attempts: record.attempts + 1 })
      .where(eq(loginCodes.id, record.id));

    return {
      status: "error",
      message: `Mã không đúng. Còn ${MAX_ATTEMPTS - record.attempts - 1} lần thử.`,
    };
  }

  await db
    .update(loginCodes)
    .set({ consumedAt: new Date() })
    .where(eq(loginCodes.id, record.id));

  await createSession(record.userId);

  revalidatePath("/", "layout");
  return { status: "idle" };
}

/** Đăng xuất. */
export async function logout(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
}
