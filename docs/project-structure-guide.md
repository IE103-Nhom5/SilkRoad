# TÀI LIỆU LUẬN GIẢI CẤU TRÚC VẬN HÀNH SILKROAD

> Bản thân tôi cũng không hiểu vì sao nó chạy --qct

Khi bạn mò được tài liệu này thì sẽ có một nghi vấn trong tâm: **Cấu trúc file tà đạo j đây ???**. Tôi cũng không hiểu được hết toàn bộ cấu trúc tà môn này, do một phần từ xuất thân lai tạp giữa con người và trí tuệ nhân tạo. Tuy nhiên, tài liệu này sẽ giải thích các file trong đây dùng để làm j, vì sao lại tồn tại ở đây (**THEO CÁCH HIỂU CỦA TÔI**).

Từ cổ chí kim, repo này từng bị thiên kiếp deadline đánh cho kinh mạch rối loạn, nhiều công pháp bị nhét thẳng vào `Src/App.jsx` và `Src/style.css`. Từ đợt production foundation tháng 06/2026, chính mạch mới đã được khai thông bằng TypeScript, route thật, feature module, design token và secure RPC. Hai đại tàn bản cũ vẫn còn để tra khảo lịch sử, nhưng **không còn là runtime đang chạy**.

Tài liệu vẫn giữ thuật ngữ chuyên ngành như `workflow`, `runtime`, `entrypoint`, `feature`, `layout`, `RLS`, `RBAC`, `RPC`, `Edge Function`, `refactor`. Phần kiếm hiệp chỉ để đọc đỡ buồn ngủ, không phải để làm mờ đường đi nước bước của code.

## Mục Lục

1. [Workflow Chính / Kinh Mạch Chính](#workflow-chinh)
2. [Repo Map / Bản Đồ Sơn Môn](#repo-map)
3. [Source Folder `Src/` / Động Phủ Runtime](#source-folder)
4. [Data Layer / Đường Vận Chuyển Nội Lực](#data-layer)
5. [Route Và Feature Inventory](#feature-inventory)
6. [Design System Và Layout](#design-system)
7. [Database, RLS, RBAC Và Edge Functions](#security)
8. [Legacy / Tàn Bản Cũ](#legacy)
9. [File Ownership / Muốn Sửa Gì Thì Đi Đâu](#file-ownership)
10. [Workflow Bảo Trì Và Production Gate](#maintenance)
11. [Gemini API Rule](#gemini)
12. [TL;DR / Kết Luận Cho Đệ Tử Mới Nhập Môn](#tldr)

<a id="workflow-chinh"></a>

## 1. Workflow Chính / Kinh Mạch Chính

```text
index.html
  -> Src/main.tsx
    -> Src/app/App.tsx
      -> Src/components/AppShell.tsx
      -> Src/features/*
      -> Src/core/dataService.ts
      -> Src/styles/tokens.css + Src/styles/app.css
```

| Thứ tự | File | Vai trò trong workflow |
|---:|---|---|
| 1 | `index.html` | HTML entry, tạo `#root`, gọi `/Src/main.tsx`. |
| 2 | `Src/main.tsx` | Gắn React Query, React Router và render app. |
| 3 | `Src/app/App.tsx` | Khởi tạo auth/profile và khai báo route. |
| 4 | `Src/components/AppShell.tsx` | Sidebar, topbar, account, notification, dark mode. |
| 5 | `Src/features/*` | Page và workflow nghiệp vụ đang chạy thật. |
| 6 | `Src/core/dataService.ts` | Adapter demo/Supabase/RPC. |
| 7 | `Src/styles/*` | Design token, layout responsive và dark mode. |

Muốn nhập môn nhanh, đọc đúng thứ tự trên. Đừng đọc `Src/App.jsx` cũ từ đầu tới cuối như cổ thư, vì đó giờ là tàn bản.

<a id="repo-map"></a>

## 2. Repo Map / Bản Đồ Sơn Môn

```text
SilkRoad-UIT/
├── index.html
├── package.json
├── vite.config.js
├── tsconfig.json
├── Src/
│   ├── app/
│   ├── components/
│   ├── core/
│   ├── data/
│   ├── features/
│   ├── lib/
│   ├── styles/
│   └── assets/
├── docs/
├── dist/             # sinh ra khi build
└── node_modules/     # sinh ra khi npm install
```

`package.json` giữ dependency và script. `vite.config.js` chia production chunk. `tsconfig.json` là giới luật TypeScript. `docs/latest-run-log.md` là nhật ký tu luyện bắt buộc cập nhật sau mỗi lượt sửa/chạy quan trọng.

<a id="source-folder"></a>

## 3. Source Folder `Src/` / Động Phủ Runtime

### `Src/app/App.tsx`

Đại điện điều phối mới. Chỉ giữ session, profile, login gate và route composition. Nó không còn ôm vạn vật.

### `Src/components/`

- `AppShell.tsx`: shell ổn định; sidebar open/collapsed không làm main đổi chỗ ngoài ý muốn; mobile dùng drawer.
- `CommandPalette.tsx`: global search nhóm chức năng, sản phẩm, đơn hàng, khách hàng và nhân viên.
- `DataTable.tsx`: TanStack Table có search, sort, chọn cột, phân trang, CSV và row detail.
- `ui.tsx`: panel, button, modal, badge, loading, empty, error và retry state.

### `Src/features/`

- `DashboardPage.tsx`: KPI, biểu đồ, cảnh báo, hoạt động gần đây.
- `ModulePage.tsx`: khung danh sách chuẩn cho catalog, vận hành, CRM, RBAC, báo cáo.
- `PosPage.tsx`: chọn chi nhánh, kênh, sản phẩm gốc, biến thể, kiểm tồn và giỏ hàng.
- `SystemPage.tsx`: trạng thái nền tảng và checklist production.
- `HelpPage.tsx`: tài liệu thao tác và Gemini frontend-only.
- `LoginPage.tsx`: React Hook Form + Zod, không có public signup.

### `Src/lib/`

- `client.ts`: tạo Supabase client từ biến môi trường.
- `navigation.tsx`: route registry và icon Lucide.
- `format.ts`: format tiền/ngày và normalize tìm kiếm.
- `cart.ts`: tính tổng giỏ và kiểm giới hạn tồn.
- `*.test.ts`: unit test cho các helper/route.

<a id="data-layer"></a>

## 4. Data Layer / Đường Vận Chuyển Nội Lực

`Src/core/dataService.ts` là cửa duy nhất cho page đọc dữ liệu hoặc gọi nghiệp vụ nhạy cảm.

- Không có Supabase env: dùng `Src/data/demo.ts`, chỉ-đọc.
- Có Supabase env: đọc view/bảng đã được RLS cho phép.
- Ghi nghiệp vụ: gọi RPC transaction như `fn_create_order_app`.
- Frontend không được tự cập nhật tồn, hoàn tiền, tạo nhân viên hoặc xóa role.

POS gửi `variant_id`, `quantity`, `unit_price`, `branch_id`, `channel_id`; không gửi SKU làm định danh nghiệp vụ.

<a id="feature-inventory"></a>

## 5. Route Và Feature Inventory

| Nhóm | Route |
|---|---|
| Tổng quan | `/dashboard` |
| Hàng hóa | `/catalog/products` |
| Vận hành | `/operations/stock`, `/purchase`, `/transfer`, `/adjustment` |
| Kinh doanh | `/sales/pos`, `/orders`, `/customers`, `/returns`, `/channels` |
| Quản trị | `/admin/users`, `/roles`, `/system` |
| Công cụ | `/reports`, `/query`, `/help` |

Mọi route dùng deep-link thật qua React Router. Danh sách module dùng table chuẩn; từng dòng mở detail. POS chọn sản phẩm rồi mới chọn biến thể. Global search mở bằng `Ctrl/Cmd + K`.

<a id="design-system"></a>

## 6. Design System Và Layout

- `Src/styles/tokens.css`: màu, typography, border, shadow, light/dark token.
- `Src/styles/app.css`: shell, table, modal, dashboard, POS, help và responsive.
- Lucide là hệ icon duy nhất.
- Card tối đa `8px`.
- Runtime mới không dùng `FINAL OVERRIDE` và không dùng `!important`.
- Desktop: sidebar fixed, main offset ổn định, topbar sticky.
- Mobile: sidebar drawer, action rút gọn, không overflow ngang.

Nếu layout lại chồng, kiểm tra `--sidebar-open`, `--sidebar-closed`, `.app-main`, `.topbar` và media query trước khi triệu hồi thêm tà thuật CSS.

<a id="security"></a>

## 7. Database, RLS, RBAC Và Edge Functions

Repo database nằm cạnh UI tại `../Silkroad_database`.

- `sql/11_create_permissions.sql`: permission và RLS nghiệp vụ gốc.
- `sql/12_optimize_database.sql`: index, view, dashboard RPC và keyset pagination.
- `sql/13_production_security.sql`: `AuthUserID`, bỏ `PasswordHash`, audit log, RLS bổ sung và secure RPC.
- `supabase/functions/admin-invite-user`: invite nhân viên.
- `supabase/functions/admin-update-user-status`: khóa/mở tài khoản.
- `supabase/functions/import-catalog`: contract import catalog.
- `supabase/functions/gemini-chat`: disabled mặc định.

`anon` không có quyền nghiệp vụ. `authenticated` chỉ đọc dữ liệu qua RLS và gọi RPC được cấp quyền. Các Edge Function dùng service role ở backend, không bao giờ đưa service-role key ra frontend.

<a id="legacy"></a>

## 8. Legacy / Tàn Bản Cũ

Các file sau vẫn tồn tại để tra cứu nhưng không phải runtime:

- `Src/main.jsx`
- `Src/App.jsx`
- `Src/style.css`
- `Src/main.js`
- `Src/index.css`
- `Src/components/Layout.jsx`
- `Src/data/nav.js`
- `Src/pages/*.jsx`

Muốn biết file nào đang chạy, nhìn `index.html`. Cổng hiện tại gọi `/Src/main.tsx`.

<a id="file-ownership"></a>

## 9. File Ownership / Muốn Sửa Gì Thì Đi Đâu

| Muốn sửa | Đi vào |
|---|---|
| Auth và route | `Src/app/App.tsx` |
| Sidebar/topbar/avatar/dark mode | `Src/components/AppShell.tsx` |
| Tìm kiếm toàn hệ thống | `Src/components/CommandPalette.tsx` |
| Bảng dữ liệu chuẩn | `Src/components/DataTable.tsx` |
| Dashboard/POS/Hệ thống/Trợ giúp | `Src/features/` |
| Đọc dữ liệu và secure RPC | `Src/core/dataService.ts` |
| Route/menu/icon | `Src/lib/navigation.tsx` |
| Màu và dark mode | `Src/styles/tokens.css` |
| Layout/component CSS | `Src/styles/app.css` |
| RLS/RPC/audit | `../Silkroad_database/sql/13_production_security.sql` |
| Edge Function quản trị | `../Silkroad_database/supabase/functions/` |

<a id="maintenance"></a>

## 10. Workflow Bảo Trì Và Production Gate

Sau mỗi lượt sửa quan trọng:

```bash
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

Sau đó kiểm tra trực quan desktop/mobile, light/dark, overflow ngang và cập nhật `docs/latest-run-log.md` bằng tiếng Việt.

Quy tắc trọng yếu:

- Không sửa `node_modules`.
- Không ghi dữ liệu nhạy cảm trực tiếp từ frontend.
- Không thêm nút chỉ để trang trí.
- Không đưa API secret vào biến `VITE_*`.
- Migration SQL phải chạy trên staging trước production.

<a id="gemini"></a>

## 11. Gemini API Rule

UI trợ lý nằm ở `Src/features/HelpPage.tsx`. Frontend hiện chỉ mock phản hồi. Gemini thật phải đi qua `gemini-chat` Edge Function, có auth, permission, rate limit, timeout và audit. Khi chưa có secret/phê duyệt, function phải tiếp tục trả `503 disabled`.

<a id="tldr"></a>

## 12. TL;DR / Kết Luận Cho Đệ Tử Mới Nhập Môn

- App thật chạy qua `Src/main.tsx`, không phải `Src/main.jsx`.
- `Src/app`, `components`, `features`, `core`, `lib`, `styles` là chính mạch mới.
- `App.jsx/style.css` cũ là tàn bản legacy.
- Data nhạy cảm đi qua RPC/Edge Function; RLS/RBAC giữ cổng.
- Sửa xong phải chạy production gate và ghi `docs/latest-run-log.md`.
