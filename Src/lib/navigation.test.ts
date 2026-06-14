import { describe, expect, it } from "vitest";
import { routes } from "./navigation";

describe("route registry", () => {
  it("keeps paths unique and absolute", () => {
    expect(new Set(routes.map((route) => route.path)).size).toBe(routes.length);
    expect(routes.every((route) => route.path.startsWith("/"))).toBe(true);
  });

  it("keeps the main sidebar focused on retail operations", () => {
    const mainGroups = routes.filter((route) => route.showInNav !== false).map((route) => route.group);
    expect(new Set(mainGroups)).toEqual(new Set(["Tổng quan", "Hàng hóa", "Kho vận", "Bán hàng", "Kênh bán", "Báo cáo", "Quản trị người dùng", "Trợ giúp"]));
    expect(routes.find((route) => route.path === "/query")?.showInNav).toBe(false);
  });
});
