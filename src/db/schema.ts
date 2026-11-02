import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Người dùng & phiên đăng nhập                                       */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    emailNormalized: text("email_normalized").notNull(),
    name: text("name"),
    themeId: text("theme_id").notNull().default("pandavocab"),
    darkMode: boolean("dark_mode").notNull().default(false),
    onboarded: boolean("onboarded").notNull().default(false),
    yearWord: text("year_word"),
    yearVision: text("year_vision"),
    reminderEnabled: boolean("reminder_enabled").notNull().default(false),
    reminderHour: integer("reminder_hour").notNull().default(20),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_normalized_idx").on(t.emailNormalized)],
);

/** Mã xác nhận 6 số gửi qua email. */
export const loginCodes = pgTable(
  "login_codes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("login_codes_user_idx").on(t.userId)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("sessions_token_hash_idx").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Việc (tasks)                                                       */
/* ------------------------------------------------------------------ */

/**
 * Một việc thuộc một ngày cụ thể. Ngày được lưu dạng chuỗi ISO "YYYY-MM-DD"
 * để truy vấn theo khoảng thời gian nhanh và không phụ thuộc múi giờ.
 */
export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    text: text("text").notNull(),
    done: boolean("done").notNull().default(false),
    /** 1 = gấp, 2 = quan trọng */
    priority: integer("priority"),
    /** Việc được chuyển từ ngày trước sang — hiển thị trong "Việc còn tồn" */
    carriedFrom: text("carried_from"),
    /** Lặp lại theo các thứ trong tuần (0..6, 0 = Thứ 2) */
    repeatDays: integer("repeat_days").array(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("tasks_user_date_idx").on(t.userId, t.date),
    index("tasks_user_done_idx").on(t.userId, t.done),
  ],
);

/* ------------------------------------------------------------------ */
/* Mục tiêu (goals)                                                    */
/* ------------------------------------------------------------------ */

export const goals = pgTable(
  "goals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    areaId: text("area_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    deadline: date("deadline"),
    done: boolean("done").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("goals_user_idx").on(t.userId)],
);

export const goalSteps = pgTable(
  "goal_steps",
  {
    id: text("id").primaryKey(),
    goalId: text("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    done: boolean("done").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("goal_steps_goal_idx").on(t.goalId)],
);

/* ------------------------------------------------------------------ */
/* Lĩnh vực tuỳ chỉnh                                                */
/* ------------------------------------------------------------------ */

export const customAreas = pgTable(
  "custom_areas",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("sprout"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("custom_areas_user_idx").on(t.userId)],
);

/* ------------------------------------------------------------------ */
/* Thói quen (habits)                                                  */
/* ------------------------------------------------------------------ */

export const habits = pgTable(
  "habits",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("habits_user_idx").on(t.userId)],
);

/** Ngày đã tích thói quen. */
export const habitChecks = pgTable(
  "habit_checks",
  {
    habitId: text("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.habitId, t.date] })],
);

/* ------------------------------------------------------------------ */
/* Kế hoạch tháng / năm                                               */
/* ------------------------------------------------------------------ */

export const monthPlans = pgTable(
  "month_plans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Định dạng "YYYY-MM" */
    month: text("month").notNull(),
    title: text("title").notNull(),
    done: boolean("done").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("month_plans_user_month_title_idx").on(
      t.userId,
      t.month,
      t.title,
    ),
    index("month_plans_user_idx").on(t.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Ghi chú nhanh                                                       */
/* ------------------------------------------------------------------ */

export const notes = pgTable(
  "notes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    content: text("content").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("notes_user_date_idx").on(t.userId, t.date)],
);

/* ------------------------------------------------------------------ */
/* Bài hát nhạc nền                                                    */
/* ------------------------------------------------------------------ */

export const favoriteSongs = pgTable(
  "favorite_songs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("favorite_songs_user_idx").on(t.userId)],
);

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type GoalStep = typeof goalSteps.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type MonthPlan = typeof monthPlans.$inferSelect;
export type CustomArea = typeof customAreas.$inferSelect;
