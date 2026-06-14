import { LayoutDashboard, Package, Warehouse, ShoppingCart, Truck, BarChart3, Shield, HelpCircle } from 'lucide-react';

export const navItems = [
  { key: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'products', label: 'Hàng hóa', icon: Package },
  { key: 'stock', label: 'Tồn kho', icon: Warehouse },
  { key: 'purchase', label: 'Nhập hàng', icon: Truck },
  { key: 'orders', label: 'Đơn hàng', icon: ShoppingCart },
  { key: 'reports', label: 'Báo cáo', icon: BarChart3 },
  { key: 'users', label: 'Tài khoản', icon: Shield },
  { key: 'help', label: 'Trợ giúp', icon: HelpCircle },
];
