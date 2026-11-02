"use client";

import { useTransition } from "react";

import {
  moveTask,
  removeTask,
  toggleTask,
  updateTask,
} from "@/app/actions/planner";
import { TaskRow } from "@/components/task-row";

export type TaskItem = {
  id: string;
  text: string;
  done: boolean;
  priority: number | null;
  date: string;
};

export function TaskList({
  tasks,
  showMoveButton = false,
  emptyText = "Chưa có việc nào cho hôm nay",
}: {
  tasks: TaskItem[];
  showMoveButton?: boolean;
  emptyText?: string;
}) {
  const [pending, startTransition] = useTransition();

  if (tasks.length === 0) {
    return <p className="py-3 text-sm text-[var(--p-muted)]">{emptyText}</p>;
  }

      return (
        <ul className="m-0 p-0 list-none">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              pending={pending}
              showMoveButton={showMoveButton}
              onToggle={(next) =>
                startTransition(async () => {
                  await toggleTask(task.id, next);
                })
              }
              onRemove={() =>
                startTransition(async () => {
                  await removeTask(task.id);
                })
              }
              onEdit={(text) =>
                startTransition(async () => {
                  await updateTask(task.id, { text });
                })
              }
              onMoveTomorrow={() =>
                startTransition(async () => {
                  const tomorrow = new Date();
                  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
                  await moveTask(task.id, tomorrow.toISOString().slice(0, 10));
                })
              }
            />
          ))}
        </ul>
      );
}
