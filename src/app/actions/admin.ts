"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/db";
import { apiKeys, apiKeyUsages, users } from "@/db/schema";
import {
  apiKeyPrefix,
  generateApiKey,
  generateId,
  hashToken,
  isValidApiKeyFormat,
  isValidEmail,
  normalizeApiKey,
  normalizeEmail,
} from "@/lib/crypto";
import { createSession, requireAdmin } from "@/lib/auth";

const MAX_LABEL_LENGTH = 60;
const MAX_NOTE_LENGTH = 200;

/** Làm mới cache của màn Admin sau khi dữ liệu key/user thay đổi. */
function invalidateAdminCache() {
  updateTag("api-keys");
  updateTag("api-users");
  revalidatePath("/admin");
}

export type RegisterState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; email: string };

/**
 * Đăng ký tài khoản mới bằng private key.
 *
 * Key phải còn hiệu lực, chưa hết hạn và chưa vượt quá giới hạn số lần dùng.
 * Sau khi đăng ký thành công, phiên đăng nhập được tạo luôn.
 */
export async function registerWithKey(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").trim();
  const key = String(formData.get("key") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);

  if (!isValidEmail(email)) {
    return { status: "error", message: "Email không hợp lệ." };
  }

  if (!isValidApiKeyFormat(key)) {
    return {
      status: "error",
      message: "Private key không đúng định dạng (PLN-XXXX-XXXX-XXXX-XXXX).",
    };
  }

  const normalized = normalizeEmail(email);
  const keyHash = hashToken(normalizeApiKey(key));

  const rows = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  const apiKey = rows[0];

  if (!apiKey) {
    return { status: "error", message: "Private key không tồn tại." };
  }

  if (!apiKey.isActive || apiKey.revokedAt) {
    return {
      status: "error",
      message: "Private key đã bị vô hiệu hoá. Liên hệ quản trị viên.",
    };
  }

  if (apiKey.expiresAt && apiKey.expiresAt.getTime() <= Date.now()) {
    return { status: "error", message: "Private key đã hết hạn." };
  }

  if (apiKey.maxUses !== null && apiKey.usedCount >= apiKey.maxUses) {
    return {
      status: "error",
      message: "Private key đã hết lượt đăng ký.",
    };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.emailNormalized, normalized))
    .limit(1);

  if (existing.length > 0) {
    return {
      status: "error",
      message: "Email này đã được đăng ký. Hãy đăng nhập bằng mã xác nhận.",
    };
  }

  const userId = generateId();
  const headerList = await headers();

  await db.insert(users).values({
    id: userId,
    email,
    emailNormalized: normalized,
    name: name || null,
    registeredByKeyId: apiKey.id,
  });

  await db.insert(apiKeyUsages).values({
    id: generateId(),
    keyId: apiKey.id,
    userId,
    userAgent: headerList.get("user-agent"),
  });

  await db
    .update(apiKeys)
    .set({ usedCount: apiKey.usedCount + 1 })
    .where(eq(apiKeys.id, apiKey.id));

  await createSession(userId);

  updateTag("api-users");
  revalidatePath("/", "layout");
  return { status: "success", email };
}

/* ------------------------------------------------------------------ */
/* Quản lý private key (chỉ admin)                                    */
/* ------------------------------------------------------------------ */

export type AdminActionResult =
  | { ok: true; message: string; /** Key gốc — chỉ trả về đúng 1 lần khi sinh mới. */ key?: string }
  | { ok: false; message: string };

/** Sinh private key mới. Key gốc được trả về để admin sao chép ngay. */
export async function createApiKey(input: {
  label: string;
  maxUses?: number | null;
  expiresInDays?: number | null;
  note?: string;
}): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  const label = input.label.trim().slice(0, MAX_LABEL_LENGTH);
  if (!label) {
    return { ok: false, message: "Tên key không được để trống." };
  }

  const plainKey = generateApiKey();

  await db.insert(apiKeys).values({
    id: generateId(),
    label,
    keyHash: hashToken(plainKey),
    keyPrefix: apiKeyPrefix(plainKey),
    maxUses:
      input.maxUses && input.maxUses > 0 ? Math.floor(input.maxUses) : null,
    expiresAt:
      input.expiresInDays && input.expiresInDays > 0
        ? new Date(Date.now() + input.expiresInDays * 86400000)
        : null,
    note: input.note?.trim().slice(0, MAX_NOTE_LENGTH) || null,
    createdBy: admin.id,
  });

  invalidateAdminCache();
  return {
    ok: true,
    message: "Đã tạo private key mới.",
    key: plainKey,
  };
}

/** Vô hiệu hoá key — user đã đăng ký vẫn giữ tài khoản. */
export async function revokeApiKey(keyId: string): Promise<AdminActionResult> {
  await requireAdmin();

  const rows = await db
    .select({ id: apiKeys.id, label: apiKeys.label })
    .from(apiKeys)
    .where(eq(apiKeys.id, keyId))
    .limit(1);

  if (!rows.length) {
    return { ok: false, message: "Không tìm thấy key." };
  }

  await db
    .update(apiKeys)
    .set({ isActive: false, revokedAt: new Date() })
    .where(eq(apiKeys.id, keyId));

  invalidateAdminCache();
  return { ok: true, message: `Đã vô hiệu hoá key "${rows[0].label}".` };
}

/** Kích hoạt lại key đã bị vô hiệu hoá. */
export async function reactivateApiKey(
  keyId: string,
): Promise<AdminActionResult> {
  await requireAdmin();

  const rows = await db
    .select({ id: apiKeys.id, label: apiKeys.label })
    .from(apiKeys)
    .where(eq(apiKeys.id, keyId))
    .limit(1);

  if (!rows.length) {
    return { ok: false, message: "Không tìm thấy key." };
  }

  await db
    .update(apiKeys)
    .set({ isActive: true, revokedAt: null })
    .where(eq(apiKeys.id, keyId));

  invalidateAdminCache();
  return { ok: true, message: `Đã kích hoạt lại key "${rows[0].label}".` };
}

/** Xoá key vĩnh viễn (kèm toàn bộ lịch sử sử dụng). */
export async function deleteApiKey(keyId: string): Promise<AdminActionResult> {
  await requireAdmin();

  const rows = await db
    .select({ id: apiKeys.id, label: apiKeys.label })
    .from(apiKeys)
    .where(eq(apiKeys.id, keyId))
    .limit(1);

  if (!rows.length) {
    return { ok: false, message: "Không tìm thấy key." };
  }

  await db.delete(apiKeys).where(eq(apiKeys.id, keyId));

  invalidateAdminCache();
  return { ok: true, message: `Đã xoá key "${rows[0].label}".` };
}

/** Bật/tắt quyền quản trị cho một user. */
export async function setUserAdmin(
  userId: string,
  isAdmin: boolean,
): Promise<AdminActionResult> {
  const admin = await requireAdmin();

  if (admin.id === userId) {
    return { ok: false, message: "Bạn không thể tự thay đổi quyền của mình." };
  }

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!rows.length) {
    return { ok: false, message: "Không tìm thấy người dùng." };
  }

  await db.update(users).set({ isAdmin, updatedAt: new Date() }).where(eq(users.id, userId));

  invalidateAdminCache();
  return {
    ok: true,
    message: isAdmin
      ? "Đã cấp quyền quản trị."
      : "Đã thu hồi quyền quản trị.",
  };
}
