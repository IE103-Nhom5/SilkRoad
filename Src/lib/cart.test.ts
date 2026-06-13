import { describe, expect, it } from "vitest";
import { canIncreaseQuantity, cartTotal } from "./cart";

describe("cart helpers", () => {
  it("calculates the total from variant prices", () => {
    expect(cartTotal([{ sellingprice: 579000, quantity: 2 }, { sellingprice: 799000, quantity: 1 }])).toBe(1957000);
  });

  it("does not allow quantity above available stock", () => {
    expect(canIncreaseQuantity({ quantity: 3, availablequantity: 3 })).toBe(false);
    expect(canIncreaseQuantity({ quantity: 2, availablequantity: 3 })).toBe(true);
  });
});
