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

  if (["fn_create_order_app", "fn_create_purchase_order_app", "fn_create_transfer_app", "fn_create_adjustment_app", "fn_create_return_app"].includes(name) && !actionLines.length) {
    errors.push("Nghiệp vụ cần ít nhất một dòng sản phẩm.");
  }
  if (name === "fn_create_order_app") {
    if (!payload.branch_id) errors.push("Hãy chọn chi nhánh bán.");
    if (!payload.channel_id) errors.push("Hãy chọn kênh bán.");
    if (!payload.idempotency_key) errors.push("Phiên thanh toán chưa sẵn sàng. Hãy mở lại bước thanh toán.");
  }

  actionLines.forEach((line, index) => {
    const quantity = name === "fn_create_adjustment_app" ? number(line.actual_quantity) : number(line.quantity);
    if (name === "fn_create_adjustment_app" ? quantity < 0 : quantity <= 0) {
      errors.push(`Dòng ${index + 1}: số lượng ${name === "fn_create_adjustment_app" ? "thực tế không được âm" : "phải lớn hơn 0"}.`);
    }
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
  if (name === "fn_set_inventory_allocation_app" && number(payload.allocated_quantity) < 0) {
    errors.push("Số lượng phân bổ không được âm.");
  }

  return errors;
}
