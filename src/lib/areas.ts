/**
 * 6 lĩnh vực mặc định của Planner + icon tương ứng.
 */
export type Area = {
  id: string;
  name: string;
  /** Tên rút gọn dùng trên biểu đồ radar */
  short: string;
  icon: string;
};

export const DEFAULT_AREAS: Area[] = [
  { id: "suc-khoe", name: "Sức khỏe & Lành mạnh", short: "Sức khoẻ", icon: "heart" },
  { id: "tai-chinh", name: "Tài chính", short: "Tài chính", icon: "coin" },
  { id: "su-nghiep", name: "Sự nghiệp", short: "Sự nghiệp", icon: "briefcase" },
  {
    id: "phat-trien",
    name: "Phát triển bản thân",
    short: "Phát triển",
    icon: "sprout",
  },
  {
    id: "moi-quan-he",
    name: "Mối quan hệ",
    short: "Quan hệ",
    icon: "people",
  },
  { id: "hoc-tap", name: "Học tập", short: "Học tập", icon: "book" },
];

export function areaById(id: string): Area | undefined {
  return DEFAULT_AREAS.find((a) => a.id === id);
}

/** Icon tương ứng với lĩnh vực tuỳ chỉnh. */
export const CUSTOM_AREA_ICONS = [
  "sprout",
  "heart",
  "coin",
  "briefcase",
  "book",
  "people",
  "flag",
  "cloud",
  "sparkle",
  "trophy",
];
