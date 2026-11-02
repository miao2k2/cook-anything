export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

/** 5 mục chính — hiển thị trên thanh điều hướng dưới (mobile). */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/today", label: "Hôm nay", icon: "list" },
  { href: "/goals", label: "Mục tiêu", icon: "goals" },
  { href: "/habits", label: "Thói quen", icon: "habit" },
  { href: "/week", label: "Tuần", icon: "week" },
  { href: "/year", label: "Năm", icon: "year" },
];

/** Các mục phụ — trong menu trên mobile, và trong sidebar trên desktop. */
export const SECONDARY_NAV: NavItem[] = [
  { href: "/stats", label: "Thống kê", icon: "chart" },
  { href: "/settings", label: "Cài đặt", icon: "settings" },
];

/** Mục dành riêng cho quản trị viên — chỉ hiện khi user có quyền admin. */
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Admin", icon: "shield" },
];

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
