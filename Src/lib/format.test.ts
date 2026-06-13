import { describe, expect, it } from "vitest";
import { dateTime, money, normalize } from "./format";

describe("format helpers", () => {
  it("formats Vietnamese currency", () => {
    expect(money(20748000)).toContain("20.748.000");
    expect(money(20748000)).toContain("đ");
  });

  it("normalizes Vietnamese text for search", () => {
    expect(normalize("Áo Dệt Kim")).toBe("ao det kim");
  });

  it("handles missing date values", () => {
    expect(dateTime(null)).toBe("Chưa cập nhật");
  });
});
