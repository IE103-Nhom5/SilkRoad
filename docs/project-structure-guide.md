# TÀI LIỆU LUẬN GIẢI CẤU TRÚC VẬN HÀNH SILKROAD

> Bản thân tôi cũng không hiểu vì sao nó chạy --qct

Nếu bạn mở tài liệu này và trong đầu bật ra câu: **"Cấu trúc file tà đạo gì đây?"** thì xin chúc mừng, bạn đang quan sát đúng hiện thực. Dự án này từng có ý định tách page/component rất đàng hoàng, sau đó bị dòng đời demo dí deadline, thế là nhiều thứ quan trọng bị gom thẳng vào `Src/App.jsx`.

Nói đơn giản: app vẫn chạy, chức năng vẫn có, nhưng cấu trúc hiện tại giống một khu chợ có quy hoạch... rồi sau đó mọi người dựng thêm sạp cho kịp bán. Tài liệu này giải thích file nào đang sống thật, file nào là dấu vết cũ, nên sửa ở đâu, và tại sao nó lại thành ra như vậy.

## 1. Đọc Nhanh Nếu Bạn Đang Vội

Nếu chỉ cần biết app chạy từ đâu, nhớ 4 dòng này:

```txt
index.html
  -> Src/main.jsx
    -> Src/App.jsx
      -> Src/style.css
```

Phần sạch và đáng giữ:

- `Src/lib/supabase.js`
- `Src/lib/dbService.js`
- `Src/lib/featureConfig.js`
- `Src/assets/*`
- `docs/*`

Phần đang là trung tâm vũ trụ:

- `Src/App.jsx`
- `Src/style.css`

Phần nhiều khả năng là bóng ma/prototype:

- `Src/main.js`
- `Src/index.css`
- `Src/components/Layout.jsx`
- `Src/data/nav.js`
- `Src/pages/*.jsx`
- `Src/banner.png`
- `Src/login-bg.png`

Không phải mấy file đó vô dụng tuyệt đối, nhưng nếu bạn sửa chúng để đổi app đang chạy thì khả năng cao trình duyệt sẽ nhìn bạn bằng ánh mắt vô cảm.

## 2. Luồng Chạy Chính

| Thứ tự | File | Nó làm gì |
|---:|---|---|
| 1 | `index.html` | Tạo `<div id="root"></div>` và gọi entry frontend. |
| 2 | `Src/main.jsx` | Gắn React vào `#root`, import `App.jsx` và `style.css`. |
| 3 | `Src/App.jsx` | Bộ não hiện tại của app: state, page, nghiệp vụ, layout, POS, RBAC, dashboard. |
| 4 | `Src/style.css` | Toàn bộ áo quần giao diện: sidebar, topbar, POS, dark mode, responsive. |
| 5 | `Src/lib/*` | Cấu hình DB, phân quyền, đọc dữ liệu, gọi procedure/RPC. |

Nếu mới vào dự án, nên đọc theo thứ tự:

1. `index.html`
2. `Src/main.jsx`
3. `Src/App.jsx`
4. `Src/lib/featureConfig.js`
5. `Src/lib/dbService.js`
6. `Src/style.css`

Đừng đọc `App.jsx` từ trên xuống như đọc tiểu thuyết. Nó không phải tiểu thuyết, nó là bản đồ mê cung. Hãy tìm theo tên function.

## 3. Các File Ở Thư Mục Gốc

| File/thư mục | Trạng thái | Giải thích kiểu người thật |
|---|---|---|
| `index.html` | Đang dùng thật | Cổng vào của Vite. Không có nó thì React không có chỗ để bám. |
| `package.json` | Đang dùng thật | Khai báo script `dev`, `build`, `preview` và dependency. |
| `package-lock.json` | Đang dùng thật | Khóa phiên bản package. Không sửa tay nếu chưa thật sự cần. |
| `vite.config.js` | Đang dùng thật | Cấu hình build Vite, chunk React/Supabase. |
| `README.md` | Đang dùng thật | Hướng dẫn chạy local và biến môi trường Supabase. |
| `docs/` | Đang dùng thật | Nơi ghi tài liệu, log, roadmap, hướng dẫn bảo trì. |
| `node_modules/` | Sinh từ npm | Thư viện đã cài. Không sửa tay, npm sẽ cười nhẹ rồi ghi đè. |
| `dist/` | Sinh khi build | Output production sau `npm run build`. Không sửa tay. |

## 4. Thư Mục `Src/`

### `Src/main.jsx`

Đây là entry frontend thật.

Nó làm mấy việc rất ít nhưng rất quan trọng:

- Import React.
- Import `App`.
- Import `style.css`.
- Render `<App />` vào `#root`.

Nếu app không lên từ đầu, file này là một trong những nơi cần nhìn. Nhưng bình thường nó không phải nơi để thêm tính năng.

### `Src/App.jsx`

Đây là nơi app đang sống, thở, bán hàng, phân quyền, báo cáo, và đôi lúc tự vấp dây giày layout.

Nó hiện chứa:

- Cấu hình menu và nhóm menu.
- Login/logout.
- Supabase session.
- Profile user và role.
- Phân quyền hiển thị trang.
- Global search.
- Notification.
- Sidebar/topbar/avatar menu/dark mode.
- Dashboard và trung tâm điều hành.
- Hàng hóa, sản phẩm gốc, biến thể, hình ảnh.
- Nhập hàng.
- Kho, chuyển kho, kiểm kho.
- Bán hàng POS.
- Khách hàng.
- Đổi trả.
- Kênh bán.
- RBAC/nhân viên/quyền/log.
- Báo cáo.
- Tra bảng database.
- Trang hệ thống.
- Trang trợ giúp.
- Widget dấu hỏi `?` frontend-only.

Vì sao nó to:

- Ban đầu có ý định tách `pages/`.
- Sau đó cần phát triển nhanh để app chạy được.
- Logic mới cứ được nhét trực tiếp vào `App.jsx`.
- Kết quả: app mạnh hơn, file cũng thành một con quái vật hiền lành nhưng khó bảo trì.

Khi đọc `App.jsx`, tìm các function này:

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

Khi sửa tính năng thật đang chạy, phần lớn bạn sẽ sửa trong file này.

### `Src/style.css`

Đây là tủ quần áo khổng lồ của app. Nó chứa gần như toàn bộ CSS:

- Base UI.
- Login.
- Sidebar.
- Topbar.
- Card/form/table/modal.
- Dashboard.
- POS.
- Product picker.
- Stock/RBAC/system/help.
- Dark mode.
- Responsive.
- Widget chat `?`.
- Các block `FINAL OVERRIDE`.

Vì sao có nhiều `FINAL OVERRIDE`?

- CSS cũ có nhiều rule cùng đụng `.topbar`, `.sidebar`, `.main`, `.product-grid`.
- Rule viết sau thắng rule viết trước.
- Khi cần sửa lỗi layout nhanh, thêm block cuối giúp rule mới thắng rule cũ.

Đây là cách chữa cháy có tổ chức. Nó không đẹp như kiến trúc CSS module, nhưng trong tình huống file đã lớn thì nó giúp sửa đúng lỗi mà không lật tung cả app.

Điểm cần nhớ:

- Muốn sửa layout hiện tại: ưu tiên nhìn cuối `Src/style.css`.
- Muốn sửa triệt để lâu dài: tách CSS thành nhiều file nhỏ.
- Đừng thêm rule rải rác lung tung nếu có thể gom vào block cuối có ghi chú rõ.

### `Src/main.js`

Không phải luồng chạy chính.

File này là bản cũ/prototype. `index.html` hiện không import nó. Sửa file này thường không ảnh hưởng app đang chạy.

Hướng xử lý sau này:

- Xóa nếu chắc chắn không cần.
- Hoặc chuyển vào thư mục archive nếu muốn giữ làm kỷ niệm khảo cổ.

### `Src/index.css`

Hiện không phải CSS chính của app.

CSS thật đang dùng là `Src/style.css`. `Src/index.css` là dấu vết cũ, không nên sửa để fix UI hiện tại.

## 5. Thư Mục `Src/lib/`

Đây là khu tương đối sạch. Nếu `App.jsx` là khu chợ, `Src/lib/` là mấy quầy có bảng tên đàng hoàng.

### `Src/lib/supabase.js`

Tạo Supabase client.

Dùng các biến:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Lưu ý quan trọng:

- `VITE_*` sẽ được bundle vào frontend.
- Chỉ dùng Supabase anon key ở đây.
- Không bỏ service role key, secret key, Gemini API key vào frontend.

### `Src/lib/featureConfig.js`

Đây là sổ hộ khẩu quyền hạn và tra cứu.

Nó quản lý:

- Role nào được vào trang nào.
- Bảng/view nào được tra trong trang Tra bảng.
- Label tiếng Việt cho table database.
- Alias cho global search.
- Mô tả trang cho search suggestion.

Các export quan trọng:

```js
ROLE_FEATURES
QUERY_TABLES
TABLE_LABELS
PAGE_ALIASES
PAGE_DESCRIPTIONS
```

Khi cần thêm trang, đổi quyền, thêm bảng tra cứu, hoặc thêm từ khóa search, nhìn file này.

### `Src/lib/dbService.js`

Đây là lớp đọc DB và gọi procedure/RPC.

Nó làm:

- Đọc row từ Supabase.
- Thử nhiều table/view nếu schema chưa đồng nhất.
- Gọi procedure/RPC.
- Nhận diện lỗi schema cache hoặc procedure chưa expose.
- Giúp app fallback thay vì crash ngay.

Các helper đáng nhớ:

```js
readRows()
readFirstAvailableTable()
callProcedureCandidates()
isProcedureUnavailable()
```

Vì database có nhiều table/view/procedure, file này giúp app sống sót khi backend chưa thật sự “ngăn nắp như sách giáo khoa”.

## 6. Thư Mục `Src/assets/`

Đây là kho ảnh app đang dùng thật.

| File | Vai trò |
|---|---|
| `silkroad-logo.png` | Logo trong sidebar/login/topbar. |
| `silkroad-bg.png` | Nền minh họa sidebar. |
| `login-bg.png` | Nền trang đăng nhập. |
| `login-frame.png` | Khung trang đăng nhập. |
| `login-benefits.png` | Ảnh phụ trang đăng nhập. |
| `banner.png` | Asset phụ, có thể là dư âm thiết kế cũ. |

Ngoài ra còn có:

- `Src/banner.png`
- `Src/login-bg.png`

Hai file này nằm ngoài `assets/`, có vẻ là bản cũ/duplicate. App hiện ưu tiên import từ `Src/assets/`.

## 7. Thư Mục `Src/pages/`

Nghe tên thì tưởng đây là nơi chứa page chính. Nhưng hiện tại: không.

Các file trong `Src/pages/` đa số là prototype/cũ:

| File | Ý định ban đầu | Trạng thái hiện tại |
|---|---|---|
| `Dashboard.jsx` | Tổng quan | Prototype/cũ. |
| `Products.jsx` | Hàng hóa | Prototype/cũ. |
| `Purchase.jsx` | Nhập hàng | Prototype/cũ. |
| `Stock.jsx` | Kho | Prototype/cũ. |
| `Orders.jsx` | POS/đơn hàng | Prototype/cũ. |
| `Reports.jsx` | Báo cáo | Prototype/cũ. |
| `Users.jsx` | RBAC/người dùng | Prototype/cũ. |
| `Help.jsx` | Trợ giúp | Prototype/cũ. |
| `Login.jsx` | Đăng nhập | Prototype/cũ. |

Vì sao có mà không chạy:

- Dự án từng định tách page.
- Sau đó `App.jsx` được mở rộng nhanh hơn tốc độ refactor.
- Các file page chưa được nối lại vào luồng thật.

Quan trọng:

- Sửa `Src/pages/Orders.jsx` không sửa POS hiện tại.
- POS hiện tại nằm trong `function Orders(p)` bên trong `Src/App.jsx`.

## 8. Thư Mục `Src/components/`

### `Src/components/Layout.jsx`

Đây là layout cũ.

Nó từng có:

- Sidebar đơn giản.
- Topbar đơn giản.
- Logout.

Layout thật hiện tại nằm trong `Src/App.jsx`, gồm:

- Sidebar nhóm cha/con.
- Collapse/hover.
- Topbar sticky.
- Global search.
- Notification.
- Avatar menu.
- Dark mode.
- Widget `?`.

Nên xem `Layout.jsx` như bản phác thảo cũ, không phải nơi sửa giao diện hiện tại.

## 9. Thư Mục `Src/data/`

### `Src/data/nav.js`

Đây là menu cũ dùng cho `components/Layout.jsx`.

Menu thật hiện nằm trong `Src/App.jsx`:

```js
MENU
MENU_GROUPS
MENU_BY_KEY
```

Quyền truy cập thật nằm trong:

```txt
Src/lib/featureConfig.js
```

Nếu sửa `nav.js` rồi không thấy gì thay đổi, không phải bạn hoa mắt. Nó đang không điều khiển menu chính.

## 10. Thư Mục `docs/`

Đây là nơi hệ thống tự giải thích chính nó. Cực kỳ nên giữ.

| File | Vai trò |
|---|---|
| `docs/project-structure-guide.md` | Chính là tài liệu này: giải thích cấu trúc file. |
| `docs/latest-run-log.md` | Nhật ký lượt sửa/chạy mới nhất, viết bằng tiếng Việt. |
| `docs/maintenance-roadmap.md` | Ghi chú bảo trì, hướng refactor, nguyên tắc Gemini/frontend. |
| `docs/max-potential-roadmap.md` | Lộ trình phát triển app thành hệ thống chuyên nghiệp hơn. |

Quy ước hiện tại:

- Mỗi lần sửa/chạy kiểm tra quan trọng xong, cập nhật `docs/latest-run-log.md`.
- Nếu thêm hướng phát triển lớn, ghi vào roadmap thay vì để trong chat rồi trôi mất.

## 11. Chức Năng Đang Có Trong App Thật

### Đăng nhập và phân quyền

- Dùng Supabase Auth.
- Sau login, app lấy profile từ bảng `users`.
- Role quyết định trang nào được mở.
- Quyền nằm trong `ROLE_FEATURES`.

### Dashboard

- KPI tổng quan.
- Trung tâm điều hành.
- Sức khỏe vận hành.
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
- Chọn sản phẩm gốc rồi chọn biến thể.
- Chọn biến thể bằng tên/thuộc tính, không bắt chọn SKU.
- Xem ảnh sản phẩm.
- Thêm giỏ.
- Đổi số lượng.
- Lưu/khôi phục giỏ tạm.
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
- Hoàn kho/hoàn tiền.
- Tạo chi nhánh.
- Tạo kênh bán.
- Giá theo kênh.
- Phân bổ tồn theo kênh.

### RBAC/nhân viên

- Tạo/sửa user.
- Quản lý role.
- Gán quyền.
- Thu hồi/khôi phục/xóa quyền truy cập.
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

## 12. Vì Sao Không Nối Gemini Trực Tiếp Vào Frontend

Vì frontend là nơi ai cũng có thể soi code bundle.

Không nên đưa Gemini API key vào:

- React state.
- `.env` dạng `VITE_*`.
- LocalStorage.
- Request gọi trực tiếp từ browser.

Luồng đúng khi nối thật:

```txt
React frontend
  -> Backend endpoint hoặc Supabase Edge Function
    -> Gemini API
```

Frontend chỉ gửi câu hỏi. Backend giữ API key, kiểm quyền, rate limit và log lỗi. Đây là phần nên làm sau khi backend đã sẵn.

## 13. Muốn Sửa Gì Thì Sửa Ở Đâu

| Việc muốn sửa | Nơi nên sửa |
|---|---|
| UI đang chạy | `Src/App.jsx`, `Src/style.css` |
| Dashboard | `function Dashboard()` trong `Src/App.jsx`, CSS `.dashboard-*` |
| POS | `function Orders()`, `ProductPickerGrid`, `VariantChoicePanel`, `ProductPreview` trong `Src/App.jsx` |
| Kho | `function Stock()` và các helper stock trong `Src/App.jsx` |
| RBAC/nhân viên | `function UsersPage()` và role helpers trong `Src/App.jsx` |
| Trang hệ thống | `function SystemPage()` trong `Src/App.jsx` |
| Trợ giúp/chat `?` | `function HelpPage()`, `function FloatingGeminiHelp()` |
| Menu sidebar | `MENU`, `MENU_GROUPS` trong `Src/App.jsx` |
| Quyền truy cập | `Src/lib/featureConfig.js` |
| Tra bảng DB | `QUERY_TABLES`, `TABLE_LABELS`, `selectTable()` |
| Đọc DB/RPC | `Src/lib/dbService.js` và function nghiệp vụ trong `Src/App.jsx` |
| Supabase URL/key | `.env`, `Src/lib/supabase.js` |
| Topbar/sidebar layout | Cuối `Src/style.css`, nhất là các block `FINAL OVERRIDE` |
| Tài liệu/log | `docs/latest-run-log.md`, `docs/*roadmap.md` |

## 14. Những File Không Nên Sửa Nếu Muốn Thấy App Đổi Ngay

Các file này hiện không phải luồng chính:

- `Src/main.js`
- `Src/index.css`
- `Src/components/Layout.jsx`
- `Src/data/nav.js`
- `Src/pages/*.jsx`
- `Src/banner.png`
- `Src/login-bg.png`

Sửa chúng có thể hữu ích nếu đang refactor, nhưng nếu mục tiêu là “sửa lỗi đang thấy trên màn hình” thì nên quay lại `App.jsx` và `style.css`.

## 15. Vì Sao Cấu Trúc Hiện Tại Bị Lệch

Nói công bằng: nó không lệch vì ai đó cố tình phá. Nó lệch vì app phát triển nhanh hơn kiến trúc.

Chuỗi sự kiện thường gặp:

1. Ban đầu tách `pages/`, `components/`, `data/`.
2. Cần demo nhanh, logic được viết thẳng vào `App.jsx`.
3. CSS gặp lỗi layout, thêm override cuối file.
4. App có thêm POS, RBAC, search, avatar, dark mode, chat.
5. File chính phình ra.
6. Người sau mở repo và bắt đầu hỏi những câu rất hợp lý về nhân sinh.

Đây là trạng thái có thể cứu được. Không cần xóa trắng làm lại. Chỉ cần refactor theo lát mỏng.

## 16. Hướng Dọn Lại Cấu Trúc

Mục tiêu lâu dài nên là:

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

Thứ tự refactor nên làm:

1. Tách component dùng chung: `Card`, `Field`, `DataTable`, `Modal`.
2. Tách layout: `Sidebar`, `Topbar`, `AccountMenu`, `NotificationMenu`.
3. Tách POS: product picker, variant panel, cart table, helpers.
4. Tách Dashboard và System page.
5. Tách CSS theo module.
6. Khi mọi thứ chạy ổn, mới xóa file cũ/prototype.

Không nên xóa hàng loạt ngay. Dọn nhà cũng vậy, đang cầm chổi thì đừng tiện tay tháo mái.

## 17. Kết Luận Ngắn Gọn

Nếu bạn chỉ nhớ một đoạn, nhớ đoạn này:

- App thật chạy qua `Src/App.jsx`.
- CSS thật nằm ở `Src/style.css`.
- `Src/lib/` là phần sạch, nên giữ và phát triển tiếp.
- `Src/pages/`, `Src/components/Layout.jsx`, `Src/data/nav.js` là dấu vết cấu trúc cũ.
- Muốn sửa lỗi đang thấy trên màn hình, ưu tiên `App.jsx` và cuối `style.css`.
- Muốn app dễ bảo trì, refactor từng phần nhỏ, không đập đi xây lại trong một lượt.

Repo này không vô phương cứu chữa. Nó chỉ đang kể lại lịch sử phát triển hơi ồn ào của mình bằng cách nhét lịch sử đó vào file code. Việc của mình là tách câu chuyện đó ra thành module rõ ràng hơn, từng chút một.
