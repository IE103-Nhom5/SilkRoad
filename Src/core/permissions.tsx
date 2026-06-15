import { createContext, useContext, type ReactNode } from "react";

export type PermissionProfile = {
  role: string;
  status: string;
  permissions: string[];
};

export const ADMIN_PERMISSION = "*";

const featurePermissions: Record<string, string[]> = {
  dashboard: ["dashboard.view"],
  products: ["product.view", "product.create", "product.update", "product_variant.view"],
  stock: ["stock.view", "stock.update", "stock.adjust", "stock_history.view"],
  purchase: ["purchase_order.view", "purchase_order.create", "purchase_order.approve"],
  transfer: ["transfer_order.view", "transfer_order.create", "transfer_order.approve"],
  adjustment: ["stock_adjustment.view", "stock_adjustment.create", "stock_adjustment.approve", "stock.adjust"],
  system: ["dashboard.view", "stock.view", "order.view"],
  pos: ["order.create", "order.view"],
  orders: ["order.view", "order.create", "order.update"],
  customers: ["customer.view", "customer.create", "customer.update"],
  returns: ["return_order.view", "return_order.create", "return_order.approve"],
  channels: ["sales_channel.view", "inventory_allocation.view", "inventory_allocation.update"],
  reports: ["report.view", "report.export"],
  users: ["user.view", "user.create", "user.update", "user.manage"],
  roles: ["role.view", "role.create", "role.update", "permission.manage"],
  query: ["report.view", "product.view", "stock.view"],
  help: [],
};

export function normalizePermissions(value: unknown): string[] {
  if (Array.isArray(value)) return unique(value.map(String));
  if (value === null || value === undefined || value === "") return [];
  if (typeof value !== "string") return [];

  const input = value.trim();
  if (!input) return [];
  if (input.startsWith("[") && input.endsWith("]")) {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return unique(parsed.map(String));
    } catch {
      // Fall through to PostgreSQL/text parsing.
    }
  }
  const withoutBraces = input.startsWith("{") && input.endsWith("}") ? input.slice(1, -1) : input;
  return unique(withoutBraces.split(",").map((item) => item.trim().replace(/^"|"$/g, "")).filter(Boolean));
}

export function isActiveAdmin(profile: PermissionProfile) {
  return normalize(profile.status) === "active" && isAdminRole(profile.role);
}

export function hasPermission(profile: PermissionProfile, permission: string) {
  if (normalize(profile.status) !== "active") return false;
  if (isActiveAdmin(profile)) return true;
  const permissions = normalizePermissions(profile.permissions);
  return permissions.some((value) => value === ADMIN_PERMISSION || normalize(value) === normalize(permission));
}

export function canAccess(profile: PermissionProfile, feature: string) {
  if (normalize(profile.status) !== "active") return false;
  if (isActiveAdmin(profile)) return true;
  const permissions = normalizePermissions(profile.permissions);
  const normalizedFeature = normalize(feature);
  if (permissions.some((value) => value === ADMIN_PERMISSION || normalize(value) === normalizedFeature)) return true;
  const required = featurePermissions[normalizedFeature] || [normalizedFeature];
  return required.length === 0 || required.some((permission) => hasPermission(profile, permission));
}

export function canRunWarehouseAction(profile: PermissionProfile, kind: "purchase" | "transfer" | "adjustment") {
  if (isActiveAdmin(profile)) return true;
  const required = {
    purchase: ["purchase_order.create", "purchase_order.approve"],
    transfer: ["transfer_order.create", "transfer_order.approve"],
    adjustment: ["stock_adjustment.create", "stock_adjustment.approve"],
  }[kind];
  return required.every((permission) => hasPermission(profile, permission));
}

const demoPermissionProfile: PermissionProfile = { role: "admin", status: "active", permissions: [] };
const PermissionContext = createContext<PermissionProfile>(demoPermissionProfile);

export function PermissionProvider({ profile, children }: { profile: PermissionProfile; children: ReactNode }) {
  const effectiveProfile = isActiveAdmin(profile)
    ? { ...profile, role: "admin", permissions: [ADMIN_PERMISSION] }
    : { ...profile, permissions: normalizePermissions(profile.permissions) };
  return <PermissionContext.Provider value={effectiveProfile}>{children}</PermissionContext.Provider>;
}

export function usePermissions() {
  const profile = useContext(PermissionContext);
  return {
    profile,
    isAdmin: isActiveAdmin(profile),
    hasPermission: (permission: string) => hasPermission(profile, permission),
    canAccess: (feature: string) => canAccess(profile, feature),
    canRunWarehouseAction: (kind: "purchase" | "transfer" | "adjustment") => canRunWarehouseAction(profile, kind),
  };
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isAdminRole(value: string) {
  const role = normalize(value).replace(/[\s.-]+/g, "_");
  return role === "admin" || role === "administrator" || role === "system_admin" || role === "super_admin";
}
