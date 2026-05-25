# SilkRoad Frontend Demo - React + Supabase + Vercel

## Chạy local
```bash
npm install
cp .env.example .env
npm run dev
```

## Biến môi trường Vercel
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## Supabase
Chạy các file SQL trong repo database trước, sau đó seed dữ liệu mẫu. Frontend dùng đúng các bảng như product, product_variant, stock, stock_history, purchase_order, orders, users, role.

## Demo tài khoản
Nếu đang dùng Supabase Auth, tạo tài khoản trong Authentication > Users. Sau đó trong bảng users của database, tạo username/email trùng tài khoản để map role.
