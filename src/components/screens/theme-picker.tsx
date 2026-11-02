"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/icon";
import { updateSettings } from "@/app/actions/planner";
import { THEMES, buildThemeTokens } from "@/lib/theme";

export function ThemePicker({
  currentTheme,
  darkMode,
}: {
  currentTheme: string;
  darkMode: boolean;
}) {
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState(currentTheme);
  const [isDark, setIsDark] = useState(darkMode);

  function apply(themeId: string, dark: boolean) {
    setSelected(themeId);
    setIsDark(dark);
    startTransition(async () => {
      await updateSettings({ themeId, darkMode: dark });
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {THEMES.map((theme) => {
          const active = theme.id === selected && !isDark;
          const darkActive = theme.id === selected && isDark;
          const tokens = buildThemeTokens(theme.id);

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => apply(theme.id, false)}
              aria-pressed={active || darkActive}
              className={`relative p-2.5 rounded-2xl text-left transition-all ${
                active || darkActive
                  ? "ring-2 ring-[var(--p-primary)] ring-offset-2 ring-offset-[var(--p-surface)]"
                  : "hover:brightness-97"
              }`}
              style={{ background: tokens.pageBg }}
            >
              <span
                className="absolute top-2 right-2 grid place-items-center w-6 h-6 rounded-full"
                style={{ background: tokens.primary }}
              >
                {active || darkActive ? (
                  <Icon name="check" size={14} style={{ color: "#fff" }} />
                ) : null}
              </span>

              <span className="flex gap-1 mb-2">
                {tokens.palette.slice(0, 5).map((c, i) => (
                  <span
                    key={i}
                    className="w-4 h-4 rounded-full"
                    style={{ background: c }}
                  />
                ))}
              </span>

              <span
                className="block text-xs font-extrabold leading-tight"
                style={{ color: tokens.primary }}
              >
                {theme.name}
              </span>
            </button>
          );
        })}
      </div>

      <label className="mt-4 flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isDark}
          onChange={(e) => apply(selected, e.target.checked)}
          className="w-5 h-5 accent-[var(--p-primary)]"
        />
        <span className="text-sm font-bold text-[var(--p-ink)]">Chế độ tối</span>
      </label>
    </div>
  );
}
