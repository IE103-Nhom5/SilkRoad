export type BusinessPayload = Record<string, unknown>;

type PayloadLine = Record<string, unknown>;

function lines(payload: BusinessPayload): PayloadLine[] {
  return Array.isArray(payload.lines) ? payload.lines.filter((line): line is PayloadLine => Boolean(line) && typeof line === "object") : [];
}

function number(value: unknown) {
  return Number(value ?? 0);
}

export function validateSecureAction(name: string, payload: BusinessPayload) {
  const errors: string[] = [];
  const actionLines = lines(payload);

  if (["fn_create_order_app", "fn_create_purchase_order_app", "fn_create_transfer_app", "fn_create_return_app"].includes(name) && !actionLines.length) {
    errors.push("Nghiệp vụ cần ít nhất một dòng sản phẩm.");
  }

  actionLines.forEach((line, index) => {
    const quantity = number(line.quantity);
    if (quantity <= 0) errors.push(`Dòng ${index + 1}: số lượng phải lớn hơn 0.`);
    if (name === "fn_create_order_app" && line.available_quantity !== undefined && quantity > number(line.available_quantity)) {
      errors.push(`Dòng ${index + 1}: số lượng bán vượt tồn khả dụng.`);
    }
    if (name === "fn_create_order_app" && line.cost_price !== undefined && number(line.unit_price) < number(line.cost_price)) {
      errors.push(`Dòng ${index + 1}: giá bán không được thấp hơn giá vốn.`);
    }
    if (name === "fn_create_return_app" && line.sold_quantity !== undefined && quantity > number(line.sold_quantity)) {
      errors.push(`Dòng ${index + 1}: số lượng đổi trả vượt số lượng đã bán.`);
    }
  });

  if (name === "fn_create_transfer_app" && payload.from_branch_id && payload.from_branch_id === payload.to_branch_id) {
    errors.push("Chi nhánh gửi và chi nhánh nhận phải khác nhau.");
  }

  return errors;
}
