# SilkRoad UI Maintenance Roadmap

## Đã áp dụng trong đợt này

- Tách cấu hình quyền, bảng tra cứu và metadata tìm kiếm sang `Src/lib/featureConfig.js`.
- Thêm `Src/lib/dbService.js` để chuẩn hóa đọc bảng Supabase và gọi procedure.
- Giữ dữ liệu từng trang bằng `pageRows` để chuyển menu không làm lẫn bảng RBAC, kho, dashboard và tra cứu.
- Đổi tạo hóa đơn POS sang luồng: tạo `orders`, tạo `order_detail`, gọi `sp_confirm_order`, fallback local có kiểm soát khi procedure không expose hoặc thiếu allocation kênh.
- Siết xác nhận phiếu nhập: chỉ fallback local khi procedure không gọi được, không bỏ qua lỗi nghiệp vụ thật.
- Thêm wrapper function `fn_*_app` trong `Silkroad_database/sql/07_create_procedures.sql` để Supabase RPC gọi nghiệp vụ ổn định hơn.
- Chuyển chuyển kho và kiểm kho sang mô hình tạo chứng từ trước, gọi routine DB, fallback local nếu database chưa cập nhật wrapper.
- Chuyển đổi trả sang mô hình tạo phiếu pending, gọi `fn_complete_return_order_app` để hoàn kho/ghi log, fallback local nếu DB chưa cập nhật.
- Chặn đổi trả vượt số đã bán qua nhiều phiếu, kiểm ở cả app và routine DB.
- Khi đổi trả có hoàn tiền, routine/fallback cập nhật đơn gốc `paymentstatus = refunded` và ghi payment refund cho `cash`/`bank_transfer`.
- Thêm `partially_refunded` cho đơn hoàn tiền một phần; UI hiển thị "Hoàn một phần" thay vì raw enum.
- Chuẩn hóa topbar/sidebar bằng block CSS cuối để sidebar quyết định width main, topbar sticky và action bám phải.
- Trang tra bảng tự tải dữ liệu khi chọn bảng mới.
- Tách vendor chunk trong `vite.config.js` để build không còn cảnh báo JS chunk vượt 500 kB.
- Thêm widget dấu hỏi góc dưới phải để hỏi nhanh về thao tác app và hướng dẫn nối Gemini. Widget này chỉ là frontend mock, chưa gọi API và không nhận API key ở trình duyệt.
- Chuẩn hóa block CSS cuối cho icon một màu, dark mode dễ đọc hơn, topbar sticky, search gọn hơn, action bám phải và panel trợ giúp responsive.

## Nguyên tắc bảo trì

- Cấu hình quyền hoặc thêm trang mới: cập nhật `ROLE_FEATURES`, `PAGE_ALIASES`, `PAGE_DESCRIPTIONS` trong `Src/lib/featureConfig.js`, sau đó gắn menu trong `Src/App.jsx`.
- Gọi Supabase đọc bảng đơn giản: dùng `readRows` trong `Src/lib/dbService.js`.
- Gọi nghiệp vụ DB: dùng `callProcedureCandidates` với function wrapper `fn_*_app` trước, legacy `sp_*` sau. Chỉ fallback khi `isProcedureUnavailable(error)` hoặc lỗi đã được xác định là có thể xử lý an toàn.
- Không dùng `setRows` trực tiếp cho dữ liệu trang. Dùng `commitRows(rows, pageKey)` để cache theo trang.
- CSS layout nên thêm vào block cuối cùng nếu cần override legacy, vì file hiện có nhiều lớp override cũ.
- Tích hợp AI/Gemini phải đi qua backend endpoint riêng. Không đưa Gemini API key vào React/Vite public env, localStorage, source code hoặc request gọi trực tiếp từ browser.

## Nâng cấp tiếp theo

- Tách `App.jsx` thành các feature pages riêng: `pages/orders`, `pages/stock`, `pages/rbac`, `pages/query`.
- Bổ sung báo cáo hoàn tiền theo ngày/kênh để tách doanh thu thuần và tiền hoàn.
- Sau khi deploy SQL mới, refresh schema cache Supabase để RPC thấy các `fn_*_app`.
- Tách page/component khỏi `App.jsx` để giảm bundle app chính thêm nữa và dễ review từng module.
- Thêm test tự động cho POS: chọn sản phẩm gốc, chọn biến thể, thêm giỏ, tạo hóa đơn, kiểm tra tồn kho giảm đúng.
- Khi muốn bật Gemini thật: tạo backend `POST /api/gemini-chat`, giữ `GEMINI_API_KEY` ở biến môi trường server, kiểm quyền user/rate limit, rồi thay mock trong `FloatingGeminiHelp` bằng `fetch` tới endpoint đó.
