# Nhật ký chạy mới nhất

## Ngày 14/06/2026 - Sửa và nâng cấp an toàn SilkRoad

### Phạm vi đã hoàn thành

- Giữ `Src/main.tsx` làm entry production, cô lập và ghi chú các file legacy nhưng không xóa.
- Thêm `vercel.json` để mọi route SPA như `/dashboard`, `/sales/pos`, `/admin/users` được rewrite về `index.html`.
- Sửa `tsconfig.json` dùng đúng thư mục `Src` để tránh lỗi phân biệt chữ hoa/chữ thường trên Vercel/Linux.
- Làm sạch `Src/index.css`, bảo đảm file này chỉ còn CSS.
- Nâng cấp đăng nhập/đăng ký Supabase:
  - Đăng ký gửi `full_name` bằng metadata an toàn.
  - Frontend không insert trực tiếp profile và không giữ secret.
  - Tìm profile theo `AuthUserID`, chỉ fallback email cho dữ liệu cũ.
  - Hiển thị lỗi rõ khi thiếu role/profile hoặc cần xác nhận email.
- Chuẩn hóa data adapter với fallback có kiểm soát cho user/role, sản phẩm/kho, bán hàng, vận hành và kênh bán.
- Dashboard tải từng nguồn dữ liệu độc lập; một bảng lỗi không làm toàn trang crash.
- Thêm validation nghiệp vụ frontend trước khi gọi RPC:
  - Số lượng phải lớn hơn 0.
  - Không bán vượt tồn khả dụng.
  - Không chuyển kho cùng chi nhánh.
  - Giá bán không thấp hơn giá vốn.
  - Đổi trả không vượt số lượng đã bán.
- Thêm toast dùng chung gồm `success`, `error`, `warning`, `info`.
- Nâng cấp empty state, loading skeleton và thông báo demo khi Edge Function `gemini-chat` chưa khả dụng.
- Rà responsive sidebar, topbar, dashboard, đăng nhập/đăng ký và POS.

### Migration database đã thêm

- `sql/14_auth_profile_and_business_guards.sql`
- `supabase/migrations/202606140001_auth_profile_and_business_guards.sql`

Migration mới:

- Tự tạo/liên kết profile `public.users` khi Supabase Auth tạo user.
- Tự gán role mặc định `sales_staff`.
- Báo lỗi rõ nếu thiếu role mặc định.
- Bảo vệ giá bán không thấp hơn giá vốn.
- Bảo vệ số lượng đổi trả không vượt số lượng đã bán.

Migration chưa được tự động chạy trên Supabase production. Cần áp dụng migration trước khi kiểm thử đăng ký/profile thật.

### Kết quả kiểm thử

- `npm run typecheck`: đạt.
- `npm test -- --run`: đạt, 4 file test và 10 test.
- `npm run build`: đạt, 2.410 module được build.
- Kiểm tra bundle/source frontend: không phát hiện Gemini API key, service role key hoặc secret hard-code.
- Direct route `/dashboard` qua Vite preview: tải được, không trả 404.
- Desktop: topbar/sidebar/dashboard không overflow ngang.
- Mobile 390px: sidebar ẩn ngoài viewport, topbar/content sát mép trái, POS không overflow ngang.

### Giới hạn và việc cần triển khai

- Chưa thể kiểm thử end-to-end trigger đăng ký/profile, RLS và RPC trên Supabase thật vì migration chưa được áp dụng lên project production.
- Chưa deploy Edge Function hoặc thay đổi secret Gemini; frontend chỉ gọi `gemini-chat` và tự chuyển sang chế độ demo khi function lỗi.
- Các thay đổi có sẵn trong repo database tại `.gitignore`, `supabase/functions/gemini-chat/index.ts` và `supabase/functions/_shared/silkroad-context.ts` được giữ nguyên.
