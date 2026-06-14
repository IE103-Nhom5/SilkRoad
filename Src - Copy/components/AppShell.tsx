import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Activity, Bell, ChevronDown, CircleHelp, Command, LogOut, Menu, Moon, Search, Sun, UserCircle, X } from "lucide-react";
import logo from "../assets/silkroad-logo.png";
import bg from "../assets/silkroad-bg.png";
import { groupedRoutes, routeByPath } from "../lib/navigation";
import { CommandPalette } from "./CommandPalette";
import { AssistantChat } from "./AssistantChat";
import { Button, Modal } from "./ui";

export type AppProfile = { name: string; email: string; role: string };

export function AppShell({
  children,
  profile,
  demo,
  onSignOut,
}: {
  children: ReactNode;
  profile: AppProfile;
  demo: boolean;
  onSignOut: () => Promise<void>;
}) {
  const [collapsed, setCollapsed] = useState(localStorage.getItem("sr-sidebar") === "collapsed");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(localStorage.getItem("sr-theme") === "dark");
  const [commandOpen, setCommandOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const sidebarNavRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const current = routeByPath[location.pathname] || routeByPath["/dashboard"];

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("sr-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    localStorage.setItem("sr-sidebar", collapsed ? "collapsed" : "open");
    requestAnimationFrame(() => {
      if (sidebarNavRef.current) sidebarNavRef.current.scrollLeft = 0;
    });
  }, [collapsed]);
  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className={`app-shell ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "mobile-nav-open" : ""}`}>
      <aside className="sidebar" style={{ backgroundImage: `linear-gradient(rgba(0,34,24,.34),rgba(0,34,24,.66)),url(${bg})` }}>
        <header className="sidebar-brand">
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} aria-label="Thu gọn menu"><Menu /></button>
          <img src={logo} alt="SilkRoad" />
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Đóng menu"><X /></button>
        </header>
        <div className="sidebar-user">
          <b>{profile.name}</b>
          <span>{profile.role}</span>
        </div>
        <nav ref={sidebarNavRef}>
          {groupedRoutes.map(([group, items]) => (
            <section key={group}>
              <span className="nav-group-label">{group}</span>
              {items.map((item) => {
                const Icon = item.icon;
                return <NavLink key={item.path} to={item.path} title={item.label}><Icon size={19} /><span>{item.label}</span></NavLink>;
              })}
            </section>
          ))}
        </nav>
      </aside>
      <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Đóng menu" />
      <div className="app-main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Mở menu"><Menu /></button>
          <div className="topbar-title">
            <span>{current.group}</span>
            <b>{current.label}</b>
          </div>
          <button className="global-search" onClick={() => setCommandOpen(true)} aria-label="Mở tìm kiếm toàn hệ thống">
            <Search size={18} />
            <span>Tìm sản phẩm, đơn hàng, khách hàng...</span>
            <kbd><Command size={13} /> K</kbd>
          </button>
          <div className="topbar-actions">
            <div className="dropdown">
              <button className="icon-button top-action" onClick={() => { setNotificationOpen(!notificationOpen); setAccountOpen(false); }} aria-label="Thông báo">
                <Bell /><i>3</i>
              </button>
              {notificationOpen && <div className="dropdown-menu notification-menu"><b>Cần xử lý hôm nay</b><button onClick={() => navigate("/operations/stock")}>5 biến thể hết tồn</button><button onClick={() => navigate("/sales/returns")}>1 phiếu đổi trả chờ duyệt</button><button onClick={() => navigate("/operations/purchase")}>2 phiếu nhập chờ nhận</button></div>}
            </div>
            <button className="icon-button top-action" onClick={() => setDark(!dark)} aria-label="Đổi giao diện">{dark ? <Sun /> : <Moon />}</button>
            <div className="dropdown">
              <button className="account-button" onClick={() => { setAccountOpen(!accountOpen); setNotificationOpen(false); }} aria-label="Mở menu tài khoản">
                <UserCircle /><span>{profile.name}</span><ChevronDown size={16} />
              </button>
              {accountOpen && (
                <div className="dropdown-menu account-menu">
                  <header><b>{profile.name}</b><span>{profile.email}</span></header>
                  <button onClick={() => navigate("/admin/users")}><UserCircle /> Hồ sơ tài khoản</button>
                  <button onClick={() => navigate("/admin/system")}><Activity /> Kiểm soát vận hành</button>
                  <button className="danger-text" onClick={() => setLogoutOpen(true)}><LogOut /> Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </header>
        {demo && <div className="demo-banner">Chế độ dữ liệu minh họa · Các thao tác xác nhận không làm thay đổi tồn kho.</div>}
        <main className="content">{children}</main>
      </div>
      <button className="help-fab" onClick={() => setHelpOpen(!helpOpen)} aria-label="Mở trợ lý SilkRoad"><CircleHelp /></button>
      {helpOpen && (
        <section className="help-popup" aria-label="Trợ lý SilkRoad">
          <header><div><b>Trợ lý SilkRoad</b><span>Hướng dẫn nghiệp vụ theo trang đang mở</span></div><button className="icon-button" onClick={() => setHelpOpen(false)} aria-label="Đóng trợ lý"><X /></button></header>
          <AssistantChat compact />
          <button className="help-popup-link" onClick={() => { setHelpOpen(false); navigate("/help"); }}>Mở trung tâm trợ giúp</button>
        </section>
      )}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      {logoutOpen && <Modal title="Xác nhận đăng xuất" onClose={() => setLogoutOpen(false)}><div className="confirm-content"><p>Bạn có chắc muốn kết thúc phiên làm việc hiện tại?</p><div><Button onClick={() => setLogoutOpen(false)}>Hủy</Button><Button variant="danger" onClick={onSignOut}>Đăng xuất</Button></div></div></Modal>}
    </div>
  );
}
