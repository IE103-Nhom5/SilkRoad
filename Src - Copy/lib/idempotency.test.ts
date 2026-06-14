import { describe, expect, it } from "vitest";
import { createIdempotencyKey } from "./idempotency";

describe("idempotency key", () => {
  it("creates a unique key for every checkout attempt", () => {
    const first = createIdempotencyKey("pos");
    const second = createIdempotencyKey("pos");
    expect(first).toMatch(/^pos-/);
    expect(second).not.toBe(first);
  });
});
