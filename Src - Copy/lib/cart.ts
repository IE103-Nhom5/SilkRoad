export type PricedCartLine = { sellingprice?: unknown; quantity: number; availablequantity?: unknown };

export function cartTotal(lines: PricedCartLine[]) {
  return lines.reduce((sum, line) => sum + Number(line.sellingprice || 0) * line.quantity, 0);
}

export function canIncreaseQuantity(line: PricedCartLine) {
  return line.quantity < Number(line.availablequantity || 0);
}
