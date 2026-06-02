# Nhật Ký Cập Nhật Mới Nhất

File này dùng để ghi lại lần chạy/sửa gần nhất của dự án. Từ bây giờ, sau mỗi lượt sửa hoặc chạy kiểm tra quan trọng, cần cập nhật lại file này bằng tiếng Việt để dễ theo dõi.

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
