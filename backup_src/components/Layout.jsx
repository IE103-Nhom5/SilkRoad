import { navItems } from '../data/nav';
import { supabase } from '../lib/supabase';

export function Layout({ user, page, setPage, children }) {
  return <div className="app">
    <aside className="sidebar">
      <div className="brand">SILKROAD</div>
      <div className="nav">
        {navItems.map(item => {
          const Icon = item.icon;
          return <button key={item.key} className={page === item.key ? 'active' : ''} onClick={() => setPage(item.key)}>
            <Icon size={19} /> {item.label}
          </button>;
        })}
      </div>
    </aside>
    <main className="main">
      <div className="topbar">
        <div>
          <div className="muted">Hệ thống quản lý hàng hóa đa kênh</div>
          <b>{user?.email}</b>
        </div>
        <button className="btn secondary" onClick={() => supabase.auth.signOut()}>Đăng xuất</button>
      </div>
      {children}
    </main>
  </div>;
}
