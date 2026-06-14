export function createIdempotencyKey(scope: string) {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${scope}-${id}`;
}
