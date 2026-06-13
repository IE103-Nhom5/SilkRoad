# Nhật Ký Cập Nhật Mới Nhất

File này dùng để ghi lại lần chạy/sửa gần nhất của dự án. Từ bây giờ, sau mỗi lượt sửa hoặc chạy kiểm tra quan trọng, cần cập nhật lại file này bằng tiếng Việt để dễ theo dõi.

## 2026-06-13 - Production foundation TypeScript, secure data layer và layout mới

### Mục tiêu

- Thay runtime `App.jsx/style.css` khổng lồ bằng kiến trúc production có thể bảo trì.
- Sửa dứt điểm sidebar/topbar chồng layout, overflow ngang và dark mode chìm chữ.
- Chuẩn hóa route, bảng dữ liệu, POS, global search, auth, RLS/RBAC, audit và secure RPC.

### Runtime frontend mới

- Chuyển entrypoint sang `Src/main.tsx`.
- Thêm React Router, TanStack Query, TanStack Table, React Hook Form, Zod, Recharts và TypeScript.
- Tách runtime thành:
  - `Src/app`
  - `Src/components`
  - `Src/core`
  - `Src/data`
  - `Src/features`
  - `Src/lib`
  - `Src/styles`
- `Src/App.jsx` và `Src/style.css` cũ vẫn được giữ để tra cứu nhưng không còn chạy.
- Thêm route thật cho dashboard, hàng hóa, vận hành, POS/đơn/CRM, RBAC, báo cáo, query và trợ giúp.

### Layout và design system

- Sidebar desktop open/collapsed dùng kích thước ổn định, không nở theo hover và không đè main.
- Mobile dùng drawer; topbar sticky; action rút gọn; không overflow ngang.
- Global search trở thành command palette, tìm theo chức năng, sản phẩm, đơn hàng, khách hàng và nhân viên.
- Chuẩn hóa icon Lucide một màu theo ngữ cảnh.
- Dark mode dùng token riêng; QA trực tiếp xác nhận chữ/icon rõ.
- Runtime CSS mới không còn `FINAL OVERRIDE` và không còn `!important`.

### Nghiệp vụ và module

- Dashboard có KPI, biểu đồ doanh thu, cảnh báo và đơn gần đây.
- Mọi module danh sách dùng bảng chuẩn có search, sort, chọn cột, phân trang, CSV và row detail.
- POS bắt buộc chọn chi nhánh, kênh bán, sản phẩm gốc rồi mới chọn biến thể.
- Modal biến thể phân biệt bằng tên size/màu và barcode; biến thể hết hàng bị khóa.
- Giỏ hàng kiểm giới hạn tồn và gửi `variant_id`, `quantity`, `unit_price` vào RPC; không dùng SKU làm định danh.
- Help/Gemini giữ frontend-only và tự cuộn xuống tin nhắn mới bằng `requestAnimationFrame`.
- Import catalog có giao diện chọn file và contract Edge Function; phần mapping/validation Excel production vẫn cần triển khai tiếp trên backend.

### Bảo mật và database

- Thêm `sql/13_production_security.sql` ở repo `Silkroad_database`.
- Thêm `USERS.AuthUserID`, liên kết `auth.users` khi schema auth tồn tại và bỏ `PasswordHash` khỏi profile công khai.
- Ánh xạ user dựa trên `auth.uid()` với fallback JWT subject cho local SQL CI.
- Thêm `AUDIT_LOG`, RLS cho bảng nghiệp vụ/catalog/reference và view `security_invoker`.
- Thu hồi quyền bảng/RPC nhạy cảm khỏi `anon`, `PUBLIC` và direct write của `authenticated`.
- Thêm secure RPC transaction:
  - `fn_create_order_app`
  - `fn_create_purchase_order_app`
  - `fn_create_transfer_app`
  - `fn_create_adjustment_app`
  - `fn_create_return_app`
- Thêm Edge Function contract:
  - `admin-invite-user`
  - `admin-update-user-status`
  - `import-catalog`
  - `gemini-chat` giữ disabled mặc định
- Edge Function quản trị/import ghi audit log.

### Tài liệu

- Viết lại `README.md` theo runtime production mới.
- Viết lại `docs/project-structure-guide.md`, giữ giọng kiếm hiệp ban đầu nhưng cập nhật đúng workflow TypeScript/RLS/RPC hiện tại.
- Cập nhật README repo database với migration 13 và lệnh deploy Edge Function.

### Kiểm tra đã chạy

```bash
npm run typecheck
npm test -- --run
npm run build
npm audit --omit=dev --json
```

Kết quả:

- TypeScript pass.
- 3 test file, 7 test pass.
- Vite production build pass.
- Production dependency audit: 0 lỗ hổng.
- Rà static: runtime mới có 0 direct write và 0 `!important/FINAL OVERRIDE`.
- Browser QA:
  - Desktop dashboard không overflow ngang.
  - Mobile POS không overflow ngang.
  - Dark mode rõ chữ/icon.
  - Workflow chọn chi nhánh → kênh → sản phẩm → biến thể → giỏ hàng hoạt động.
  - Command palette tìm được dữ liệu theo nhóm.

### Giới hạn còn lại trước khi deploy production

- Chưa chạy migration SQL thật vì máy hiện tại không có `psql` trong PATH.
- Cần chạy `sql/run_all.sql` trên Supabase staging, kiểm RLS chéo vai trò và transaction rollback.
- Cần deploy Edge Functions và cấu hình secret trên Supabase.
- `import-catalog` mới là contract an toàn; mapping/validation file Excel thật cần hoàn thiện ở backend.
- Gemini thật vẫn chủ động disabled, chưa nối API key.

### File chính thay đổi

- `Src/main.tsx`, `Src/app/*`, `Src/components/*`, `Src/core/*`, `Src/features/*`, `Src/lib/*`, `Src/styles/*`
- `README.md`, `docs/project-structure-guide.md`, `docs/latest-run-log.md`
- `../Silkroad_database/sql/13_production_security.sql`
- `../Silkroad_database/sql/run_all.sql`
- `../Silkroad_database/supabase/functions/*`

## 2026-06-03 - Rà cursor và tối ưu SQL cũ

### Yêu cầu từ người dùng

- Xem các SQL cũ có cần tối ưu thêm không.
- Đánh giá có nên thêm `cursor` hay kỹ thuật tương tự không.

### Đã rà soát

- Rà `Silkroad_database/sql/05_create_functions.sql`:
  - Các function hiện tại chủ yếu đọc nhanh theo khóa hoặc trigger helper.
  - `fn_get_stock_movement` đã có `ORDER BY Timestamp DESC`, phù hợp với index lịch sử kho.
- Rà `Silkroad_database/sql/07_create_procedures.sql`:
  - Các procedure xác nhận đơn, nhập kho, chuyển kho, kiểm kho, đổi trả đều là luồng transaction.
  - Các vòng `FOR rec IN SELECT ... LOOP` đang xử lý từng dòng chi tiết để khóa tồn kho bằng `FOR UPDATE`, kiểm tra nghiệp vụ và ghi log.
- Rà `Silkroad_database/sql/08_create_views.sql`:
  - View cũ vẫn dùng được, nhưng app nên ưu tiên thêm các view tối ưu trong `12_optimize_database.sql` cho POS/search.

### Kết luận kỹ thuật

- Không nên thêm `DECLARE CURSOR` vào các procedure giao dịch hiện tại.
- Với web app, hướng đúng là keyset/cursor pagination ở tầng API/frontend, không phải database cursor tường minh.
- Các bảng nên phân trang kiểu keyset:
  - `ORDERS`
  - `STOCK_HISTORY`
  - `CHANNEL_SYNC_LOG`

### Đã làm

- Bổ sung index phục vụ keyset pagination trong `Silkroad_database/sql/12_optimize_database.sql`:
  - `idx_order_date_id_desc`
  - `idx_stock_history_timestamp_id_desc`
  - `idx_channel_sync_received_log_desc`
- Bổ sung RPC đọc trang:
  - `fn_orders_page_app(...)`
  - `fn_stock_history_page_app(...)`
  - `fn_channel_sync_log_page_app(...)`
- Cấp quyền RPC mới cho role Supabase nếu tồn tại:
  - `anon`
  - `authenticated`
- Tạo tài liệu audit:
  - `Silkroad_database/docs/database_optimization_audit.md`
- Cập nhật `Silkroad_database/README.md` để trỏ tới tài liệu audit.

### Kiểm tra

- Đã rà reference bằng `rg`.
- Chưa chạy SQL trực tiếp vì máy hiện tại không có `psql` trong PATH.
- Không chạy `npm run build` vì lượt này chỉ sửa SQL và Markdown, không đụng runtime React.

### File đã thay đổi trong lượt này

- `../Silkroad_database/sql/12_optimize_database.sql`
- `../Silkroad_database/docs/database_optimization_audit.md`
- `../Silkroad_database/README.md`
- `docs/latest-run-log.md`

## 2026-06-03 - Tối ưu database SilkRoad

### Yêu cầu từ người dùng

- Tối ưu `dtb`/database cho hệ thống.

### Đã rà soát

- Rà app thật trong `Src/App.jsx` để biết các luồng đọc dữ liệu chính:
  - Login/profile theo `users.email`.
  - POS/product search theo product, variant, SKU, barcode, stock.
  - Dashboard đọc nhiều bảng lớn: `orders`, `order_detail`, `stock_history`, `return_order`, `payment`.
  - Kho đọc `stock`, `stock_history`, cảnh báo tồn thấp.
  - RBAC đọc `users`, `role`.
- Rà schema/index hiện có trong repo database `Silkroad_database/sql`.

### Đã làm

- Tạo file tối ưu mới:
  - `Silkroad_database/sql/12_optimize_database.sql`
- File này chỉ thêm extension, index, view và function; không reset schema, không xóa dữ liệu.
- Thêm index cho các hot path:
  - Login/RBAC: email lower-case, role/status, branch/status.
  - Product/POS search: `ProductName`, `Brand`, `SKU`, `Barcode` bằng `pg_trgm`.
  - Stock: branch/available, low-stock partial index, lịch sử kho theo thời gian.
  - Purchase/transfer/adjustment: branch/status/created date, variant lookup.
  - Sales/reporting: order status/date, payment status/date, order detail theo variant, return status/date.
- Thêm view tối ưu:
  - `vw_pos_variant_stock_catalog`: gom branch + product + variant + stock + ảnh cho POS/kho.
  - `vw_product_search_catalog`: gom product + số biến thể + tồn khả dụng + ảnh đại diện cho search/catalog.
- Thêm function:
  - `fn_dashboard_summary_app()`: gom KPI dashboard bằng một RPC thay vì frontend phải kéo nhiều bảng lớn.
- Cập nhật:
  - `Silkroad_database/sql/run_all.sql` để gọi `11_create_permissions.sql` và `12_optimize_database.sql`.
  - `Silkroad_database/README.md` để ghi cách chạy riêng file tối ưu.

### Cách áp dụng

Nếu database đã tồn tại và chỉ muốn tối ưu:

```bash
psql -d silkroad -f sql/12_optimize_database.sql
```

Nếu dựng lại database từ đầu:

```bash
psql -d silkroad -f sql/run_all.sql
```

### Kiểm tra

- Đã rà reference bằng `rg`.
- Không chạy được SQL trực tiếp vì máy hiện tại không có `psql` trong PATH.
- Không chạy `npm run build` vì thay đổi chính nằm ở repo database và docs, không đụng runtime React.

### File đã thay đổi trong lượt này

- `../Silkroad_database/sql/12_optimize_database.sql`
- `../Silkroad_database/sql/run_all.sql`
- `../Silkroad_database/README.md`
- `docs/latest-run-log.md`

## 2026-06-02 - Thêm mục lục có link cho project structure guide

### Yêu cầu từ người dùng

- Thêm mục lục có link ngay đầu `docs/project-structure-guide.md`.
- Link dùng kiểu Markdown `[Tên mục](#anchor)`.

### Đã làm

- Thêm mục `Mục Lục` ngay sau phần mở đầu.
- Tạo 17 link tới các mục chính:
  - `Workflow Chính`
  - `Repo Map`
  - `Root Files`
  - `Source Folder`
  - `Library Layer`
  - `Assets`
  - `Pages Prototype`
  - `Legacy Layout`
  - `Legacy Nav Config`
  - `Documentation`
  - `Feature Inventory`
  - `Gemini API Rule`
  - `File Ownership`
  - `Non-Runtime Files`
  - `Technical Debt`
  - `Refactor Roadmap`
  - `TL;DR`
- Gắn anchor HTML ngắn trước từng heading chính để link không bị lỗi do dấu tiếng Việt hoặc ký tự đặc biệt.

### Kiểm tra

- Không chạy build vì đây là thay đổi Markdown, không đụng code runtime.
- Đã rà lại heading và anchor bằng `rg`.

### File đã thay đổi trong lượt này

- `docs/project-structure-guide.md`
- `docs/latest-run-log.md`

## 2026-06-02 - Giữ thuật ngữ chuyên ngành trong guide kiếm hiệp

### Yêu cầu từ người dùng

- Giữ giọng văn kiếm hiệp/tà môn nhưng không được mất thuật ngữ chuyên ngành.
- Các mục vẫn phải rõ kiểu `workflow chính`, `runtime`, `prototype`, `layout`, `refactor`.

### Đã làm

- Chỉnh lại heading trong `docs/project-structure-guide.md` theo dạng kỹ thuật trước, kiếm hiệp sau:
  - `Workflow Chính / Kinh Mạch Chạy Chính`
  - `Repo Map: Runtime, Docs, Prototype`
  - `Root Files / File Gốc Ở Thư Mục Chính`
  - `Source Folder Src / Động Phủ Src`
  - `Library Layer Src/lib / Tàng Kinh Các`
  - `Feature Inventory / Những Chức Năng Đang Có`
  - `Refactor Roadmap / Lộ Trình Quy Chính Về Chính Đạo`
- Khôi phục đúng câu mở đầu `Cấu trúc file tà đạo j đây ???`.
- Thêm ghi chú ngay đầu file rằng phần kiếm hiệp chỉ là phong cách, còn thuật ngữ kỹ thuật vẫn là đường dẫn chính để bảo trì.

### Kiểm tra

- Không chạy build vì đây là thay đổi Markdown, không đụng code runtime.
- Đã rà lại mục lục bằng `rg -n "^#|^##|^###"` để kiểm tra heading.

### File đã thay đổi trong lượt này

- `docs/project-structure-guide.md`
- `docs/latest-run-log.md`

## 2026-06-02 - Khôi phục giọng văn kiếm hiệp/tà môn cho project structure guide

### Yêu cầu từ người dùng

- Khôi phục đoạn mở đầu ban đầu của `docs/project-structure-guide.md`.
- Viết tiếp toàn bộ guide theo đúng giọng văn kiếm hiệp/tà môn ở đoạn đầu.

### Đã làm

- Khôi phục nguyên đoạn mở đầu:
  - `Cấu trúc file tà đạo j đây ???`
  - `cấu trúc tà môn`
  - `THEO CÁCH HIỂU CỦA TÔI`
- Viết lại các phần sau theo cùng phong cách:
  - Kinh mạch chạy chính.
  - Chính mạch đang sống.
  - Tàng thư nên giữ.
  - Tàn bản/prototype cũ.
  - Tàng kinh các `Src/lib/`.
  - Cấm địa `Src/pages/`.
  - Lộ trình quy chính về chính đạo.
- Vẫn giữ thông tin kỹ thuật thực dụng: file nào đang chạy thật, file nào không nên sửa, sửa tính năng nào thì vào đâu.

### Kiểm tra

- Không chạy build vì đây là thay đổi Markdown, không đụng code runtime.
- Đã đọc lại phần đầu file để kiểm tra đúng giọng mở đầu.

### File đã thay đổi trong lượt này

- `docs/project-structure-guide.md`
- `docs/latest-run-log.md`

## 2026-06-02 - Viết lại project structure guide cùng phong cách đoạn đầu

### Yêu cầu từ người dùng

- Chỉnh `docs/project-structure-guide.md` cho phù hợp với phong cách ở đoạn đầu.

### Đã làm

- Viết lại toàn bộ `docs/project-structure-guide.md` bằng tiếng Việt có dấu, giữ giọng văn tự thú/kỹ thuật/hơi cà khịa như phần mở đầu.
- Làm rõ hơn các nhóm file:
  - File đang chạy thật.
  - File sạch và đáng giữ.
  - File prototype/bóng ma không nên sửa nếu muốn đổi app hiện tại.
- Bổ sung hướng dẫn sửa đúng chỗ theo từng nhu cầu: POS, Dashboard, RBAC, topbar/sidebar, DB/RPC, quyền truy cập.
- Cập nhật mô tả docs hiện tại, gồm `latest-run-log.md`, `maintenance-roadmap.md`, `max-potential-roadmap.md`.
- Giữ định hướng refactor từng phần nhỏ thay vì xóa hàng loạt.

### Kiểm tra

- Không chạy build vì đây là thay đổi tài liệu Markdown, không đụng code runtime.
- Đã đọc lại phần đầu file sau khi sửa để kiểm tra giọng văn và cấu trúc.

### File đã thay đổi trong lượt này

- `docs/project-structure-guide.md`
- `docs/latest-run-log.md`

## 2026-06-02 - Sửa lỗi sidebar hover chồng lên topbar/content

### Yêu cầu từ người dùng

- Sửa lỗi layout trong ảnh: sidebar đang mở/hover bị chồng lên topbar và nội dung Dashboard.

### Nguyên nhân

- Khi sidebar ở trạng thái rút gọn (`sidebar-closed`) nhưng người dùng hover vào menu, CSS cũ cho sidebar nở ra theo chiều rộng menu mở.
- Tuy nhiên `.main` vẫn giữ khoảng cách của rail nhỏ, nên topbar/content nằm dưới phần sidebar vừa nở.

### Đã sửa

- Thêm block cuối `FINAL OVERRIDE 18: sync rail-hover sidebar with the main shell` trong `Src/style.css`.
- Khi `.app-shell.sidebar-closed` có `.sidebar:hover`, `.main` sẽ dùng cùng offset với sidebar mở:
  - `margin-left: var(--sr-main-open-offset)`
  - `width: calc(100vw - var(--sr-main-open-offset))`
  - `max-width: calc(100vw - var(--sr-main-open-offset))`
- Giữ `sidebar-rail-locked` để lúc vừa bấm đóng menu không bị hover mở lại ngay.
- Thêm transition ngắn cho `.main` để lúc sidebar nở/thu không bị giật.

### Kiểm tra đã chạy

```bash
npm run build
```

Kết quả:

- Build thành công.
- Vite không báo lỗi CSS/React.
- Dev server trả `STATUS=200` tại `http://127.0.0.1:5173/`.

### File đã thay đổi trong lượt này

- `Src/style.css`
- `docs/latest-run-log.md`

## 2026-06-02 - Phát triển tối đa tiềm năng hệ thống

### Yêu cầu từ người dùng

- Phát triển tối đa tiềm năng của app.
- Tiếp tục giữ quy ước: mỗi lần chạy/sửa xong phải cập nhật log mới nhất trong `docs/`.
- Không làm bừa API thật; các phần Gemini/AI vẫn giữ frontend-only nếu chưa có backend an toàn.

### Đã làm

- Tạo tài liệu `docs/max-potential-roadmap.md` để ghi rõ hướng phát triển SilkRoad thành hệ thống bán hàng, kho, RBAC, dashboard và trợ giúp chuyên nghiệp.
- Bổ sung trong `Src/App.jsx` phần logic “độ sẵn sàng mở rộng” cho trang Hệ thống:
  - Tính từ dữ liệu thật đang tải trong `options`: hàng hóa, biến thể, chi nhánh/kho, kênh bán, khách hàng, RBAC và ảnh sản phẩm.
  - Hiển thị phần `Tiềm năng hệ thống` với điểm phần trăm, các nền tảng đã sẵn sàng/chưa sẵn sàng.
  - Thêm các hướng nâng cấp có thể bấm sang module tương ứng: POS, kho, RBAC, tra cứu, dashboard, trợ giúp AI.
- Nâng cấp Dashboard thành bảng điều hành hơn:
  - Thêm `Trung tâm điều hành` với điểm sức khỏe vận hành.
  - Thêm các tín hiệu nhanh: dữ liệu KPI, cảnh báo, bán chạy, đơn gần đây.
  - Thêm playbook tác vụ nên làm tiếp, có nút làm mới KPI hoặc đi thẳng sang module cần xử lý.
- Bổ sung CSS trong `Src/style.css` cho:
  - `.system-potential-panel`
  - `.system-readiness-card`
  - `.system-readiness-list`
  - `.system-roadmap-grid`
  - `.dashboard-command-center`
  - `.dashboard-health-card`
  - `.dashboard-signal-grid`
  - `.dashboard-playbook`
  - Dark mode cho các class mới để chữ/icon không bị chìm nền.
  - Responsive tablet/mobile cho lưới roadmap và command center.

### Kiểm tra đã chạy

```bash
npm run build
```

Kết quả:

- Build thành công sau cả hai lượt sửa app/CSS.
- Vite không báo lỗi cú pháp React/CSS.
- Dev server hiện đang trả `STATUS=200` tại `http://127.0.0.1:5173/`.

### File đã thay đổi trong lượt này

- `Src/App.jsx`
- `Src/style.css`
- `docs/max-potential-roadmap.md`
- `docs/latest-run-log.md`

### Ghi chú bảo trì

- `SystemPage` hiện đã có comment ngắn cho block tính điểm sẵn sàng, giúp biết rõ phần này lấy dữ liệu từ đâu.
- Roadmap mới là bản định hướng để phát triển theo lộ trình, tránh sửa lan man từng lỗi nhỏ mà không có kiến trúc.
- Giai đoạn tiếp theo nên ưu tiên tách `Src/App.jsx` theo page/component và gom CSS theo module, vì đây vẫn là điểm nghẽn lớn nhất của app.

## 2026-06-02 - Sửa layout shell/sidebar/topbar và rà soát cấu trúc file

### Yêu cầu từ người dùng

- Mỗi lần chạy xong phải cập nhật log mới nhất trong `docs/`.
- Sửa lỗi layout đang thấy trong ảnh: topbar/content bị lệch và có dấu hiệu chui dưới sidebar.
- Rà soát toàn bộ file trong dự án để hiểu file nào đang dùng thật, file nào là prototype/cũ.

### Đã rà soát

- Rà danh sách file bằng `rg --files`, bỏ qua `node_modules` và `dist`.
- Kiểm tra trạng thái git bằng `git status --short`.
- Kiểm tra các file cấu trúc chính:
  - `index.html`
  - `Src/main.jsx`
  - `Src/App.jsx`
  - `Src/style.css`
  - `Src/lib/supabase.js`
  - `Src/lib/featureConfig.js`
  - `Src/lib/dbService.js`
  - `Src/components/Layout.jsx`
  - `Src/data/nav.js`
  - `Src/pages/*.jsx`
  - `docs/maintenance-roadmap.md`
  - `docs/project-structure-guide.md`

### Kết luận rà soát

- Luồng chạy thật hiện tại là `index.html -> Src/main.jsx -> Src/App.jsx -> Src/style.css`.
- `Src/App.jsx` vẫn là file chính chứa phần lớn logic/page.
- `Src/style.css` là file giao diện chính và có nhiều block override cũ.
- `Src/pages/*`, `Src/components/Layout.jsx`, `Src/data/nav.js`, `Src/main.js`, `Src/index.css` hiện là code cũ/prototype, không phải luồng chính.
- `Src/lib/*` là nhóm file đang dùng thật và nên giữ.

### Đã sửa layout

- Thêm block CSS cuối `FINAL OVERRIDE 17: canonical shell geometry` trong `Src/style.css`.
- Tạo một bộ biến kích thước chung cho shell:
  - `--sr-shell-gap`
  - `--sr-sidebar-open-final`
  - `--sr-sidebar-rail-final`
  - `--sr-main-open-offset`
  - `--sr-main-rail-offset`
- Ép sidebar desktop dùng đúng một kích thước khi mở và khi rút gọn.
- Ép `.main` bắt đầu sau đúng chiều rộng sidebar, không để topbar/content trượt dưới menu.
- Ẩn `.app-scrim` trên desktop để không tạo lớp phủ thừa khi sidebar đang mở.
- Giữ mobile/tablet về `margin-left: 0`, `width: 100vw` để layout không bị tràn ngang.

### Kiểm tra đã chạy

```bash
npm run build
```

Kết quả:

- Build thành công.
- Vite build không báo lỗi cú pháp React/CSS.
- Sau đó bật lại dev server bằng `npm run dev -- --host 127.0.0.1`.
- Dev server trả `STATUS=200` tại `http://127.0.0.1:5173/`.

### File đã thay đổi trong lượt này

- `Src/style.css`
- `docs/latest-run-log.md`

### Ghi chú bảo trì

- Khi sửa layout lớn, ưu tiên thêm/chỉnh block CSS cuối vì `style.css` đang có nhiều rule cũ dùng `!important`.
- Về lâu dài nên refactor `style.css` thành các file nhỏ như `layout.css`, `pos.css`, `dashboard.css`, `dark.css`.
- Về lâu dài nên tách `Src/App.jsx` thành các page/component thật để không phải sửa trong một file quá lớn.
