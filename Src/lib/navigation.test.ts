import { describe, expect, it } from "vitest";
import { routes } from "./navigation";

describe("route registry", () => {
  it("keeps paths unique and absolute", () => {
    expect(new Set(routes.map((route) => route.path)).size).toBe(routes.length);
    expect(routes.every((route) => route.path.startsWith("/"))).toBe(true);
  });

  it("contains every production group", () => {
    expect(new Set(routes.map((route) => route.group))).toEqual(new Set(["Tổng quan", "Hàng hóa", "Vận hành", "Kinh doanh", "Quản trị", "Công cụ"]));
  });
});
