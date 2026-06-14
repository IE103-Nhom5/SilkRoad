# Nhật ký chạy mới nhất

## Ngày 14/06/2026 23:47 - Làm lại permission layer và nối nghiệp vụ kho vận thật

- Commit trước khi sửa: `a69b51ceac9faa7efa01436c7eddba8cbf2601a6`.
- Runtime đã xác nhận: `index.html -> Src/main.tsx -> Src/app/App.tsx`; không sửa `Src/App.jsx` legacy.
- Thêm `Src/core/permissions.tsx`: user khác `active` bị chặn; active admin full access; user thường kiểm tra cả feature key UI và DB permission.
- Normalize permission hỗ trợ `text[]`, JSON array string, PostgreSQL array string và `null`.
- Menu, route guard, dashboard quick actions, POS và ModulePage đã dùng permission helper trung tâm.
- App chờ tải profile thật trước khi render shell, tránh nháy menu admin trong lúc chờ quyền.
- ModulePage gọi RPC thật để nhập hàng, chuyển kho và kiểm kho; form nhập hàng đọc `supplier` thật và gửi `supplierid`.
- Search toàn repo không còn các dấu vết draft legacy bị loại bỏ.

| Lệnh | Exit code | Kết quả |
| --- | ---: | --- |
| `npm run typecheck` | 0 | Pass |
| `npm test -- --run` | 0 | Pass, 7 test files / 18 tests |
| `npm run build` | 0 | Pass, 2.413 modules |
| `git diff --check` | 0 | Pass, chỉ có cảnh báo LF/CRLF |
| Browser local `http://127.0.0.1:4175/dashboard` | 0 | App mở đúng màn hình đăng nhập; không tự dùng/tạo mật khẩu để vào admin |

- Admin full access và ba flow kho vận đã được kiểm tra thật bằng transaction Supabase local ở repo database.

## Ngày 14/06/2026 - Đồng bộ frontend với database SilkRoad

### Trạng thái

**CHƯA HOÀN TẤT toàn bộ hệ thống.** Frontend đã pass, nhưng database chưa vượt qua gate kiểm thử Supabase local vì máy chưa có Docker Desktop/Docker daemon.

### Commit gốc và runtime đã xác minh

- Frontend HEAD trước khi sửa: `1ec46f3897be7117fff4d7ab71badd0b3376c83f`.
- Remote: `https://github.com/IE103-Nhom5/SilkRoad.git`.
- `git fetch origin` xác nhận local HEAD và `origin/main` không lệch (`0 0`).
- Runtime production: `index.html` -> `Src/main.tsx` -> `Src/app/App.tsx`.
- Các file `Src/App.jsx`, `Src/main.js`, `Src/main.jsx`, `Src/style.css` và `Src/pages/*` là legacy, không được runtime production import. Chưa xóa các file này.

### Thay đổi đã thực hiện

- Thêm `Src/core/databaseContract.ts` làm nguồn tên view, bảng và RPC dùng chung.
- Thêm `Src/core/databaseContract.test.ts` kiểm tra contract frontend cần từ database.
- Cập nhật `Src/app/App.tsx`, `Src/core/dataService.ts` và `Src/features/PosPage.tsx` dùng contract tập trung.
- Loại toàn bộ `node_modules` khỏi Git index nhưng giữ thư mục local để phát triển.
- Không đưa service role key, Gemini API key, mật khẩu hoặc secret vào bundle frontend.

### Contract database frontend yêu cầu

Views:

- `vw_product_search_catalog`
- `vw_pos_variant_stock_catalog`
- `vw_product_variant_catalog`
- `vw_stock_by_branch`
- `vw_order_summary`
- `vw_revenue_by_channel`

RPC:

- `fn_create_order_app`
- `fn_create_purchase_order_app`
- `fn_create_transfer_app`
- `fn_create_adjustment_app`
- `fn_create_return_app`
- `fn_set_inventory_allocation_app`
- `fn_cursor_low_stock_report_app`

Các tên trên đã được tìm thấy tĩnh trong migration của repo database. Chưa thể xác nhận chúng tồn tại trong database Supabase local cho tới khi Docker chạy và reset pass.

### Kết quả lệnh frontend

| Lệnh | Exit code | Kết quả |
| --- | ---: | --- |
| `npm run typecheck` | 0 | Pass |
| `npm test -- --run` | 0 | Pass, 6 test files và 15 tests |
| `npm run build` | 0 | Pass, Vite build 2.412 modules |
| `git diff --check` | 0 | Pass, chỉ có cảnh báo chuyển LF/CRLF |

### Kiểm tra file track và secret

- `tracked_node_modules=0`.
- `tracked_dist=0`.
- Chỉ `.env.example` được track; không track `.env` thật.
- Quét source không phát hiện giá trị secret hard-code. Chuỗi `GEMINI_API_KEY` trong file legacy chỉ là nội dung hướng dẫn.
- Các kết quả regex `PASSWORD` trong source là tên biến/callback, không phải mật khẩu hard-code.

### Blocker bắt buộc

- `supabase db reset --local` chưa pass hai lần.
- `sql/10_test_queries.sql` chưa được chạy trên database thật.
- Cursor chưa được gọi trên database thật.
- Cần cài và chạy Docker Desktop, sau đó chạy lại toàn bộ gate database trước khi kết luận hoàn tất.
