# SilkRoad UI Maintenance Roadmap

## Đã áp dụng trong đợt này

- Tách cấu hình quyền, bảng tra cứu và metadata tìm kiếm sang `Src/lib/featureConfig.js`.
- Thêm `Src/lib/dbService.js` để chuẩn hóa đọc bảng Supabase và gọi procedure.
- Giữ dữ liệu từng trang bằng `pageRows` để chuyển menu không làm lẫn bảng RBAC, kho, dashboard và tra cứu.
- Đổi tạo hóa đơn POS sang luồng: tạo `orders`, tạo `order_detail`, gọi `sp_confirm_order`, fallback local có kiểm soát khi procedure không expose hoặc thiếu allocation kênh.
- Siết xác nhận phiếu nhập: chỉ fallback local khi procedure không gọi được, không bỏ qua lỗi nghiệp vụ thật.
- Chuẩn hóa topbar/sidebar bằng block CSS cuối để sidebar quyết định width main, topbar sticky và action bám phải.
- Trang tra bảng tự tải dữ liệu khi chọn bảng mới.

## Nguyên tắc bảo trì

- Cấu hình quyền hoặc thêm trang mới: cập nhật `ROLE_FEATURES`, `PAGE_ALIASES`, `PAGE_DESCRIPTIONS` trong `Src/lib/featureConfig.js`, sau đó gắn menu trong `Src/App.jsx`.
- Gọi Supabase đọc bảng đơn giản: dùng `readRows` trong `Src/lib/dbService.js`.
- Gọi procedure: dùng `callProcedure`, chỉ fallback khi `isProcedureUnavailable(error)` hoặc lỗi đã được xác định là có thể xử lý an toàn.
- Không dùng `setRows` trực tiếp cho dữ liệu trang. Dùng `commitRows(rows, pageKey)` để cache theo trang.
- CSS layout nên thêm vào block cuối cùng nếu cần override legacy, vì file hiện có nhiều lớp override cũ.

## Nâng cấp tiếp theo

- Tách `App.jsx` thành các feature pages riêng: `pages/orders`, `pages/stock`, `pages/rbac`, `pages/query`.
- Chuyển các thao tác tồn kho còn lại sang procedure/fallback: chuyển kho, kiểm kho, đổi trả.
- Thêm Supabase function wrapper cho procedure hiện đang là `PROCEDURE`, vì PostgREST/Supabase RPC ổn định nhất với `FUNCTION`.
- Tách bundle bằng lazy import cho các trang nặng để hết cảnh báo chunk trên 500 kB.
- Thêm test tự động cho POS: chọn sản phẩm gốc, chọn biến thể, thêm giỏ, tạo hóa đơn, kiểm tra tồn kho giảm đúng.
