import { describe, expect, it } from "vitest";
import { databaseContract, requiredDatabaseRpc, requiredDatabaseViews } from "./databaseContract";

describe("database contract", () => {
  it("contains every production view required by the frontend", () => {
    expect(requiredDatabaseViews).toEqual([
      "vw_product_search_catalog",
      "vw_pos_variant_stock_catalog",
      "vw_product_variant_catalog",
      "vw_stock_by_branch",
      "vw_order_summary",
      "vw_revenue_by_channel",
    ]);
  });

  it("contains every transactional RPC required by the frontend", () => {
    expect(requiredDatabaseRpc).toEqual([
      "fn_create_order_app",
      "fn_create_purchase_order_app",
      "fn_create_transfer_app",
      "fn_create_adjustment_app",
      "fn_create_return_app",
      "fn_set_inventory_allocation_app",
      "fn_cursor_low_stock_report_app",
    ]);
    expect(databaseContract.rpc.createOrder).toBe("fn_create_order_app");
  });
});
