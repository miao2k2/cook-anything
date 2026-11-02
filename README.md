# Planner — Ứng dụng quản lý kế hoạch & công việc

Ứng dụng **Planner / To-Do Task** full-stack, lấy cảm hứng thiết kế từ PandaVocab Planner.
Giao diện vẽ tay (hand-drawn), responsive cho cả laptop lẫn điện thoại.

## Tính năng

| Màn hình | Đường dẫn | Nội dung |
| --- | --- | --- |
| **Hôm nay** | `/today` | Vòng tròn tiến độ, việc ưu tiên (Gấp / Quan trọng), checklist thói quen, "Việc còn tồn" carry-over |
| **Mục tiêu** | `/goals` | 6 lĩnh vực + lĩnh vực tuỳ chỉnh, bước nhỏ, hạn chót, radar chart cân bằng |
| **Thói quen** | `/habits` | Ma trận lịch tháng, % hoàn thành, chuỗi hiện tại / dài nhất |
| **Kế hoạch tuần** | `/week` | Bảng 7 cột Thứ 2 → Chủ nhật, % tuần, so sánh tuần trước, quick-add |
| **Kế hoạch năm** | `/year` | Từ khóa của năm, tầm nhìn, 12 thẻ tháng |
| **Thống kê** | `/stats` | Biểu đồ đường, biểu đồ cột, năng suất theo thứ, độ đều đặn thói quen |
| **Cài đặt** | `/settings` | 9 bảng màu + chế độ tối, nhạc nền lo-fi, nhắc nhở, tên hiển thị |
| **Admin** | `/admin` | Quản lý private key: sinh key, xem user đang dùng, xoá, vô hiệu hoá / kích hoạt (chỉ admin) |
| **Đăng ký** | `/register` | Tạo tài khoản mới bằng private key do admin cấp |

## Đăng ký bằng private key

Hệ thống phân quyền đăng ký bằng **private key** — admin sinh key, người dùng dùng key đó
để tạo tài khoản mới.

- Định dạng key: `PLN-XXXX-XXXX-XXXX-XXXX` (ký tự không dễ nhầm: bỏ `0/O`, `1/I/L`, `2/Z`, `5/S`, `8/B`)
- Key được lưu **dạng băm SHA-256** — key gốc chỉ hiện đúng **1 lần** ngay sau khi sinh
- Mỗi key có thể giới hạn số lần dùng và ngày hết hạn
- Admin xem được **user nào đang dùng key nào** qua bảng `api_key_usages`

### Cách dùng

1. Đăng nhập bằng tài khoản admin → mở màn **Admin**
2. Bấm **Tạo key**, đặt tên (ví dụ "Marketing Q1"), tuỳ chọn giới hạn lượt dùng / ngày hết hạn
3. Copy key hiện ra (chỉ hiện 1 lần) và gửi cho người dùng
4. Người dùng mở `/register`, nhập email + tên + key → tài khoản được tạo và đăng nhập luôn

Tạo key ngoài giao diện (tiện cho môi trường dev/test):

```bash
npm run db:key -- "Tên key"
```

Xem trạng thái key & user trong DB:

```bash
npm run db:keys:check
```

Dọn dẹp dữ liệu test (xoá key và tài khoản `@planner.local` — chỉ chạy được với DB local):

```bash
npm run db:keys:cleanup
```

### Cấp quyền quản trị

Trong màn **Admin** → bảng **Người dùng**, bấm nút **Thành viên** / **Quản trị** để
bật/tắt quyền của từng tài khoản. Bạn không thể tự thay đổi quyền của mình.

> Tài khoản seed `demo@planner.local` mặc định là admin.


## Công nghệ

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **PostgreSQL** + **Drizzle ORM**
- Đăng nhập **không mật khẩu**: email + mã xác nhận 6 số, phiên lưu trong cookie `httpOnly` 30 ngày
- 9 bảng màu tính tự động theo công thức tương phản **WCAG 2.1**
- Bộ icon SVG tự vẽ, kế thừa `currentColor` chính xác ở mọi trạng thái

## Cấu trúc thư mục

```
├── src/
│   ├── app/
│   │   ├── (app)/          # các trang đã đăng nhập: today, goals, habits, week, year, stats, settings, admin
│   │   ├── actions/        # server actions: auth.ts, planner.ts, admin.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── login/
│   │   └── register/       # đăng ký bằng private key
│   ├── components/
│   │   ├── screens/        # giao diện từng màn hình
│   │   ├── app-shell.tsx   # khung responsive: sidebar (desktop) + bottom-nav + drawer (mobile)
│   │   └── *.tsx           # icon, chart, card, task-row, music-player, register...
│   ├── db/                 # schema.ts + client Drizzle
│   └── lib/                # theme, date, nav, data, auth, api-keys, crypto, mail
├── scripts/seed.ts          # nạp dữ liệu mẫu
├── scripts/create-key.ts    # sinh private key ngoài giao diện
├── scripts/check-keys.ts    # xem trạng thái key & user
├── scripts/cleanup-test-data.ts # dọn dẹp dữ liệu test (chỉ DB local)
├── drizzle/                # migration SQL
├── drizzle.config.ts
└── next.config.ts
```

## Chạy dự án

### 1. Cài phụ thuộc

```bash
npm install
```

### 2. Cấu hình biến môi trường

```bash
cp .env.example .env.local
```

Mặc định `.env.local` trỏ tới PostgreSQL local trên cổng `5433`:

```
DATABASE_URL=postgresql://postgres:cookanything_local_dev@127.0.0.1:5433/planner
```

### 3. Tạo bảng trong database

```bash
npm run db:migrate
```

### 4. Nạp dữ liệu mẫu (tuỳ chọn)

```bash
npm run db:seed
```

Tạo user `demo@planner.local` kèm 5 thói quen (8 tuần dữ liệu tích), 6 mục tiêu,
việc cho 4 tuần gần nhất và kế hoạch 12 tháng.

### 5. Chạy dev server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Đăng nhập

Nhập email → hệ thống gửi mã 6 số. Ở môi trường dev (chưa cấu hình `RESEND_API_KEY`)
mã hiển thị ngay trên màn hình và in ra console.

Muốn gửi email thật, đặt trong `.env.local`:

```
RESEND_API_KEY=re_xxxxxxxx
MAIL_FROM=Planner <no-reply@yourdomain.com>
```

Tài khoản mới cũng có thể đăng ký bằng private key tại `/register` — xem mục
[Đăng ký bằng private key](#đăng-ký-bằng-private-key).

## Kiểm tra chất lượng

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run build      # production build
```

## PostgreSQL local

Cluster riêng của dự án nằm ở `.postgres/data` (được `.gitignore` loại trừ).
Khởi động lại nếu máy vừa khởi động lại:

```powershell
$bin = "C:\Program Files\PostgreSQL\18\bin"
& "$bin\pg_ctl.exe" -D "C:\Dev\Github\cook-anything\.postgres\data" `
  -l "C:\Dev\Github\cook-anything\.postgres\server.log" `
  -o "-p 5433 -c listen_addresses=127.0.0.1" start
```

## Triển khai

Dùng PostgreSQL managed (Neon, Supabase, RDS...) rồi đặt `DATABASE_URL`,
`AUTH_SECRET`, `RESEND_API_KEY` trong biến môi trường của hosting.
Nếu DB dùng TLS, bật thêm `DATABASE_SSL=true`.
