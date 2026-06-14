import { describe, expect, it } from "vitest";
import { friendlyActionError } from "../core/dataService";
import { validateSecureAction } from "./businessRules";

describe("business validation", () => {
  it("rejects invalid order quantity, stock and price", () => {
    const errors = validateSecureAction("fn_create_order_app", {
      branch_id: "branch-1",
      channel_id: "channel-1",
      idempotency_key: "pos-request-1",
      lines: [{ quantity: 4, available_quantity: 3, unit_price: 90, cost_price: 100 }],
    });
    expect(errors).toHaveLength(2);
  });

  it("rejects a transfer to the same branch", () => {
    const errors = validateSecureAction("fn_create_transfer_app", {
      from_branch_id: "branch-1",
      to_branch_id: "branch-1",
      lines: [{ quantity: 1 }],
    });
    expect(errors).toContain("Chi nhánh gửi và chi nhánh nhận phải khác nhau.");
  });

  it("rejects returns above the sold quantity", () => {
    const errors = validateSecureAction("fn_create_return_app", {
      lines: [{ quantity: 3, sold_quantity: 2 }],
    });
    expect(errors.some((error) => error.includes("vượt số lượng đã bán"))).toBe(true);
  });

  it("requires an idempotency key before creating an order", () => {
    const errors = validateSecureAction("fn_create_order_app", {
      branch_id: "branch-1",
      channel_id: "channel-1",
      lines: [{ quantity: 1, available_quantity: 3, unit_price: 100, cost_price: 90 }],
    });
    expect(errors).toContain("Phiên thanh toán chưa sẵn sàng. Hãy mở lại bước thanh toán.");
  });

  it("converts missing allocation errors into a friendly message", () => {
    expect(friendlyActionError("Inventory allocation not found for branch 123 and variant 456"))
      .toBe("Sản phẩm chưa được phân bổ tồn kho cho kênh bán này.");
  });
});
