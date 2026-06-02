# TÀI LIỆU LUẬN GIẢI CẤU TRÚC VẬN HÀNH SILKROAD

> Bản thân tôi cũng không hiểu vì sao nó chạy --qct

Khi bạn mò được tài liệu này thì sẽ có một nghi vấn trong tâm: **Cấu trúc file tà đạo j đây ???** . Tôi cũng không hiểu được hết toàn bộ cấu trúc tà môn này, do một phần từ xuất thân lai tạp giữa con người và trí tuệ nhân tạo. Tuy nhiên, tài liệu này sẽ giải thích các file trong đây dùng để làm j, vì sao lại tồn tại ở đây ( **THEO CÁCH HIỂU CỦA TÔI** )

Nói theo ngôn ngữ giang hồ: repo này từng muốn đi chính đạo, chia môn phái `pages`, `components`, `lib` rất đàng hoàng. Nhưng đường tu luyện không bằng phẳng, deadline từ phương xa kéo tới, thế là nhiều công pháp được nhét thẳng vào `Src/App.jsx`. Kết quả là app vẫn vận hành được, thậm chí có khá nhiều chiêu thức, nhưng kinh mạch code hơi rối.

Tài liệu này là bí kíp nhập môn để bạn không bị lạc trong cấm địa.

## 1. Kinh Mạch Chạy Chính

Nếu chỉ muốn biết app thật chạy từ đâu, hãy nhớ chuỗi này:

```txt
index.html
  -> Src/main.jsx
    -> Src/App.jsx
      -> Src/style.css
```

Đây là đại mạch vận hành. Sửa nhầm ngoài luồng này thì giống luyện sai huyệt: tay thì múa rất hăng nhưng app trên trình duyệt vẫn đứng im.

| Thứ tự | File | Vai trò trong môn phái |
|---:|---|---|
| 1 | `index.html` | Cổng sơn môn, tạo `<div id="root"></div>`. |
| 2 | `Src/main.jsx` | Dẫn React nhập thể vào `#root`. |
| 3 | `Src/App.jsx` | Đại điện trung tâm, chứa phần lớn logic thật. |
| 4 | `Src/style.css` | Y phục, pháp trận layout, dark mode, responsive. |
| 5 | `Src/lib/*` | Tàng kinh các: Supabase, quyền, DB service. |

Nếu mới nhập môn, nên đọc theo thứ tự:

1. `index.html`
2. `Src/main.jsx`
3. `Src/App.jsx`
4. `Src/lib/featureConfig.js`
5. `Src/lib/dbService.js`
6. `Src/style.css`

Tuyệt kỹ sinh tồn: đừng đọc `App.jsx` từ dòng 1 tới dòng cuối như đọc kinh thư. Hãy dùng `rg` hoặc tìm function cần sửa.

## 2. Phân Loại Các Vùng Đất Trong Repo

Repo hiện có ba loại lãnh địa:

### Chính mạch đang sống

Đây là nơi app thật đang dựa vào:

- `index.html`
- `Src/main.jsx`
- `Src/App.jsx`
- `Src/style.css`
- `Src/lib/supabase.js`
- `Src/lib/dbService.js`
- `Src/lib/featureConfig.js`
- `Src/assets/*`

Sửa tính năng đang chạy thì chủ yếu đi vào đây.

### Tàng thư nên giữ

Đây là nơi ghi lại trí nhớ môn phái:

- `docs/latest-run-log.md`
- `docs/project-structure-guide.md`
- `docs/maintenance-roadmap.md`
- `docs/max-potential-roadmap.md`
- `README.md`

Đặc biệt, sau mỗi lần sửa/chạy kiểm tra quan trọng, phải cập nhật `docs/latest-run-log.md`. Đây là nhật ký tu luyện, không ghi thì đời sau lại hỏi "ai đã làm chuyện này".

### Tàn bản/prototype cũ

Các file này từng có ý nghĩa, nhưng hiện không phải luồng chính:

- `Src/main.js`
- `Src/index.css`
- `Src/components/Layout.jsx`
- `Src/data/nav.js`
- `Src/pages/*.jsx`
- `Src/banner.png`
- `Src/login-bg.png`

Không phải cứ thấy file là lao vào sửa. Một số file chỉ là di tích cổ. Sửa chúng có thể không làm app thay đổi.

## 3. Tổng Đàn Gốc

| File/thư mục | Trạng thái | Luận giải |
|---|---|---|
| `index.html` | Đang dùng | Cổng vào của Vite. Gọi `/Src/main.jsx`. |
| `package.json` | Đang dùng | Chứa script `dev`, `build`, `preview` và dependency. |
| `package-lock.json` | Đang dùng | Khóa phiên bản package. Không sửa tay nếu chưa hiểu hậu quả. |
| `vite.config.js` | Đang dùng | Cấu hình Vite, chia chunk khi build. |
| `README.md` | Đang dùng | Hướng dẫn chạy local, biến môi trường Supabase. |
| `docs/` | Đang dùng | Bí kíp, nhật ký, roadmap, giải thích cấu trúc. |
| `node_modules/` | Sinh ra bởi npm | Động phủ thư viện. Không sửa tay. |
| `dist/` | Sinh ra khi build | Thành phẩm sau `npm run build`. Không sửa tay. |

Nếu muốn chạy app:

```bash
npm install
npm run dev
```

Nếu muốn kiểm tra app có build được không:

```bash
npm run build
```

## 4. Động Phủ `Src/`

### `Src/main.jsx`

Đây là đệ tử gác cổng của frontend.

Nó làm:

- Import React.
- Import `App.jsx`.
- Import `style.css`.
- Render `<App />` vào `#root`.

File này nhỏ nhưng quan trọng. Nếu `App.jsx` là đại điện, `main.jsx` là người mở cửa đại điện.

### `Src/App.jsx`

Đây là nơi hội tụ phần lớn công pháp của môn phái. Động vào phải tỉnh táo.

Hiện trong `App.jsx` có:

- Menu sidebar.
- Nhóm menu cha/con.
- Login/logout.
- Session Supabase.
- Profile user.
- Role và phân quyền.
- Global search.
- Notification.
- Topbar.
- Avatar menu.
- Dark mode.
- Dashboard.
- POS bán hàng.
- Hàng hóa.
- Nhập hàng.
- Kho.
- Chuyển kho.
- Kiểm kho.
- Khách hàng.
- Đổi trả.
- Kênh bán.
- RBAC/nhân viên/quyền/log.
- Báo cáo.
- Tra bảng DB.
- Trang hệ thống.
- Trang trợ giúp.
- Widget dấu hỏi `?`.

Vì sao file này to?

- Ban đầu dự án định tách page.
- Sau đó cần demo nhanh, tính năng được đưa thẳng vào `App.jsx`.
- Mỗi lần thêm POS, RBAC, search, avatar, dark mode, layout fix thì file lại hấp thụ thêm một chiêu.
- App mạnh hơn, nhưng file cũng khó đọc hơn.

Khi muốn tìm đường trong `App.jsx`, tìm theo function:

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

Nếu sửa tính năng thật đang hiện trên màn hình, 80% khả năng bạn sẽ vào `App.jsx`.

### `Src/style.css`

Đây là pháp trận giao diện. Một file nhưng bao rất nhiều trận:

- Login.
- Sidebar.
- Topbar.
- Card.
- Form.
- Table.
- Modal.
- Dashboard.
- POS.
- Product picker.
- Stock.
- RBAC.
- System.
- Help.
- Footer.
- Dark mode.
- Responsive.
- Chat `?`.

Các block `FINAL OVERRIDE` là gì?

Đó là những tầng trận pháp được đặt cuối file để áp chế rule cũ. Vì CSS chạy theo thứ tự sau thắng trước, nên khi layout từng bị chồng chéo, cách nhanh nhất là đặt một block cuối có ghi chú rõ.

Hiện có các block quan trọng như:

- Topbar sticky.
- Sidebar mở/rút gọn.
- Icon đồng bộ.
- POS scroll/layout.
- Shell geometry.
- Sidebar hover không chồng lên topbar/content.

Lưu ý:

- Muốn sửa lỗi layout đang thấy, nhìn cuối `style.css` trước.
- Muốn chỉnh lâu dài, nên tách CSS thành module.
- Đừng rải thêm rule lung tung nếu có thể viết một block có tên rõ.

### `Src/main.js`

Tàn bản cũ.

Không phải entry thật. `index.html` không gọi file này. Sửa nó thường không ảnh hưởng app đang chạy.

### `Src/index.css`

CSS cũ.

App thật đang dùng `Src/style.css`, không phải `Src/index.css`.

## 5. Tàng Kinh Các `Src/lib/`

Đây là khu khá sạch, nên giữ và phát triển tiếp.

### `Src/lib/supabase.js`

Tạo Supabase client.

Dùng biến:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Luật cấm:

- Không nhét service role key vào đây.
- Không nhét Gemini API key vào đây.
- Không nhét secret backend vào frontend.

Vì `VITE_*` sẽ bị bundle ra browser. Người ngoài có thể soi được.

### `Src/lib/featureConfig.js`

Đây là sổ phân quyền và tra cứu.

Nó chứa:

```js
ROLE_FEATURES
QUERY_TABLES
TABLE_LABELS
PAGE_ALIASES
PAGE_DESCRIPTIONS
```

Khi nào sửa:

- Thêm trang mới.
- Đổi quyền role.
- Thêm bảng/view cho Tra bảng.
- Thêm alias để global search hiểu từ khóa.
- Đổi tên tiếng Việt cho table DB.

Nếu menu có trang mới mà role không mở được, nhìn file này.

### `Src/lib/dbService.js`

Đây là người đi đàm phán với database.

Nó làm:

- Đọc row từ Supabase.
- Gọi RPC/procedure.
- Thử nhiều tên procedure khi schema chưa đồng bộ.
- Fallback nếu view/table chưa có.
- Nhận diện lỗi schema cache.

Các hàm đáng nhớ:

```js
readRows()
readFirstAvailableTable()
callProcedureCandidates()
isProcedureUnavailable()
```

Vì database có nhiều table/view/procedure, file này giúp app không gục ngay khi DB còn đang luyện công chưa xong.

## 6. Kho Ảnh `Src/assets/`

Đây là nơi ảnh UI đang được dùng thật.

| File | Công dụng |
|---|---|
| `silkroad-logo.png` | Logo app/sidebar/login/topbar. |
| `silkroad-bg.png` | Nền sidebar. |
| `login-bg.png` | Nền login. |
| `login-frame.png` | Khung login. |
| `login-benefits.png` | Ảnh phụ login. |
| `banner.png` | Asset phụ, có thể là bản thiết kế cũ. |

Ngoài ra còn:

- `Src/banner.png`
- `Src/login-bg.png`

Hai file này nằm ngoài `assets/`, khả năng là bản duplicate cũ. App hiện ưu tiên import từ `Src/assets/`.

## 7. Cấm Địa `Src/pages/`

Nghe tên tưởng là nơi chứa page chính, nhưng hiện tại chưa phải.

Các file trong `Src/pages/` đa số là bản cũ/prototype:

| File | Ý định ban đầu | Trạng thái |
|---|---|---|
| `Dashboard.jsx` | Tổng quan | Tàn bản/prototype. |
| `Products.jsx` | Hàng hóa | Tàn bản/prototype. |
| `Purchase.jsx` | Nhập hàng | Tàn bản/prototype. |
| `Stock.jsx` | Kho | Tàn bản/prototype. |
| `Orders.jsx` | POS/đơn hàng | Tàn bản/prototype. |
| `Reports.jsx` | Báo cáo | Tàn bản/prototype. |
| `Users.jsx` | RBAC/người dùng | Tàn bản/prototype. |
| `Help.jsx` | Trợ giúp | Tàn bản/prototype. |
| `Login.jsx` | Đăng nhập | Tàn bản/prototype. |

Vì sao có mà không dùng?

- Ban đầu định tách page.
- Sau đó `App.jsx` phình nhanh hơn tốc độ refactor.
- Những file này chưa được nối lại vào luồng thật.

Cảnh báo:

- Sửa `Src/pages/Orders.jsx` không sửa POS hiện tại.
- POS thật nằm trong `function Orders(p)` bên trong `Src/App.jsx`.

## 8. Cựu Layout `Src/components/Layout.jsx`

Đây là layout cũ, không phải layout đang chạy.

Nó từng có:

- Sidebar đơn giản.
- Topbar đơn giản.
- Logout.

Layout thật hiện nằm trong `App.jsx`, gồm:

- Sidebar nhóm cha/con.
- Collapse/hover.
- Topbar sticky.
- Global search.
- Notification.
- Avatar menu.
- Dark mode.
- Widget `?`.

Khi sửa sidebar/topbar hiện tại, đừng vào `Layout.jsx` trước. Vào `App.jsx` và `style.css`.

## 9. Cựu Menu `Src/data/nav.js`

Đây là menu cũ cho `Layout.jsx`.

Menu thật hiện nằm trong `App.jsx`:

```js
MENU
MENU_GROUPS
MENU_BY_KEY
```

Quyền thật nằm trong:

```txt
Src/lib/featureConfig.js
```

Nếu sửa `nav.js` mà không thấy gì đổi, không phải bạn bị hoa mắt. Nó không điều khiển menu chính nữa.

## 10. Bí Kíp Trong `docs/`

Đây là tàng thư của repo.

| File | Công dụng |
|---|---|
| `docs/project-structure-guide.md` | Chính tài liệu này. Giải thích cấu trúc file theo giọng tà môn nhưng có ích. |
| `docs/latest-run-log.md` | Nhật ký lần sửa/chạy mới nhất. Sau mỗi lượt quan trọng phải cập nhật. |
| `docs/maintenance-roadmap.md` | Ghi chú bảo trì, hướng refactor, nguyên tắc API/Gemini. |
| `docs/max-potential-roadmap.md` | Lộ trình nâng app thành hệ thống chuyên nghiệp hơn. |

Nếu sau này không nhớ lần trước đã sửa gì, mở `latest-run-log.md`.

Nếu muốn biết nên phát triển app theo hướng nào, mở `max-potential-roadmap.md`.

## 11. Những Chiêu Thức App Đang Có

### Đăng nhập và phân quyền

- Dùng Supabase Auth.
- Sau login, app lấy profile từ bảng `users`.
- Role quyết định trang nào được mở.
- Quyền nằm trong `ROLE_FEATURES`.

### Dashboard

- KPI tổng quan.
- Trung tâm điều hành.
- Điểm sức khỏe vận hành.
- Cảnh báo cần xử lý.
- Sản phẩm bán chạy.
- Đơn hàng gần đây.
- Doanh thu 7 ngày.

### Hàng hóa

- Tạo sản phẩm gốc.
- Tạo biến thể.
- Danh mục.
- Thuộc tính size/màu.
- Ảnh sản phẩm.
- Nhà cung cấp.
- Giá nhập theo nhà cung cấp.

### POS bán hàng

- Chọn chi nhánh.
- Chọn kênh bán.
- Tìm sản phẩm.
- Chọn sản phẩm gốc trước.
- Chọn biến thể theo tên/thuộc tính, không bắt chọn SKU.
- Xem ảnh sản phẩm.
- Thêm giỏ.
- Đổi số lượng.
- Lưu giỏ tạm.
- Khôi phục giỏ tạm.
- Tạo hóa đơn.
- Giảm giá, phí ship, hình thức thanh toán.

### Kho và vận hành

- Xem tồn kho.
- Xem lịch sử kho.
- Cảnh báo sắp hết hàng.
- Nhập hàng.
- Chuyển kho.
- Kiểm kho.
- Xuất CSV.

### Khách hàng, đổi trả, kênh bán

- Tạo/cập nhật khách hàng.
- Tra cứu khách hàng.
- Tạo phiếu đổi trả.
- Hoàn kho.
- Hoàn tiền.
- Tạo chi nhánh.
- Tạo kênh bán.
- Giá theo kênh.
- Phân bổ tồn theo kênh.

### RBAC/nhân viên

- Tạo/sửa user.
- Quản lý role.
- Gán quyền.
- Thu hồi quyền.
- Khôi phục quyền.
- Xóa quyền truy cập.
- Xem profile nhân viên.
- Xem log hoạt động.

### Báo cáo và tra bảng

- Báo cáo doanh thu.
- Báo cáo tồn kho.
- Báo cáo đơn hàng.
- Chọn table/view database.
- Tải dữ liệu.
- Tìm kiếm.
- Xuất CSV.

### Trợ giúp và dấu hỏi `?`

- Trang trợ giúp có hướng dẫn thao tác.
- Widget `?` là frontend mock.
- Chưa nối Gemini API thật.
- Không nhận API key ở browser.
- Có auto-scroll xuống tin nhắn mới.

## 12. Cấm Kỵ Gemini API

Không nối Gemini trực tiếp trong React frontend.

Vì sao?

- Frontend có thể bị xem code bundle.
- Biến `VITE_*` sẽ lộ ra browser.
- API key có thể bị lấy và dùng hết quota.

Đường chính đạo:

```txt
React frontend
  -> Backend endpoint hoặc Supabase Edge Function
    -> Gemini API
```

Frontend chỉ gửi câu hỏi. Backend giữ API key, kiểm quyền, rate limit và log lỗi.

## 13. Muốn Sửa Gì Thì Đi Đâu

| Việc muốn sửa | Nơi nên vào |
|---|---|
| UI đang chạy | `Src/App.jsx`, `Src/style.css` |
| Dashboard | `function Dashboard()` trong `Src/App.jsx`, CSS `.dashboard-*` |
| POS | `function Orders()`, `ProductPickerGrid`, `VariantChoicePanel`, `ProductPreview` |
| Kho | `function Stock()` và các helper stock |
| RBAC/nhân viên | `function UsersPage()` và role helpers |
| Trang hệ thống | `function SystemPage()` |
| Trợ giúp/chat `?` | `function HelpPage()`, `function FloatingGeminiHelp()` |
| Menu sidebar | `MENU`, `MENU_GROUPS` trong `Src/App.jsx` |
| Quyền truy cập | `Src/lib/featureConfig.js` |
| Tra bảng DB | `QUERY_TABLES`, `TABLE_LABELS`, `selectTable()` |
| Đọc DB/RPC | `Src/lib/dbService.js` và function nghiệp vụ trong `App.jsx` |
| Supabase URL/key | `.env`, `Src/lib/supabase.js` |
| Topbar/sidebar layout | Cuối `Src/style.css`, các block `FINAL OVERRIDE` |
| Tài liệu/log | `docs/latest-run-log.md`, `docs/*roadmap.md` |

## 14. Những Nơi Đừng Vội Luyện

Nếu muốn sửa app hiện tại, đừng ưu tiên mấy file này:

- `Src/main.js`
- `Src/index.css`
- `Src/components/Layout.jsx`
- `Src/data/nav.js`
- `Src/pages/*.jsx`
- `Src/banner.png`
- `Src/login-bg.png`

Chúng không phải vô nghĩa, nhưng hiện không phải chính mạch.

## 15. Vì Sao Môn Phái Thành Ra Như Vậy

Tình hình đại khái:

1. Ban đầu định chia `pages/`, `components/`, `data/`.
2. Cần chạy demo nhanh.
3. Logic được đưa thẳng vào `App.jsx`.
4. CSS gặp layout chồng chéo, thêm override cuối file.
5. App có thêm POS, RBAC, search, avatar, dark mode, chat.
6. File chính càng ngày càng nặng.
7. Người đời sau mở repo và sinh nghi vấn trong tâm.

Đây không phải tuyệt lộ. Chỉ là cần dọn dần.

## 16. Lộ Trình Quy Chính Về Chính Đạo

Mục tiêu sau này:

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
    System.jsx
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
    sidebar.css
    topbar.css
    dashboard.css
    pos.css
    dark.css
```

Thứ tự nên làm:

1. Tách component dùng chung: `Card`, `Field`, `DataTable`, `Modal`.
2. Tách layout: `Sidebar`, `Topbar`, `AccountMenu`, `NotificationMenu`.
3. Tách POS: product picker, variant panel, cart table, helpers.
4. Tách Dashboard và System page.
5. Tách CSS theo module.
6. Khi mọi thứ chạy ổn, mới xóa file cũ/prototype.

Đừng xóa hàng loạt khi chưa tách xong. Đó không phải refactor, đó là tự phong ấn đường lui.

## 17. Kết Luận Cho Đệ Tử Mới Nhập Môn

Nếu chỉ nhớ một đoạn, nhớ đoạn này:

- App thật chạy qua `Src/App.jsx`.
- CSS thật nằm ở `Src/style.css`.
- `Src/lib/` là phần sạch, nên giữ.
- `Src/pages/`, `Src/components/Layout.jsx`, `Src/data/nav.js` là dấu tích cấu trúc cũ.
- Muốn sửa lỗi đang thấy trên màn hình, ưu tiên `App.jsx` và cuối `style.css`.
- Muốn app dễ bảo trì, refactor từng phần nhỏ.
- Sau mỗi lượt sửa/chạy kiểm tra quan trọng, cập nhật `docs/latest-run-log.md`.

Repo này không phải không cứu được. Nó chỉ là một môn phái từng luyện nhiều công pháp cùng lúc. Việc của chúng ta là ghi lại bí kíp, tách lại chiêu thức, rồi từng bước đưa nó về chính đạo.
