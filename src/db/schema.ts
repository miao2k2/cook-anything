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
    /** Người dùng có quyền quản trị (xem màn hình Admin). */
    isAdmin: boolean("is_admin").notNull().default(false),
    /** Private key đã dùng để đăng ký tài khoản này. */
    registeredByKeyId: text("registered_by_key_id"),
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
/* Private key đăng ký tài khoản                                      */
/* ------------------------------------------------------------------ */

/**
 * Private key do admin sinh ra. Người dùng mới dùng key này để đăng ký
 * tài khoản — tương tự "mã mời" nhưng dài hơn và có thể quản lý vòng đời.
 *
 * `keyHash` lưu băm SHA-256 của key. Bản gốc chỉ hiển thị đúng 1 lần
 * ngay sau khi sinh, admin không thể xem lại key đã tạo.
 */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    /** Tên gợi nhớ do admin đặt, ví dụ "Marketing Q1". */
    label: text("label").notNull(),
    /** Băm của private key. */
    keyHash: text("key_hash").notNull(),
    /** 8 ký tự đầu để admin nhận diện nhanh trong danh sách. */
    keyPrefix: text("key_prefix").notNull(),
    /** Key còn dùng được hay không. */
    isActive: boolean("is_active").notNull().default(true),
    /** Số lần tối đa được dùng để đăng ký (null = không giới hạn). */
    maxUses: integer("max_uses"),
    /** Số lần đã dùng để đăng ký. */
    usedCount: integer("used_count").notNull().default(0),
    /** Ngày hết hạn (null = không hết hạn). */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    /** Ghi chú của admin. */
    note: text("note"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Thời điểm bị vô hiệu hoá (null = còn hiệu lực). */
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("api_keys_key_hash_idx").on(t.keyHash),
    index("api_keys_active_idx").on(t.isActive),
  ],
);

/** Lần sử dụng của một private key — cho phép admin xem user nào đang dùng key. */
export const apiKeyUsages = pgTable(
  "api_key_usages",
  {
    id: text("id").primaryKey(),
    keyId: text("key_id")
      .notNull()
      .references(() => apiKeys.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Thời điểm đăng ký bằng key này. */
    usedAt: timestamp("used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Địa chỉ IP / user-agent tại thời điểm đăng ký. */
    userAgent: text("user_agent"),
  },
  (t) => [
    index("api_key_usages_key_idx").on(t.keyId),
    index("api_key_usages_user_idx").on(t.userId),
    uniqueIndex("api_key_usages_key_user_idx").on(t.keyId, t.userId),
  ],
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
export type ApiKey = typeof apiKeys.$inferSelect;
export type ApiKeyUsage = typeof apiKeyUsages.$inferSelect;
