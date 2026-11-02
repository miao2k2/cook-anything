"use client";

import { useState } from "react";

import { Icon } from "@/components/icon";
import { Checkbox } from "@/components/progress";
import type { TaskItem } from "@/components/task-list";

/**
 * Một dòng việc: ô tích, nội dung (bấm để sửa) và các nút hành động.
 */
export function TaskRow({
  task,
  pending,
  showMoveButton,
  onToggle,
  onRemove,
  onEdit,
  onMoveTomorrow,
}: {
  task: TaskItem;
  pending: boolean;
  showMoveButton?: boolean;
  onToggle: (next: boolean) => void;
  onRemove: () => void;
  onEdit: (text: string) => void;
  onMoveTomorrow?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);

  function commit() {
    setEditing(false);
    const text = draft.trim();
    if (text && text !== task.text) onEdit(text);
    else setDraft(task.text);
  }

  return (
    <li className="flex items-start gap-2.5 min-h-[46px] py-1.5 border-b border-dashed border-[var(--p-line)] last:border-b-0">
      <div className="pt-0.5">
        <Checkbox
          checked={task.done}
          disabled={pending}
          label={`Đánh dấu hoàn thành: ${task.text}`}
          onChange={onToggle}
        />
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draft}
            maxLength={120}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                setDraft(task.text);
                setEditing(false);
              }
            }}
            className="w-full bg-transparent border-b-2 border-[var(--p-primary)] text-sm lg:text-[15px] font-bold text-[var(--p-ink)] focus:outline-none py-0.5"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(task.text);
              setEditing(true);
            }}
            className={`text-left text-sm lg:text-[15px] font-bold break-words w-full ${
              task.done
                ? "text-[var(--p-muted)] line-through"
                : "text-[var(--p-ink)]"
            }`}
          >
            {task.text}
          </button>
        )}

        {task.priority ? (
          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--p-accent)]">
            <Icon name="flag" size={12} />
            {task.priority === 1 ? "Gấp" : "Quan trọng"}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        {showMoveButton && onMoveTomorrow ? (
          <button
            type="button"
            disabled={pending}
            onClick={onMoveTomorrow}
            title="Chuyển sang ngày mai"
            aria-label={`Chuyển sang ngày mai: ${task.text}`}
            className="h-9 px-2 inline-flex items-center gap-0.5 shrink-0 rounded-lg text-xs font-bold text-[var(--p-muted)] hover:text-[var(--p-accent)] transition disabled:opacity-50"
          >
            Mai
            <Icon name="chev-r" size={14} />
          </button>
        ) : null}

        <button
          type="button"
          disabled={pending}
          onClick={onRemove}
          title="Xoá việc"
          aria-label={`Xoá việc: ${task.text}`}
          className="w-9 h-9 grid place-items-center rounded-lg text-[var(--p-muted)] hover:text-rose-500 transition disabled:opacity-50"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </li>
  );
}
