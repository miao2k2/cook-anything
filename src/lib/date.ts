/**
 * Tiện ích ngày tuần / tháng — mọi hàm đều dùng giờ UTC để tránh lệch múi giờ
 * giữa server và client.
 */

export const WEEKDAYS_FULL = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ nhật",
] as const;

export const WEEKDAYS_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

export const MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
] as const;

/** Định dạng ngày chuẩn dùng làm khóa: "YYYY-MM-DD". */
export function toDateKey(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

/** Ngày hôm nay theo giờ UTC. */
export function todayKey(): string {
  return toDateKey(new Date());
}

/** Chuyển "YYYY-MM-DD" thành Date UTC. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** 0 = Thứ 2 ... 6 = Chủ nhật */
export function mondayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7;
}

/** Số ngày trong tháng. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Tuần ISO-8601, dạng "YYYY-Www" (tuần bắt đầu từ Thứ 2). */
export function weekKey(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Ngày bắt đầu của tuần ISO chứa `date`. */
export function weekStart(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  d.setUTCDate(d.getUTCDate() - (mondayIndex(d)));
  return d;
}

/** Lấy tuần chứa `date`, dịch `offset` tuần (offset có thể âm). */
export function shiftWeek(date: Date, offset: number): Date {
  const d = weekStart(date);
  d.setUTCDate(d.getUTCDate() + offset * 7);
  return d;
}

/** 7 ngày (Thứ 2 → Chủ nhật) của tuần chứa `date`. */
export function weekDays(date: Date): Date[] {
  const start = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d;
  });
}

/** Tất cả các tuần (key) từ `from` tới `to`. */
export function weekKeysBetween(from: Date, to: Date): string[] {
  const keys: string[] = [];
  let cursor = weekStart(from);
  const end = weekStart(to);
  let guard = 0;
  while (cursor <= end && guard < 400) {
    keys.push(weekKey(cursor));
    cursor = shiftWeek(cursor, 1);
    guard++;
  }
  return keys;
}

/** Thêm `days` ngày. */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** "YYYY-MM" cho tháng của `date`. */
export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Ngày 1 tháng. */
export function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** Ngày cuối tháng. */
export function monthEnd(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

/** Ngày 1 tháng kế tiếp. */
export function nextMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

/** Ngày 1 tháng trước. */
export function prevMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
}

/** Thêm `months` tháng. */
export function shiftMonth(date: Date, months: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
}

/** "dd/MM" */
export function formatDayMonth(date: Date): string {
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
}

/** "dd/MM/yyyy" */
export function formatFullDate(date: Date): string {
  return `${formatDayMonth(date)}/${date.getUTCFullYear()}`;
}

/**
 * Mô tả số ngày còn lại tới hạn.
 * Trả về null nếu không có hạn chót.
 */
export function deadlineInfo(
  deadline: string | null | undefined,
): { text: string; late: boolean } | null {
  if (!deadline) return null;

  const [y, m, d] = deadline.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const now = new Date();
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const diff = Math.round((target - today) / 86400000);
  const label = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;

  if (diff < 0) return { text: `${label} · quá hạn ${-diff} ngày`, late: true };
  if (diff === 0) return { text: `${label} · hôm nay`, late: false };
  return { text: `${label} · còn ${diff} ngày`, late: false };
}

/** Tỉ lệ phần trăm đã làm. */
export function percent(done: number, total: number): number {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

/** Ngày hôm nay dạng Date UTC. */
export function startOfToday(): Date {
  const n = new Date();
  return new Date(
    Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()),
  );
}
