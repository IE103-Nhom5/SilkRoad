import type { ComponentType } from "react";
import {
  BarChart3,
  Boxes,
  Building2,
  CircleHelp,
  ClipboardCheck,
  Database,
  FileBarChart,
  LayoutDashboard,
  Package,
  PackagePlus,
  RefreshCcw,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  Users,
} from "lucide-react";

export type AppRoute = {
  path: string;
  label: string;
  description: string;
  group: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  resource: string;
};

export const routes: AppRoute[] = [
  { path: "/dashboard", label: "Tổng quan", description: "KPI, cảnh báo và hoạt động gần đây", group: "Tổng quan", icon: LayoutDashboard, resource: "dashboard" },
  { path: "/catalog/products", label: "Hàng hóa", description: "Sản phẩm gốc, biến thể, ảnh và danh mục", group: "Hàng hóa", icon: Package, resource: "products" },
  { path: "/operations/stock", label: "Tồn kho", description: "Tồn khả dụng và cảnh báo theo chi nhánh", group: "Vận hành", icon: Boxes, resource: "stock" },
  { path: "/operations/purchase", label: "Nhập hàng", description: "Phiếu nhập và nhà cung cấp", group: "Vận hành", icon: PackagePlus, resource: "purchase" },
  { path: "/operations/transfer", label: "Chuyển kho", description: "Điều chuyển giữa các chi nhánh", group: "Vận hành", icon: Truck, resource: "transfer" },
  { path: "/operations/adjustment", label: "Kiểm kho", description: "Kiểm kê và xử lý chênh lệch", group: "Vận hành", icon: ClipboardCheck, resource: "adjustment" },
  { path: "/sales/pos", label: "Bán hàng", description: "POS, giỏ hàng và tạo hóa đơn", group: "Kinh doanh", icon: ShoppingCart, resource: "pos" },
  { path: "/sales/orders", label: "Đơn hàng", description: "Theo dõi và xử lý đơn hàng", group: "Kinh doanh", icon: Store, resource: "orders" },
  { path: "/sales/customers", label: "Khách hàng", description: "CRM, lịch sử mua và điểm thành viên", group: "Kinh doanh", icon: Users, resource: "customers" },
  { path: "/sales/returns", label: "Đổi trả", description: "Đổi trả và hoàn tiền", group: "Kinh doanh", icon: RotateCcw, resource: "returns" },
  { path: "/sales/channels", label: "Kênh bán", description: "Giá kênh và phân bổ tồn", group: "Kinh doanh", icon: Building2, resource: "channels" },
  { path: "/admin/users", label: "Nhân viên", description: "Hồ sơ nhân viên và quyền truy cập", group: "Quản trị", icon: ShieldCheck, resource: "users" },
  { path: "/admin/roles", label: "Vai trò", description: "Vai trò và ma trận quyền", group: "Quản trị", icon: ShieldCheck, resource: "roles" },
  { path: "/admin/system", label: "Hệ thống", description: "Trạng thái dịch vụ và cấu hình", group: "Quản trị", icon: Settings, resource: "system" },
  { path: "/reports", label: "Báo cáo", description: "Doanh thu, kho và hiệu suất", group: "Công cụ", icon: FileBarChart, resource: "reports" },
  { path: "/query", label: "Tra cứu", description: "Tra cứu dữ liệu được cấp quyền", group: "Công cụ", icon: Database, resource: "query" },
  { path: "/help", label: "Trợ giúp", description: "Quy trình, FAQ và trợ lý SilkRoad", group: "Công cụ", icon: CircleHelp, resource: "help" },
];

export const groupedRoutes = Object.entries(
  routes.reduce<Record<string, AppRoute[]>>((groups, route) => {
    (groups[route.group] ||= []).push(route);
    return groups;
  }, {}),
);

export const routeByPath = Object.fromEntries(routes.map((route) => [route.path, route]));

export const dashboardChartIcon = BarChart3;
export const syncIcon = RefreshCcw;
