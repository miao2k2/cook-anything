import type { SVGProps } from "react";

import { ICON_SYMBOLS } from "@/components/icons";

type IconProps = SVGProps<SVGSVGElement> & {
  name: string;
  /** Kích thước mặc định 18px */
  size?: number;
};

/**
 * Icon vẽ tay theo phong cách Planner.
 *
 * Đường dẫn được render trực tiếp (không dùng `<use>` + sprite) để màu
 * `currentColor` kế thừa đúng từ phần tử cha — sprite `<use>` không kế thừa
 * màu từ vị trí sử dụng nên icon sẽ bị sai màu.
 */
export function Icon({ name, size = 18, className, ...rest }: IconProps) {
  const body = ICON_SYMBOLS[name];

  if (!body) {
    return (
      <svg
        aria-hidden="true"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={`shrink-0 ${className ?? ""}`}
        {...rest}
      />
    );
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`shrink-0 overflow-visible ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: body }}
      {...rest}
    />
  );
}
