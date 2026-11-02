"use client";

import { useState, useTransition } from "react";

import { Card, CardTitle } from "@/components/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Icon } from "@/components/icon";
import {
  createApiKey,
  deleteApiKey,
  reactivateApiKey,
  revokeApiKey,
  setUserAdmin,
} from "@/app/actions/admin";

type KeyRow = {
  id: string;
  label: string;
  keyPrefix: string;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  note: string | null;
  createdAt: string;
  revokedAt: string | null;
  createdByEmail: string | null;
  usedBy: Array<{ userId: string; email: string; usedAt: string }>;
};

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  registeredByKeyId: string | null;
  createdAt: string;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

export function AdminScreen({
  keys,
  users,
  currentUserId,
}: {
  keys: KeyRow[];
  users: UserRow[];
  currentUserId: string;
}) {
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [note, setNote] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  /** Key đang chờ xác nhận xoá — null nghĩa là không có hộp thoại nào mở. */
  const [deletingKey, setDeletingKey] = useState<KeyRow | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const activeCount = keys.filter((k) => k.isActive).length;
  const revokedCount = keys.length - activeCount;
  const totalUsers = users.length;

  function report(result: { ok: boolean; message: string }) {
    setMessage({ ok: result.ok, text: result.message });
  }

  function handleCreate() {
    const parsedMax = maxUses.trim() ? Number(maxUses) : null;
    const parsedDays = expiresInDays.trim() ? Number(expiresInDays) : null;

    startTransition(async () => {
      const result = await createApiKey({
        label,
        maxUses:
          parsedMax !== null && Number.isFinite(parsedMax) && parsedMax > 0
            ? parsedMax
            : null,
        expiresInDays:
          parsedDays !== null && Number.isFinite(parsedDays) && parsedDays > 0
            ? parsedDays
            : null,
        note,
      });

      if (result.ok) {
        setNewKey(result.key ?? null);
        setCopied(false);
        setLabel("");
        setMaxUses("");
        setExpiresInDays("");
        setNote("");
        setCreating(false);
      }
      report(result);
    });
  }

  async function copyKey() {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="planner-fade-in max-w-[1200px]">
      <div className="mb-4">
        <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--p-muted)]">
          Quản trị
        </p>
        <h1 className="mt-0.5 text-2xl lg:text-4xl font-black text-[var(--p-ink)]">
          Admin
        </h1>
      </div>

      {message ? (
        <p
          className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
            message.ok
              ? "bg-[var(--p-secondary)] text-[var(--p-on-secondary)]"
              : "bg-rose-500/10 text-rose-600"
          }`}
        >
          <Icon name={message.ok ? "check" : "alert"} size={16} />
          {message.text}
        </p>
      ) : null}

      {/* Key vừa tạo — chỉ hiển thị đúng 1 lần */}
      {newKey ? (
        <Card className="p-4 lg:p-5 mb-3 lg:mb-4">
          <CardTitle icon="key">Key mới của bạn</CardTitle>
          <p className="text-sm text-[var(--p-muted)] mb-3">
            Copy key này ngay — sau khi đóng hộp thoại nó sẽ không hiển thị lại.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 min-w-[240px] px-3 py-2.5 rounded-xl bg-[var(--p-row)] font-mono text-sm font-black tracking-wider text-[var(--p-ink)] break-all">
              {newKey}
            </code>
            <button
              type="button"
              onClick={() => void copyKey()}
              className="inline-flex items-center gap-1.5 min-h-[42px] px-3.5 rounded-xl bg-[var(--p-primary)] text-[var(--p-on-primary)] font-extrabold text-sm"
            >
              <Icon name={copied ? "check" : "copy"} size={16} />
              {copied ? "Đã copy" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => {
                setNewKey(null);
                setCopied(false);
              }}
              className="inline-flex items-center gap-1.5 min-h-[42px] px-3.5 rounded-xl bg-[var(--p-row)] text-[var(--p-ink)] font-extrabold text-sm"
            >
              <Icon name="x" size={16} />
              Đóng
            </button>
          </div>
        </Card>
      ) : null}

      {/* Thẻ số liệu */}
      <div className="grid grid-cols-3 gap-2.5 lg:gap-3 mb-3 lg:mb-4">
        <Card className="p-3.5 lg:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="key" size={18} className="text-[var(--p-primary)]" />
            <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)]">
              Key đang hoạt động
            </span>
          </div>
          <div className="text-3xl font-black text-[var(--p-ink)] tabular-nums">
            {activeCount}
          </div>
        </Card>

        <Card className="p-3.5 lg:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="ban" size={18} className="text-[var(--p-primary)]" />
            <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)]">
              Đã vô hiệu hoá
            </span>
          </div>
          <div className="text-3xl font-black text-[var(--p-ink)] tabular-nums">
            {revokedCount}
          </div>
        </Card>

        <Card className="p-3.5 lg:p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="people" size={18} className="text-[var(--p-primary)]" />
            <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)]">
              Người dùng
            </span>
          </div>
          <div className="text-3xl font-black text-[var(--p-ink)] tabular-nums">
            {totalUsers}
          </div>
        </Card>
      </div>

      {/* Danh sách key */}
      <Card className="p-4 lg:p-5 mb-3 lg:mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <CardTitle icon="key">Private key</CardTitle>
          <button
            type="button"
            onClick={() => setCreating((v) => !v)}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-xl bg-[var(--p-primary)] text-[var(--p-on-primary)] font-extrabold text-sm"
          >
            <Icon name="plus" size={16} />
            Tạo key
          </button>
        </div>

        {creating ? (
          <div className="mb-4 p-3.5 rounded-2xl bg-[var(--p-row)] grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="key-label"
                  className="block mb-1 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]"
                >
                  Tên key
                </label>
                <input
                  id="key-label"
                  value={label}
                  maxLength={60}
                  placeholder="Ví dụ: Marketing Q1"
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--p-surface)] text-sm font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
                />
              </div>

              <div>
                <label
                  htmlFor="key-max-uses"
                  className="block mb-1 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]"
                >
                  Số lần dùng tối đa
                </label>
                <input
                  id="key-max-uses"
                  type="number"
                  min={1}
                  value={maxUses}
                  placeholder="Không giới hạn"
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--p-surface)] text-sm font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
                />
              </div>

              <div>
                <label
                  htmlFor="key-expires"
                  className="block mb-1 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]"
                >
                  Hết hạn sau (ngày)
                </label>
                <input
                  id="key-expires"
                  type="number"
                  min={1}
                  value={expiresInDays}
                  placeholder="Không hết hạn"
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--p-surface)] text-sm font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
                />
              </div>

              <div>
                <label
                  htmlFor="key-note"
                  className="block mb-1 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]"
                >
                  Ghi chú
                </label>
                <input
                  id="key-note"
                  value={note}
                  maxLength={200}
                  placeholder="Tuỳ chọn"
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--p-surface)] text-sm font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={!label.trim()}
                className="inline-flex items-center gap-1.5 min-h-[42px] px-4 rounded-xl bg-[var(--p-primary)] text-[var(--p-on-primary)] font-extrabold disabled:opacity-50"
              >
                <Icon name="check" size={16} />
                Tạo key
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="min-h-[42px] px-4 rounded-xl bg-[var(--p-surface)] text-[var(--p-ink)] font-extrabold"
              >
                Huỷ
              </button>
            </div>
          </div>
        ) : null}

        {keys.length === 0 ? (
          <p className="py-3 text-sm text-[var(--p-muted)]">
            Chưa có private key nào. Tạo key đầu tiên để cấp quyền đăng ký.
          </p>
        ) : (
          <ul className="m-0 p-0 list-none grid gap-2.5">
            {keys.map((key) => {
              const expired =
                key.expiresAt !== null && new Date(key.expiresAt) <= new Date();
              const exhausted =
                key.maxUses !== null && key.usedCount >= key.maxUses;
              const usable = key.isActive && !expired && !exhausted;

              return (
                <li
                  key={key.id}
                  className="p-3 rounded-2xl bg-[var(--p-row)] border border-transparent"
                  style={
                    key.isActive
                      ? undefined
                      : { opacity: 0.62 }
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm lg:text-[15px] font-extrabold text-[var(--p-ink)] break-words">
                          {key.label}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                            usable
                              ? "bg-[var(--p-secondary)] text-[var(--p-on-secondary)]"
                              : "bg-rose-500/12 text-rose-600"
                          }`}
                        >
                          <Icon
                            name={usable ? "check" : "ban"}
                            size={11}
                          />
                          {key.isActive
                            ? expired
                              ? "Hết hạn"
                              : exhausted
                                ? "Hết lượt"
                                : "Đang hoạt động"
                            : "Đã vô hiệu hoá"}
                        </span>
                      </div>

                      <p className="mt-1 font-mono text-xs font-bold text-[var(--p-muted)]">
                        {key.keyPrefix}••••••••
                      </p>

                      <p className="mt-1 text-[11px] font-bold text-[var(--p-muted)]">
                        Tạo {formatDate(key.createdAt)}
                        {key.createdByEmail
                          ? ` · bởi ${key.createdByEmail}`
                          : ""}
                        {" · "}
                        {key.usedCount}
                        {key.maxUses !== null ? `/${key.maxUses}` : ""} lượt
                        dùng
                        {key.expiresAt
                          ? ` · hết hạn ${formatDate(key.expiresAt)}`
                          : ""}
                      </p>

                      {key.note ? (
                        <p className="mt-1 text-[11px] font-bold text-[var(--p-muted)] italic">
                          {key.note}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {key.isActive ? (
                        <button
                          type="button"
                          onClick={() =>
                            startTransition(async () => {
                              report(await revokeApiKey(key.id));
                            })
                          }
                          className="inline-flex items-center gap-1 min-h-[34px] px-2.5 rounded-lg bg-[var(--p-surface)] text-[11px] font-extrabold text-[var(--p-ink)] hover:text-rose-600"
                        >
                          <Icon name="ban" size={13} />
                          Vô hiệu hoá
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            startTransition(async () => {
                              report(await reactivateApiKey(key.id));
                            })
                          }
                          className="inline-flex items-center gap-1 min-h-[34px] px-2.5 rounded-lg bg-[var(--p-surface)] text-[11px] font-extrabold text-[var(--p-ink)] hover:text-[var(--p-primary)]"
                        >
                          <Icon name="refresh" size={13} />
                          Kích hoạt
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeletingKey(key)}
                        aria-label={`Xoá key: ${key.label}`}
                        title="Xoá key"
                        className="w-8 h-8 grid place-items-center rounded-lg bg-[var(--p-surface)] text-[var(--p-muted)] hover:text-rose-600"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>

                  {key.usedBy.length > 0 ? (
                    <details className="mt-2 group">
                      <summary className="cursor-pointer text-[11px] font-extrabold text-[var(--p-accent)] hover:underline underline-offset-4 min-h-[24px] inline-flex items-center">
                        <Icon
                          name="chev-r"
                          size={12}
                          className="mr-1 transition-transform group-open:rotate-90"
                        />
                        {key.usedBy.length} người dùng đang dùng key này
                      </summary>
                      <ul className="m-0 mt-1.5 p-0 list-none grid gap-1">
                        {key.usedBy.map((usage) => (
                          <li
                            key={usage.userId}
                            className="flex items-center justify-between gap-2 text-[11px] font-bold text-[var(--p-muted)]"
                          >
                            <span className="truncate">{usage.email}</span>
                            <span className="shrink-0 tabular-nums">
                              {formatDate(usage.usedAt)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <p className="mt-2 text-[11px] font-bold text-[var(--p-muted)]">
                      Chưa có người dùng nào dùng key này.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Danh sách user */}
      <Card className="p-4 lg:p-5">
        <CardTitle icon="people">Người dùng</CardTitle>
        <p className="text-sm text-[var(--p-muted)] mb-3">
          Ai đã đăng ký và bằng key nào.
        </p>

        <div className="overflow-x-auto thin-scroll -mx-1 px-1">
          <table className="w-full border-collapse min-w-[520px]">
            <thead>
              <tr>
                <th className="text-left text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)] pb-2 pr-2">
                  Email
                </th>
                <th className="text-left text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)] pb-2 pr-2">
                  Tên
                </th>
                <th className="text-left text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)] pb-2 pr-2">
                  Ngày đăng ký
                </th>
                <th className="text-left text-xs font-extrabold uppercase tracking-wide text-[var(--p-muted)] pb-2 pr-2">
                  Quyền
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-dashed border-[var(--p-line)]"
                >
                  <td className="py-2 pr-2 text-xs lg:text-sm font-bold text-[var(--p-ink)] break-words">
                    {u.email}
                    {u.registeredByKeyId ? (
                      <span className="block mt-0.5 text-[10px] font-bold text-[var(--p-muted)]">
                        đăng ký bằng key
                      </span>
                    ) : (
                      <span className="block mt-0.5 text-[10px] font-bold text-[var(--p-muted)]">
                        đăng nhập bằng email
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-2 text-xs lg:text-sm font-bold text-[var(--p-muted)] break-words">
                    {u.name ?? "—"}
                  </td>
                  <td className="py-2 pr-2 text-xs font-bold text-[var(--p-muted)] tabular-nums">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="py-2">
                    {u.id === currentUserId ? (
                      <span className="text-[11px] font-black text-[var(--p-muted)]">
                        Bạn
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            report(await setUserAdmin(u.id, !u.isAdmin));
                          })
                        }
                        className={`inline-flex items-center gap-1 min-h-[32px] px-2.5 rounded-lg text-[11px] font-extrabold ${
                          u.isAdmin
                            ? "bg-[var(--p-secondary)] text-[var(--p-on-secondary)]"
                            : "bg-[var(--p-row)] text-[var(--p-muted)] hover:text-[var(--p-ink)]"
                        }`}
                      >
                        <Icon name={u.isAdmin ? "shield" : "people"} size={13} />
                        {u.isAdmin ? "Quản trị" : "Thành viên"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={deletingKey !== null}
        title="Xoá private key?"
        description={
          deletingKey ? (
            <>
              Key <strong>{deletingKey.label}</strong> (…
              {deletingKey.keyPrefix}) sẽ bị xoá vĩnh viễn cùng lịch sử
              đăng ký.
              {deletingKey.usedBy.length > 0 ? (
                <>
                  {" "}
                  <strong>{deletingKey.usedBy.length}</strong> tài khoản đã đăng
                  ký bằng key này vẫn giữ nguyên.
                </>
              ) : null}
            </>
          ) : null
        }
        confirmLabel="Xoá key"
        onCancel={() => setDeletingKey(null)}
        onConfirm={() => {
          const target = deletingKey;
          setDeletingKey(null);
          if (!target) return;
          startTransition(async () => {
            report(await deleteApiKey(target.id));
          });
        }}
      />
    </div>
  );
}
