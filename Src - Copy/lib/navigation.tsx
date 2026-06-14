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
  Siren,
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
  showInNav?: boolean;
};

export const routes: AppRoute[] = [
  { path: "/dashboard", label: "Tổng quan", description: "KPI, cảnh báo và hoạt động gần đây", group: "Tổng quan", icon: LayoutDashboard, resource: "dashboard" },
  { path: "/catalog/products", label: "Hàng hóa", description: "Sản phẩm gốc, biến thể, ảnh và danh mục", group: "Hàng hóa", icon: Package, resource: "products" },
  { path: "/operations/stock", label: "Tồn kho", description: "Tồn khả dụng và cảnh báo theo chi nhánh", group: "Kho vận", icon: Boxes, resource: "stock" },
  { path: "/operations/purchase", label: "Nhập hàng", description: "Phiếu nhập và nhà cung cấp", group: "Kho vận", icon: PackagePlus, resource: "purchase" },
  { path: "/operations/transfer", label: "Chuyển kho", description: "Điều chuyển giữa các chi nhánh", group: "Kho vận", icon: Truck, resource: "transfer" },
  { path: "/operations/adjustment", label: "Kiểm kho", description: "Kiểm kê và xử lý chênh lệch", group: "Kho vận", icon: ClipboardCheck, resource: "adjustment" },
  { path: "/admin/system", label: "Kiểm soát vận hành", description: "Cảnh báo tồn kho, đơn hàng và phiếu chờ duyệt", group: "Kho vận", icon: Siren, resource: "system" },
  { path: "/sales/pos", label: "Bán hàng", description: "POS, giỏ hàng và tạo hóa đơn", group: "Bán hàng", icon: ShoppingCart, resource: "pos" },
  { path: "/sales/orders", label: "Đơn hàng", description: "Theo dõi và xử lý đơn hàng", group: "Bán hàng", icon: Store, resource: "orders" },
  { path: "/sales/customers", label: "Khách hàng", description: "Hồ sơ và lịch sử mua hàng", group: "Bán hàng", icon: Users, resource: "customers" },
  { path: "/sales/returns", label: "Đổi trả", description: "Đổi trả và hoàn tiền", group: "Bán hàng", icon: RotateCcw, resource: "returns" },
  { path: "/sales/channels", label: "Kênh bán", description: "Giá kênh và phân bổ tồn", group: "Kênh bán", icon: Building2, resource: "channels" },
  { path: "/reports", label: "Báo cáo", description: "Doanh thu, kho và hiệu suất", group: "Báo cáo", icon: FileBarChart, resource: "reports" },
  { path: "/admin/users", label: "Nhân viên", description: "Hồ sơ nhân viên và quyền truy cập", group: "Quản trị người dùng", icon: ShieldCheck, resource: "users" },
  { path: "/admin/roles", label: "Vai trò", description: "Vai trò và ma trận quyền", group: "Quản trị người dùng", icon: ShieldCheck, resource: "roles" },
  { path: "/help", label: "Trợ giúp", description: "Quy trình và hướng dẫn nghiệp vụ", group: "Trợ giúp", icon: CircleHelp, resource: "help" },
  { path: "/query", label: "Tra cứu nội bộ", description: "Tra cứu dữ liệu được cấp quyền", group: "Nội bộ kỹ thuật", icon: Database, resource: "query", showInNav: false },
];

export const groupedRoutes = Object.entries(
  routes.filter((route) => route.showInNav !== false).reduce<Record<string, AppRoute[]>>((groups, route) => {
    (groups[route.group] ||= []).push(route);
    return groups;
  }, {}),
);

export const routeByPath = Object.fromEntries(routes.map((route) => [route.path, route]));

export const dashboardChartIcon = BarChart3;
export const syncIcon = RefreshCcw;
