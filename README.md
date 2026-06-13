# SilkRoad Management

Nền tảng quản trị bán lẻ đa chi nhánh dùng React, TypeScript, Supabase và Vercel. Runtime mới nằm trong `Src/`, thay thế luồng legacy `Src/App.jsx` và `Src/style.css`.

## Chạy local
```bash
npm install
npm run dev
```

Không có biến môi trường Supabase, app tự chạy ở chế độ demo chỉ-đọc.

## Production gate

```bash
npm run typecheck
npm test
npm run build
```

## Biến môi trường Vercel

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Không đặt service-role key hoặc Gemini API key trong frontend.

## Kiến trúc runtime

```text
Src/
├── app/          # Router và app composition
├── components/   # Shell, table, modal, command palette
├── core/         # Data service và secure RPC adapter
├── data/         # Demo data chỉ-đọc
├── features/     # Dashboard, POS, module, hệ thống, trợ giúp
├── lib/          # Supabase client, format, route registry
└── styles/       # Design tokens và CSS runtime mới
```

Các route chính:

- `/dashboard`
- `/catalog/products`
- `/operations/stock`, `/operations/purchase`, `/operations/transfer`, `/operations/adjustment`
- `/sales/pos`, `/sales/orders`, `/sales/customers`, `/sales/returns`, `/sales/channels`
- `/admin/users`, `/admin/roles`, `/admin/system`
- `/reports`, `/query`, `/help`

## Supabase

Chạy `sql/run_all.sql` ở repo `Silkroad_database`, sau đó deploy các Edge Function trong `supabase/functions/`.

- Frontend chỉ đọc trực tiếp các view/bảng được RLS cho phép.
- Tạo đơn, nhập hàng, chuyển kho, kiểm kho và đổi trả đi qua RPC transaction.
- Invite/khóa nhân viên và import catalog đi qua Edge Function.
- `gemini-chat` giữ disabled mặc định cho tới khi backend secret được cấu hình và phê duyệt.

## Tài liệu

- `docs/project-structure-guide.md`: hướng dẫn cấu trúc và workflow bảo trì.
- `docs/latest-run-log.md`: nhật ký kỹ thuật mới nhất bằng tiếng Việt.
