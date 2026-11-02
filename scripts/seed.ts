/**
 * Seed dữ liệu mẫu cho môi trường dev / test.
 *
 *   npx tsx scripts/seed.ts [email]
 *
 * Mặc định tạo user `demo@planner.local` với:
 *  - 5 thói quen và lịch tích trong 8 tuần gần nhất
 *  - 6 mục tiêu thuộc 6 lĩnh vực, có bước nhỏ và hạn chót
 *  - việc cho 4 tuần gần nhất (một phần đã hoàn thành)
 *  - 12 tháng kế hoạch của năm hiện tại
 */

import { eq } from "drizzle-orm";
import postgres from "postgres";

import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "../src/db/schema";

const {
  users,
  tasks,
  goals,
  goalSteps,
  habits,
  habitChecks,
  monthPlans,
  customAreas,
  notes,
} = schema;

const EMAIL = process.argv[2] ?? "demo@planner.local";

function randomId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).slice(0, 16);
}

function dateKey(d: Date) {
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Thiếu DATABASE_URL");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  const db = drizzle(sql, { schema });

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  console.info(`→ Seeding ${EMAIL}`);

  // Xoá dữ liệu cũ của user này (nếu có)
  const existing = await db.select().from(users).where(eq(users.email, EMAIL));

  if (existing.length > 0) {
    const id = existing[0].id;
    await db.delete(tasks).where(eq(tasks.userId, id));
    await db.delete(goals).where(eq(goals.userId, id));
    await db.delete(habits).where(eq(habits.userId, id));
    await db.delete(monthPlans).where(eq(monthPlans.userId, id));
    await db.delete(customAreas).where(eq(customAreas.userId, id));
    await db.delete(notes).where(eq(notes.userId, id));
    await db.delete(users).where(eq(users.id, id));
    console.info("  · đã xoá dữ liệu cũ");
  }

  const userId = randomId();

  await db.insert(users).values({
    id: userId,
    email: EMAIL,
    emailNormalized: EMAIL.toLowerCase(),
    name: "Minh",
    themeId: "pandavocab",
    isAdmin: true,
    yearWord: "Bứt phá",
    yearVision:
      "Năm nay mình muốn có nhịp sống ổn định hơn: chạy bộ mỗi tuần, đọc 12 cuốn sách, và dành thời gian chất lượng cho gia đình.",
  });

  // Lĩnh vực tuỳ chỉnh
  await db.insert(customAreas).values({
    id: randomId(),
    userId,
    name: "Sáng tạo",
    icon: "sparkle",
    sortOrder: 0,
  });

  // Thói quen
  const habitDefs = [
    { name: "Uống 2 lít nước", rate: 0.85 },
    { name: "Tập thể dục 30 phút", rate: 0.7 },
    { name: "Đọc 20 trang sách", rate: 0.6 },
    { name: "Ngủ trước 23h", rate: 0.75 },
    { name: "Không ăn snack đêm", rate: 0.55 },
  ];

  const habitIds: string[] = [];
  for (let i = 0; i < habitDefs.length; i++) {
    const id = randomId();
    habitIds.push(id);
    await db.insert(habits).values({
      id,
      userId,
      name: habitDefs[i].name,
      sortOrder: i,
    });
  }

  // Lịch tích thói quen trong 8 tuần gần nhất
  const checkRows: Array<{ habitId: string; date: string }> = [];
  for (let dayOffset = 55; dayOffset >= 0; dayOffset--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - dayOffset);
    const key = dateKey(d);

    for (let h = 0; h < habitDefs.length; h++) {
      // Xu hướng tích điện tích dần tăng theo thời gian
      const trend = 1 - dayOffset / 70;
      const rate = Math.min(0.95, habitDefs[h].rate * (0.7 + trend * 0.45));
      if (Math.random() < rate) {
        checkRows.push({ habitId: habitIds[h], date: key });
      }
    }
  }
  if (checkRows.length > 0) {
    await db.insert(habitChecks).values(checkRows);
  }

  // Mục tiêu theo 6 lĩnh vực
  const goalDefs = [
    {
      areaId: "suc-khoe",
      title: "Chạy 5km không dừng",
      description: "Tập luyện đều đặn 4 buổi mỗi tuần",
      deadlineOffset: 45,
      steps: ["Mua giày chạy", "Chạy 2km liên tục", "Chạy 3km", "Chạy 5km"],
      doneSteps: 2,
    },
    {
      areaId: "tai-chinh",
      title: "Tích luỹ 3 tháng chi phí",
      description: "Tiết kiệm đều mỗi tháng",
      deadlineOffset: 90,
      steps: ["Lập bảng chi phí", "Tạo tài khoản tiết kiệm", "Cắt chi phí ăn uống"],
      doneSteps: 2,
    },
    {
      areaId: "su-nghiep",
      title: "Hoàn thành chứng chỉ chuyên môn",
      description: "Khóa học 60 giờ",
      deadlineOffset: 60,
      steps: ["Đăng ký khóa học", "Học module 1", "Học module 2", "Làm đồ án", "Thi"],
      doneSteps: 3,
    },
    {
      areaId: "phat-trien",
      title: "Viết 12 bài blog",
      description: "Chia sẻ kiến thức mỗi tháng một bài",
      deadlineOffset: 120,
      steps: ["Chọn chủ đề", "Viết bộ dàn ý", "Viết bản thảo"],
      doneSteps: 1,
    },
    {
      areaId: "moi-quan-he",
      title: "Dành 1 buổi/tuần cho gia đình",
      description: "Ăn tối cùng gia đình mỗi chủ nhật",
      deadlineOffset: 30,
      steps: ["Chốt lịch cố định", "Đặt lịch trước"],
      doneSteps: 2,
    },
    {
      areaId: "hoc-tap",
      title: "Học xong khoá Tiếng Anh",
      description: "120 giờ học trong 6 tháng",
      deadlineOffset: 75,
      steps: ["Hoàn thành level A2", "Học level B1", "Luyện nói hằng ngày"],
      doneSteps: 1,
    },
  ];

  for (let g = 0; g < goalDefs.length; g++) {
    const def = goalDefs[g];
    const goalId = randomId();
    const deadline = new Date(today);
    deadline.setUTCDate(deadline.getUTCDate() + def.deadlineOffset);

    await db.insert(goals).values({
      id: goalId,
      userId,
      areaId: def.areaId,
      title: def.title,
      description: def.description,
      deadline: dateKey(deadline),
      sortOrder: g,
    });

    for (let s = 0; s < def.steps.length; s++) {
      await db.insert(goalSteps).values({
        id: randomId(),
        goalId,
        text: def.steps[s],
        done: s < def.doneSteps,
        sortOrder: s,
      });
    }
  }

  // Việc cho 4 tuần gần nhất
  const taskPool = [
    "Dậy lúc 6:30 sáng",
    "Tập thể dục buổi sáng",
    "Đọc 20 trang sách",
    "Trả lời email công việc",
    "Lập kế hoạch ngày mai",
    "Nấu ăn tối",
    "Dọn bàn làm việc",
    "Học 1 chương khoá Tiếng Anh",
    "Viết nhật ký ngày",
    "Liên hệ với bạn bè",
    "Chuẩn bị slide thuyết trình",
    "Đi mua thực phẩm",
    "Kiểm tra ngân sách chi phí",
    "Chạy bộ 3km",
    "Ngủ trước 23h",
  ];

  const taskRows: Array<typeof tasks.$inferInsert> = [];

  for (let dayOffset = 27; dayOffset >= -3; dayOffset--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - dayOffset);
    const key = dateKey(d);

    const count = 3 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const text = taskPool[Math.floor(Math.random() * taskPool.length)];
      // Việc quá khứ đã xong một phần
      const isPast = dayOffset > 0;
      const done = isPast ? Math.random() < 0.78 : Math.random() < 0.3;

      taskRows.push({
        id: randomId(),
        userId,
        date: key,
        text,
        done,
        priority: Math.random() < 0.25 ? (Math.random() < 0.5 ? 1 : 2) : null,
        completedAt: done ? d : null,
        sortOrder: i,
      });
    }
  }

  if (taskRows.length > 0) {
    await db.insert(tasks).values(taskRows);
  }

  // Kế hoạch 12 tháng của năm hiện tại
  const year = today.getUTCFullYear();
  const monthTitles: Record<number, string[]> = {
    1: ["Bắt đầu chạy bộ", "Đọc 2 cuốn", "Lập ngân sách Q1"],
    2: ["Dự án cá nhân", "Học 2 chương", "Dọn phòng"],
    3: ["Review quý 1", "Viết blog #1", "Kế hoạch Q2"],
    4: ["Đi du lịch ngắn", "Thi giữa kỳ", "Tập gym 4x/tuần"],
    5: ["Thử nghiệm công cụ mới", "Viết blog #2", "Gặp bạn cũ"],
    6: ["Nửa năm rồi — đánh giá", "Khóa học nâng cao", "Dọn tủ quần áo"],
    7: ["Nghỉ ngơi", "Lên kế hoạch nửa sau năm"],
    8: ["Thử marathon mini", "Đọc 3 cuốn", "Dự buổi nói chuyện"],
    9: ["Khởi động Q4", "Cập nhật CV"],
    10: ["Hoàn thành chứng chỉ", "Kỷ niệm 1 năm"],
    11: ["Tái lập kế hoạch năm sau", "Cày cấp"],
    12: ["Tổng kết năm", "Vui chơi", "Lên kế hoạch 12 tháng sau"],
  };

  const monthRows: Array<typeof monthPlans.$inferInsert> = [];
  for (let m = 0; m < 12; m++) {
    const titles = monthTitles[m + 1] ?? [];
    for (let t = 0; t < titles.length; t++) {
      monthRows.push({
        id: randomId(),
        userId,
        month: `${year}-${String(m + 1).padStart(2, "0")}`,
        title: titles[t],
        done: m < today.getUTCMonth() ? Math.random() < 0.8 : Math.random() < 0.3,
        sortOrder: t,
      });
    }
  }
  if (monthRows.length > 0) {
    await db.insert(monthPlans).values(monthRows);
  }

  console.info("✔ Hoàn tất.");
  console.info(`  · ${taskRows.length} việc`);
  console.info(`  · ${checkRows.length} lượt tích thói quen`);
  console.info(`  · ${goalDefs.length} mục tiêu`);
  console.info(`  · ${monthRows.length} kế hoạch tháng`);
  console.info("");
  console.info(`Đăng nhập bằng email: ${EMAIL}`);

  await sql.end();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
