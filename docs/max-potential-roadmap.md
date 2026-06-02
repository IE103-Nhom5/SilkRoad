# Lộ Trình Phát Triển Tối Đa Tiềm Năng SilkRoad

Tài liệu này dùng để định hướng nâng cấp app từ mức demo/quản trị nội bộ thành một hệ thống bán hàng, kho và vận hành chuyên nghiệp. Mục tiêu không phải nhồi thật nhiều màn hình, mà là làm các chức năng có ích, có dữ liệu thật, dễ bảo trì và không phá layout.

## 1. Tầm Nhìn Sản Phẩm

SilkRoad nên được phát triển theo hướng một nền tảng quản trị bán lẻ đa chi nhánh:

- POS bán hàng nhanh, chọn sản phẩm gốc rồi chọn biến thể rõ ràng.
- Quản lý tồn kho theo chi nhánh, kênh bán, lịch sử nhập/xuất và cảnh báo tồn thấp.
- Quản trị hàng hóa có ảnh, biến thể, thuộc tính, giá bán, barcode và trạng thái kinh doanh.
- RBAC/nhân sự có hồ sơ nhân viên, phân quyền, khóa quyền và log thao tác.
- Báo cáo vận hành có KPI bán hàng, kho, khách hàng, doanh thu và cảnh báo.
- Trợ giúp AI ở frontend trước, khi nối thật thì đi qua backend để bảo vệ API key.

## 2. Trụ Cột Nâng Cấp

### 2.1. Kiến Trúc Mã Nguồn

Hiện tại `Src/App.jsx` vẫn là file trung tâm chứa phần lớn page, state và nghiệp vụ. Giai đoạn tiếp theo nên tách dần:

- `Src/pages/` cho từng trang thật: dashboard, POS, stock, products, users, system, help.
- `Src/components/` cho UI lặp lại: topbar, sidebar, card, data table, modal, search.
- `Src/hooks/` cho state dùng lại: search, options, cart, theme, sidebar.
- `Src/lib/` giữ các adapter DB, format tiền, id, ngày và quyền truy cập.
- `Src/styles/` tách CSS theo nhóm: layout, topbar, sidebar, pos, dashboard, dark mode.

Ưu tiên refactor từng phần nhỏ. Không nên tách toàn bộ cùng lúc vì dễ làm hỏng những logic đang chạy.

### 2.2. Layout Và Trải Nghiệm

Các lỗi layout trước đây chủ yếu đến từ nhiều block CSS override cũ cùng chỉnh sidebar/topbar. Hướng ổn định:

- Giữ một bộ biến kích thước shell duy nhất cho sidebar mở/rút gọn.
- Topbar sticky, phần action luôn dùng `margin-left: auto`.
- Search có `max-width`, không đè chuông, dark mode và avatar.
- POS không được làm người dùng phải kéo quá nhiều khi bán hàng.
- Mobile ưu tiên một cột, sidebar thành rail/drawer, không tràn ngang.

### 2.3. POS Bán Hàng

Nên nâng cấp theo thứ tự:

- Chọn sản phẩm gốc trước, sau đó chọn biến thể bằng tên biến thể, màu, size, giá, tồn khả dụng.
- Thêm quét barcode vào ô tìm kiếm nhanh.
- Giữ đơn tạm, chuyển đơn tạm, xóa đơn tạm có xác nhận.
- Tạo hóa đơn phải kiểm đủ: chi nhánh, kênh bán, khách hàng nếu có, tồn khả dụng, thanh toán.
- Khi thiếu tồn, hiển thị lý do rõ thay vì chỉ báo lỗi chung.
- Sau khi tạo hóa đơn, có màn hình hóa đơn, in/tải CSV và trạng thái thanh toán.

### 2.4. Kho Và Vận Hành

Nâng cấp đáng làm:

- Dashboard tồn kho theo chi nhánh và sản phẩm.
- Cảnh báo sắp hết hàng, hết hàng, tồn âm, thiếu ảnh.
- Lịch sử nhập/xuất dễ đọc, có bộ lọc ngày, chi nhánh, sản phẩm, loại giao dịch.
- Chuyển kho có trạng thái: nháp, gửi, nhận, hủy.
- Kiểm kho có chênh lệch trước/sau và ghi chú.
- Xuất CSV theo từng màn hình.

### 2.5. RBAC Và Nhân Sự

Nên biến trang nhân viên thành một module quản trị thật:

- Danh sách nhân viên có tìm kiếm, lọc vai trò, trạng thái.
- Nhấn vào một dòng mở hồ sơ nhân viên.
- Hồ sơ gồm thông tin, vai trò, quyền, lịch sử thao tác.
- Cho khóa/mở khóa tài khoản ở frontend và chuẩn bị hook để backend xử lý.
- Không xóa cứng quyền quan trọng; ưu tiên vô hiệu hóa hoặc xác nhận nhiều bước.

### 2.6. Báo Cáo Và Dashboard

Dashboard nên gom dữ liệu quan trọng:

- Doanh thu hôm nay, đơn hàng, tồn khả dụng, biến thể hết tồn.
- Top sản phẩm bán chạy, sản phẩm tồn cao, khách hàng mới.
- Doanh thu theo ngày/kênh/chi nhánh.
- Cảnh báo ưu tiên cần xử lý ngay.
- Lối tắt đến POS, kho, RBAC, tra bảng và trợ giúp.

### 2.7. Tìm Kiếm Toàn Cục

Search nên là trung tâm điều hướng:

- Gợi ý theo trang, bảng DB, sản phẩm, biến thể, khách hàng, đơn hàng.
- Enter mở bảng kết quả tổng hợp.
- Kết quả có nhóm, nhãn, mô tả, hành động nhanh.
- Không gợi ý chức năng người dùng không có quyền.

### 2.8. Gemini Help Frontend-Only

Hiện tại chỉ nên giữ giao diện chat frontend:

- Nút `?` nổi góc phải dưới.
- Tin nhắn tự cuộn xuống cuối.
- Gợi ý câu hỏi theo trang hiện tại.
- Hiển thị hướng dẫn cách nối API Gemini, không lưu API key trong frontend.

Khi nối thật:

- Tạo backend endpoint `POST /api/gemini-chat`.
- Đặt `GEMINI_API_KEY` ở biến môi trường server.
- Frontend gọi backend, không gọi thẳng Gemini từ trình duyệt.
- Thêm kiểm quyền, rate limit và log lỗi.

## 3. Lộ Trình Thực Hiện

### Giai Đoạn 1: Ổn Định Nền

- Chốt lại shell layout: sidebar, topbar, footer, mobile.
- Xóa hoặc gom các CSS override trùng nhau.
- Viết log sau mỗi lần sửa vào `docs/latest-run-log.md`.
- Build sau mỗi lượt thay đổi quan trọng.

### Giai Đoạn 2: Hoàn Thiện Tính Năng Có Sẵn

- POS: kiểm tồn, chọn biến thể rõ, giữ đơn, tạo hóa đơn ổn định.
- Kho: bảng tồn kho, cảnh báo, lịch sử.
- RBAC: hồ sơ nhân viên, quyền, log.
- Search: gợi ý và bảng kết quả tổng hợp.
- Avatar menu: tài khoản, thông tin, cài đặt, trợ giúp, đăng xuất có popup.

### Giai Đoạn 3: Chuyên Nghiệp Hóa UX

- Làm dashboard giàu thông tin hơn.
- Đồng bộ icon một màu, giảm trang trí thừa.
- Cải thiện dark mode để chữ không chìm nền.
- Responsive đầy đủ cho desktop, tablet, mobile.
- Thêm empty state, loading state, error state cho từng module.

### Giai Đoạn 4: Tách Kiến Trúc

- Tách `App.jsx` theo page/component.
- Tách CSS theo module.
- Đưa nghiệp vụ DB vào service/hook riêng.
- Thêm test cho helper quan trọng: tiền, id, tồn kho, search, phân quyền.

### Giai Đoạn 5: Tích Hợp Backend/AI Thật

- Chuẩn hóa API server.
- Nối Gemini qua backend.
- Thêm audit log.
- Thêm phân quyền backend.
- Chuẩn bị deploy/staging.

## 4. Ưu Tiên Ngắn Hạn

Nếu muốn phát triển nhanh nhưng ít rủi ro, nên đi theo thứ tự:

1. Sửa triệt để layout shell/topbar/sidebar/mobile.
2. Hoàn thiện POS vì đây là luồng tạo giá trị chính.
3. Hoàn thiện kho vì POS phụ thuộc tồn khả dụng.
4. Hoàn thiện RBAC/nhân viên để app giống hệ thống thật.
5. Tách dần file lớn để bảo trì nhẹ hơn.

## 5. Nguyên Tắc Bảo Trì

- Không sửa layout bằng nhiều rule rải rác nếu có thể sửa ở block cuối có ghi chú rõ.
- Không nối API key ở frontend.
- Không thêm chức năng chỉ để có nút; nút nào có thì phải có hành động rõ.
- Dữ liệu hiển thị phải ưu tiên đọc từ DB/options đang có.
- Mỗi lần build/chạy xong phải cập nhật `docs/latest-run-log.md`.
