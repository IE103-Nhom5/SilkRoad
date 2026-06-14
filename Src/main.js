// LEGACY ENTRY: production uses Src/main.tsx. Kept for historical reference.
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

<div className="app-shell">

  <aside className="sidebar">
    <div className="logo">SilkRoad</div>
    <div className="role">admin</div>

    {menu.map(([key,label,Icon])=>(
      <button
        key={key}
        className={page===key?'active':''}
        onClick={()=>setPage(key)}
      >
        <Icon size={22}/>
        {label}
      </button>
    ))}
  </aside>

  <main className="main">

    <header className="topbar">
      <input
        className="search"
        placeholder="Tìm kiếm..."
      />

      <div className="userbox">
        Admin
      </div>
    </header>

    <section className="hero">
      <img src="/banner.jpg"/>
      <div className="hero-content">
        <h1>TẠO SẢN PHẨM MỚI</h1>
      </div>
    </section>

    <div className="content-grid">

      <div className="card">

        <div className="section-title">
          Thông tin sản phẩm
        </div>

        <div className="form-grid">

          <div className="input-group">
            <label>Tên sản phẩm</label>
            <input placeholder="Áo Linen Nam"/>
          </div>

          <div className="input-group">
            <label>Tags</label>
            <input placeholder="linen, premium"/>
          </div>

          <div className="input-group">
            <label>Danh mục</label>
            <select>
              <option>Áo sơ mi</option>
            </select>
          </div>

          <div className="input-group">
            <label>Thương hiệu</label>
            <select>
              <option>SilkRoad</option>
            </select>
          </div>

          <div className="input-group">
            <label>Giá bán</label>
            <input type="number"/>
          </div>

          <div className="input-group">
            <label>Trạng thái</label>
            <select>
              <option>Đang bán</option>
            </select>
          </div>

        </div>

        <div className="input-group" style={{marginTop:20}}>
          <label>Mô tả</label>
          <textarea/>
        </div>

        <button className="save-btn">
          Lưu sản phẩm
        </button>

      </div>

      <div className="card">

        <img
          className="preview-image"
          src="/product.jpg"
        />

        <div className="preview-list">

          <div className="preview-item">
            <span>SKU</span>
            <b>ALN-2025</b>
          </div>

          <div className="preview-item">
            <span>Danh mục</span>
            <b>Áo sơ mi</b>
          </div>

          <div className="preview-item">
            <span>Thương hiệu</span>
            <b>SilkRoad</b>
          </div>

          <div className="preview-item">
            <span>Người tạo</span>
            <b>Admin</b>
          </div>

        </div>

      </div>

    </div>

  </main>

</div>
