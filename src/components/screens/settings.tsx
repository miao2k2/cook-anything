"use client";

import { useState, useTransition } from "react";

import { Card, CardTitle } from "@/components/card";
import { MusicPlayer } from "@/components/music-player";
import { ThemePicker } from "@/components/screens/theme-picker";
import { updateSettings } from "@/app/actions/planner";

export function SettingsScreen({
  email,
  name,
  themeId,
  darkMode,
  reminderEnabled,
  reminderHour,
  songs,
}: {
  email: string;
  name: string | null;
  themeId: string;
  darkMode: boolean;
  reminderEnabled: boolean;
  reminderHour: number;
  songs: Array<{ id: string; title: string; url: string }>;
}) {
  const [, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(name ?? "");
  const [reminder, setReminder] = useState(reminderEnabled);
  const [hour, setHour] = useState(reminderHour);

  return (
    <div className="planner-fade-in max-w-[900px]">
      <div className="mb-4">
        <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--p-muted)]">
          Tuỳ chỉnh
        </p>
        <h1 className="mt-0.5 text-2xl lg:text-4xl font-black text-[var(--p-ink)]">
          Cài đặt
        </h1>
      </div>

      <div className="grid gap-3 lg:gap-4">
        <Card className="p-4 lg:p-5">
          <CardTitle icon="palette">Bảng màu</CardTitle>
          <p className="text-sm text-[var(--p-muted)] mb-3">
            Chọn 1 trong 9 bộ màu. Mọi màu chữ đều tự động tương phản theo
            chuẩn WCAG nên luôn dễ đọc.
          </p>
          <ThemePicker currentTheme={themeId} darkMode={darkMode} />
        </Card>

        <Card className="p-4 lg:p-5">
          <CardTitle icon="music">Nhạc nền</CardTitle>
          <p className="text-sm text-[var(--p-muted)] mb-3">
            Nghe nhạc lo-fi khi lên kế hoạch. Bạn có thể thêm link nhạc
            riêng của mình.
          </p>
          <MusicPlayer customTracks={songs} />
        </Card>

        <Card className="p-4 lg:p-5">
          <CardTitle icon="bell">Nhắc nhở</CardTitle>
          <p className="text-sm text-[var(--p-muted)] mb-3">
            Nhắc bạn mỗi ngày để rà soát việc và thói quen.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reminder}
                onChange={(e) => {
                  setReminder(e.target.checked);
                  startTransition(async () => {
                    await updateSettings({ reminderEnabled: e.target.checked });
                  });
                }}
                className="w-5 h-5 accent-[var(--p-primary)]"
              />
              <span className="text-sm font-bold text-[var(--p-ink)]">
                Bật nhắc nhở hằng ngày
              </span>
            </label>

            <label className="flex items-center gap-3">
              <span className="text-sm font-bold text-[var(--p-ink)] shrink-0">
                Giờ
              </span>
              <input
                type="number"
                min={0}
                max={23}
                value={hour}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setHour(v);
                  startTransition(async () => {
                    await updateSettings({ reminderHour: v });
                  });
                }}
                className="w-20 h-10 px-3 rounded-xl bg-[var(--p-row)] text-sm font-bold text-[var(--p-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
              />
              <span className="text-xs font-bold text-[var(--p-muted)]">
                (0–23)
              </span>
            </label>
          </div>
        </Card>

        <Card className="p-4 lg:p-5">
          <CardTitle icon="eye">Tài khoản</CardTitle>

          <div className="grid gap-3">
            <div>
              <label
                htmlFor="settings-name"
                className="block mb-1 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]"
              >
                Tên hiển thị
              </label>
              <input
                id="settings-name"
                value={displayName}
                maxLength={60}
                placeholder="Ví dụ: Minh"
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={() =>
                  startTransition(async () => {
                    await updateSettings({ name: displayName });
                  })
                }
                className="w-full h-11 px-3.5 rounded-xl bg-[var(--p-row)] text-sm lg:text-base font-bold text-[var(--p-ink)] placeholder:text-[var(--p-muted)] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[var(--p-primary)]"
              />
            </div>

            <div>
              <span className="block mb-1 text-xs font-bold uppercase tracking-wide text-[var(--p-muted)]">
                Email đăng nhập
              </span>
              <p className="font-bold text-[var(--p-ink)]">{email}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
