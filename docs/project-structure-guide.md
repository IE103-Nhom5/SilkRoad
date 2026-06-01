# Huong Dan Cau Truc Du An SilkRoad UIT
>> Bản thân tôi cũng không hiểu vì sao nó chạy --qct

Khi bạn mò được tài liệu này thì đọc tài liệu này sẽ giải đáp được nghi vấn trong lòng: **Cấu trúc file tà đạo j đây ??? **. Tôi cũng không hiểu được hết toàn bộ cấu trúc tà môn này, do một phần từ xuất thân lai tạp giữa con người và trí tuệ nhân tạo. Tuy nhiên, tài liệu này sẽ giải thích các file trong đây dùng để làm j, vì sao lại tồn tại ở đây ( **THEO CÁC HIỂU CỦA TÔI** )

## 1. Luong Chay Chinh

Duong chay that cua app:

```txt
index.html
  -> Src/main.jsx
    -> Src/App.jsx
      -> Src/style.css
      -> Src/lib/*
      -> Src/assets/*
```

Y nghia:

- `index.html` tao node goc `<div id="root"></div>`.
- `Src/main.jsx` gan React vao `root`.
- `Src/App.jsx` la file dieu khien app chinh.
- `Src/style.css` la file giao dien chinh.
- `Src/lib/*` chua cau hinh Supabase, quyen, helper database.

Neu muon hieu app dang chay nhu the nao, doc theo thu tu:

1. `index.html`
2. `Src/main.jsx`
3. `Src/App.jsx`
4. `Src/lib/featureConfig.js`
5. `Src/lib/dbService.js`
6. `Src/style.css`

## 2. File Goc O Thu Muc Root

| File / thu muc | Dang dung? | Cong dung |
|---|---:|---|
| `index.html` | Co | Entry HTML cua Vite. No import `/Src/main.jsx`. |
| `package.json` | Co | Khai bao scripts va dependencies. |
| `package-lock.json` | Co | Khoa phien ban package. Khong sua tay. |
| `vite.config.js` | Co | Cau hinh Vite, chia chunk React/Supabase/icon khi build. |
| `README.md` | Co | Huong dan chay local va bien moi truong Supabase. |
| `docs/` | Co | Tai lieu bao tri, roadmap, giai thich cau truc. |
| `node_modules/` | Co nhung khong sua | Thu vien npm da cai. |
| `dist/` | Sinh ra khi build | Output build, khong sua tay. |

## 3. Thu Muc `Src/`

### `Src/main.jsx`

Dang dung that.

Nhiem vu:

- Import React.
- Import `App.jsx`.
- Import `style.css`.
- Render `<App />` vao `#root`.

Day la entrypoint frontend that.

### `Src/main.js`

Khong nen dung.

File nay la ban cu/prototype. No co code layout nhap nho va khong duoc `index.html` import. Neu sua file nay thi app that khong thay doi.

Nen xu ly sau nay:

- Xoa neu khong con can.
- Hoac doi ten vao thu muc archive neu muon giu lam tham khao.

### `Src/App.jsx`

Dang dung that va la file quan trong nhat.

Hien tai no chua rat nhieu thu:

- Cau hinh menu sidebar.
- Login / logout.
- Lay session Supabase.
- Lay profile user va role.
- Phan quyen hien trang.
- Global search.
- Notification.
- Topbar / sidebar / avatar menu.
- Dashboard.
- Hang hoa.
- Nhap hang.
- Kho.
- Chuyen kho.
- Kiem kho.
- Ban hang POS.
- Khach hang.
- Doi tra.
- Kenh ban.
- RBAC / nhan vien / quyen.
- Bao cao.
- Tra bang database.
- Trang tro giup.
- Widget chat dau hoi `?`.

Vi sao file nay qua lon:

- Ban dau du an co y dinh tach `pages/`.
- Sau do can them tinh nang nhanh de demo/chay duoc.
- Nhieu chuc nang duoc dua truc tiep vao `App.jsx`.
- Ket qua la app chay duoc, nhung kho doc va kho bao tri.

Khi doc `App.jsx`, nen tim theo ten function thay vi doc tu tren xuong:

```txt
function App()
function Dashboard()
function Products()
function Orders()
function Stock()
function UsersPage()
function SystemPage()
function HelpPage()
function FloatingGeminiHelp()
```

### `Src/style.css`

Dang dung that.

Nhiem vu:

- Style tong the app.
- Sidebar.
- Topbar.
- Login page.
- Dashboard.
- POS ban hang.
- Bang du lieu.
- Form.
- Modal.
- Dark mode.
- Responsive.
- Widget chat `?`.

Vi sao co nhieu block `FINAL OVERRIDE`:

- CSS cu co nhieu rule trung class nhu `.topbar`, `.sidebar`, `.product-grid`.
- Rule nam sau se ghi de rule nam truoc.
- Khi can sua layout nhanh, them block cuoi file giup rule moi thang rule cu.

Day la cach tam chap nhan duoc de fix nhanh. Ve lau dai nen tach CSS thanh nhieu file ro rang.

## 4. Thu Muc `Src/lib/`

### `Src/lib/supabase.js`

Dang dung that.

Nhiem vu:

- Tao Supabase client.
- Dung bien moi truong:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

Luu y:

- `VITE_*` la bien frontend, co the lo tren trinh duyet.
- Chi de Supabase anon key o day.
- Khong dua secret key, service role key, Gemini API key vao frontend.

### `Src/lib/featureConfig.js`

Dang dung that.

Nhiem vu:

- Quan ly role nao duoc vao trang nao.
- Quan ly danh sach bang co the tra cuu.
- Doi ten bang database sang ten tieng Viet.
- Cau hinh alias cho global search.
- Mo ta trang cho search suggestion.

Thanh phan chinh:

```js
ROLE_FEATURES
QUERY_TABLES
TABLE_LABELS
PAGE_ALIASES
PAGE_DESCRIPTIONS
```

Khi nao sua file nay:

- Them trang moi vao menu/quyen.
- Doi quyen role.
- Them bang/view moi vao trang Tra bang.
- Them tu khoa de search nhanh den trang.

### `Src/lib/dbService.js`

Dang dung that.

Nhiem vu:

- Doc du lieu tu Supabase.
- Goi RPC/procedure.
- Thu nhieu procedure name khac nhau khi database chua dong bo schema.
- Nhan biet loi Supabase schema cache / procedure unavailable.

Ham quan trong:

```js
readRows()
readFirstAvailableTable()
callProcedure()
callProcedureCandidates()
isProcedureUnavailable()
```

Vi sao can file nay:

- Database co nhieu table/view/procedure.
- Supabase RPC doi khi chua refresh schema cache.
- App can fallback an toan thay vi crash ngay.

## 5. Thu Muc `Src/assets/`

Dang dung de chua anh UI.

| File | Cong dung |
|---|---|
| `silkroad-logo.png` | Logo app/sidebar/login. |
| `silkroad-bg.png` | Nen sidebar. |
| `login-bg.png` | Nen trang dang nhap. |
| `login-frame.png` | Khung trang dang nhap. |
| `login-benefits.png` | Anh phu login. |
| `banner.png` | Banner/asset phu, co the la ban cu. |

Ngoai ra trong `Src/` con co:

- `Src/banner.png`
- `Src/login-bg.png`

Hai file nay co ve la ban duplicate cu. App that hien uu tien import tu `Src/assets/`.

## 6. Thu Muc `Src/pages/`

Hien tai phan lon la prototype/cu, khong phai nguon chay chinh.

| File | Trang tuong ung | Trang thai |
|---|---|---|
| `Dashboard.jsx` | Tong quan | Ban cu/prototype. |
| `Products.jsx` | Hang hoa | Ban cu/prototype. |
| `Purchase.jsx` | Nhap hang | Ban cu/prototype. |
| `Stock.jsx` | Kho | Ban cu/prototype. |
| `Orders.jsx` | Don hang/POS | Ban cu/prototype. |
| `Reports.jsx` | Bao cao | Ban cu/prototype. |
| `Users.jsx` | Tai khoan/RBAC | Ban cu/prototype. |
| `Help.jsx` | Tro giup | Ban cu/prototype. |
| `Login.jsx` | Dang nhap | Ban cu/prototype. |

Vi sao co ma khong dung:

- Ban dau du an co cau truc tach page.
- Sau do `App.jsx` duoc mo rong nhanh va tro thanh noi chua logic that.
- Cac file `pages/` chua duoc ket noi lai.

Can than:

- Sua `Src/pages/Orders.jsx` khong lam thay doi POS hien tai.
- POS hien tai nam trong `function Orders(p)` ben trong `Src/App.jsx`.

## 7. Thu Muc `Src/components/`

### `Src/components/Layout.jsx`

Khong phai layout chinh hien tai.

No la layout cu gom:

- Sidebar don gian.
- Topbar don gian.
- Logout.

App that hien da co layout moi trong `Src/App.jsx`, gom:

- Sidebar group.
- Hover/collapse.
- Topbar search.
- Notification.
- Avatar menu.
- Dark mode.
- Widget chat.

## 8. Thu Muc `Src/data/`

### `Src/data/nav.js`

Khong phai menu chinh hien tai.

File nay dung cho `components/Layout.jsx` cu.

Menu chinh hien tai nam trong `Src/App.jsx`:

```js
MENU
MENU_GROUPS
MENU_BY_KEY
```

Quyen hien trang nam trong:

```js
Src/lib/featureConfig.js
```

## 9. Docs

### `docs/maintenance-roadmap.md`

Dang dung lam ghi chu bao tri.

No ghi:

- Nhung gi da nang cap.
- Nguyen tac bao tri.
- Huong refactor tiep theo.
- Luu y Gemini chi la frontend mock.
- Luu y Supabase RPC/procedure.

### `docs/project-structure-guide.md`

Chinh la file nay.

Muc dich:

- Giai thich file nao lam gi.
- Chi ro file nao dang dung that.
- Giai thich vi sao cau truc hien tai bi lon/chong cheo.
- Dua ra huong don dep lai.

## 10. Cac Chuc Nang Dang Co

### Dang nhap va phan quyen

- Dung Supabase Auth.
- Sau khi login, app lay user profile trong database.
- Role quyet dinh trang nao duoc mo.
- Role config nam trong `ROLE_FEATURES`.

### Dashboard

- KPI tong quan.
- Tong san pham.
- Tong ton kho.
- Don hang.
- Doanh thu.
- Canh bao.

### Hang hoa

- Tao san pham goc.
- Tao bien the.
- Danh muc.
- Thuoc tinh size/mau.
- Anh san pham.
- Nha cung cap.
- Gia nhap theo nha cung cap.

### Nhap hang

- Tao phieu nhap.
- Tao chi tiet phieu nhap.
- Xac nhan nhap kho.
- Fallback neu procedure chua expose.

### Kho

- Xem ton kho.
- Xem lich su kho.
- Canh bao sap het hang.
- Xuat CSV.

### Chuyen kho

- Tao phieu chuyen.
- Chuyen hang giua chi nhanh.
- Ghi lich su ton kho.

### Kiem kho

- Dieu chinh ton kho.
- Tao log kiem kho.

### Ban hang POS

- Chon chi nhanh.
- Chon kenh ban.
- Tim san pham.
- Chon san pham goc.
- Chon bien the theo ten, khong bat nguoi dung chon SKU.
- Xem anh san pham.
- Them gio.
- Doi so luong trong gio.
- Luu gio tam.
- Khoi phuc gio tam.
- Tao hoa don.
- Giam gia, phi ship, hinh thuc thanh toan.

### Khach hang

- Tao/cap nhat khach hang.
- Tra cuu khach hang.
- Gan khach voi don bang phone.

### Doi tra

- Tao phieu doi tra.
- Hoan kho.
- Hoan tien.
- Cap nhat trang thai thanh toan.

### Kenh ban

- Tao chi nhanh.
- Tao kenh ban.
- Gia theo kenh.
- Phan bo ton kho theo kenh.

### RBAC / Nhan vien

- Tao/sua user.
- Quan ly role.
- Gan quyen.
- Thu hoi/khoi phuc/xoa quyen truy cap.
- Xem profile nhan vien va log hoat dong.

### Bao cao

- Bao cao doanh thu.
- Bao cao ton kho.
- Bao cao don hang.
- Xuat CSV.

### Tra bang

- Chon bang/view database.
- Tai du lieu.
- Tim kiem.
- Xuat CSV.

### Tro giup

- Huong dan thao tac.
- Chan doan nhanh.
- Dieu huong den cac trang hay dung.

### Chat dau hoi `?`

- La frontend mock.
- Chua noi Gemini API that.
- Khong nhan API key.
- Co auto-scroll xuong tin nhan moi.

## 11. Vi Sao Khong Noi Gemini Truc Tiep Trong Frontend

Khong nen de Gemini API key trong React vi:

- Code frontend co the bi xem tren browser.
- Bien `VITE_*` se bi bundle vao JS.
- API key co the bi lay va dung het quota.

Khi muon noi that:

```txt
React frontend
  -> Backend endpoint / Supabase Edge Function
    -> Gemini API
```

Frontend chi gui cau hoi. Backend moi giu API key.

## 12. Nen Sua File Nao Khi Can Lam Viec

| Viec can sua | File nen sua |
|---|---|
| Sua UI dang chay | `Src/App.jsx`, `Src/style.css` |
| Sua POS ban hang | `function Orders`, `ProductPickerGrid`, `VariantChoicePanel`, `ProductPreview` trong `Src/App.jsx`; CSS POS trong `Src/style.css` |
| Sua menu/quyen | `Src/lib/featureConfig.js`, `MENU_GROUPS` trong `Src/App.jsx` |
| Sua database read/RPC | `Src/lib/dbService.js` va cac function nghiep vu trong `Src/App.jsx` |
| Sua Supabase URL/key | `.env`, `Src/lib/supabase.js` |
| Sua login | `Login` trong `Src/App.jsx`, asset login, CSS login |
| Sua topbar/sidebar | Layout trong `App.jsx`, CSS override cuoi `style.css` |
| Them trang moi | Them key vao menu/quyen, tao component page, render theo `page === "..."` |

## 13. Nhung File Khong Nen Sua Neu Muon Thay Doi App Hien Tai

Nhung file nay hien khong phai luong chay chinh:

- `Src/main.js`
- `Src/components/Layout.jsx`
- `Src/data/nav.js`
- `Src/pages/*.jsx`
- `Src/index.css`

Sua chung co the khong thay doi app tren trinh duyet.

## 14. Huong Don Dep Lai Cau Truc

Muc tieu lau dai:

```txt
Src/
  main.jsx
  App.jsx
  lib/
    supabase.js
    dbService.js
    featureConfig.js
  components/
    layout/
      Sidebar.jsx
      Topbar.jsx
      AccountMenu.jsx
      NotificationMenu.jsx
    common/
      Card.jsx
      Field.jsx
      DataTable.jsx
      Modal.jsx
  pages/
    Dashboard.jsx
    Products.jsx
    Orders.jsx
    Stock.jsx
    Users.jsx
    Reports.jsx
    Help.jsx
  features/
    pos/
      ProductPickerGrid.jsx
      VariantChoicePanel.jsx
      ProductPreview.jsx
      CartTable.jsx
      posHelpers.js
  styles/
    base.css
    layout.css
    pos.css
    dashboard.css
    dark.css
```

Thu tu refactor nen lam:

1. Tach component dung chung: `Card`, `Field`, `DataTable`, `Modal`.
2. Tach layout: `Sidebar`, `Topbar`, `AccountMenu`, `NotificationMenu`.
3. Tach POS: `ProductPickerGrid`, `VariantChoicePanel`, `ProductPreview`, `CartTable`.
4. Tach tung page khoi `App.jsx`.
5. Tach CSS theo module.
6. Xoa file cu khong dung.

## 15. Ket Luan Ngan Gon

Hien tai:

- App chay that qua `Src/App.jsx`.
- CSS that qua `Src/style.css`.
- `Src/pages`, `Src/components`, `Src/data` la dau vet cau truc cu.
- `Src/lib` la phan dang sach va nen giu.
- Nen refactor dan, khong xoa hang loat khi chua tach xong.

Neu chi can sua tinh nang ngay bay gio, tap trung vao:

```txt
Src/App.jsx
Src/style.css
Src/lib/featureConfig.js
Src/lib/dbService.js
```

