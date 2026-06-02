# Nhật Ký Cập Nhật Mới Nhất

File này dùng để ghi lại lần chạy/sửa gần nhất của dự án. Từ bây giờ, sau mỗi lượt sửa hoặc chạy kiểm tra quan trọng, cần cập nhật lại file này bằng tiếng Việt để dễ theo dõi.

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
