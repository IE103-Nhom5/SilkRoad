import { describe, expect, it } from "vitest";
import { canAccess, hasPermission, normalizePermissions } from "./permissions";

describe("permission layer", () => {
  it("normalizes PostgreSQL arrays, JSON arrays and null", () => {
    expect(normalizePermissions("{stock.view,purchase_order.create}")).toEqual(["stock.view", "purchase_order.create"]);
    expect(normalizePermissions('["order.create","order.view"]')).toEqual(["order.create", "order.view"]);
    expect(normalizePermissions(null)).toEqual([]);
  });

  it("gives every permission to an active admin", () => {
    const admin = { role: "admin", status: "active", permissions: [] };
    const modules = ["dashboard", "products", "stock", "purchase", "transfer", "adjustment", "system", "pos", "orders", "customers", "returns", "channels", "reports", "users", "roles", "help"];
    expect(modules.every((module) => canAccess(admin, module))).toBe(true);
    expect(hasPermission(admin, "permission.that.does.not.exist")).toBe(true);
  });

  it("blocks inactive users and resolves feature keys from DB permissions", () => {
    expect(canAccess({ role: "admin", status: "inactive", permissions: [] }, "orders")).toBe(false);
    expect(canAccess({ role: "sales_staff", status: "active", permissions: ["order.create"] }, "orders")).toBe(true);
    expect(canAccess({ role: "sales_staff", status: "active", permissions: [] }, "orders")).toBe(false);
  });
});
