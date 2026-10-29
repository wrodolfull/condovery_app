import assert from "node:assert/strict";
import test from "node:test";
import { createChunkStore } from "../src/domain/chunk-store";
test("a failed write cannot replace the last durable checkout attempt", async () => {
  const values = new Map<string, string>();
  let fail = false;
  const store = createChunkStore({
    get: async (k) => values.get(k) ?? null,
    set: async (k, v) => {
      if (fail && k.endsWith(".1")) throw new Error("Storage unavailable");
      values.set(k, Buffer.from(v, "utf8").toString("utf8"));
    },
    remove: async (k) => {
      values.delete(k);
    },
  });
  const pending = {
    client_order_key: "original-attempt",
    note: "🍰".repeat(1500),
  };
  await store.save("cart.account.tenant", pending);
  for (const [k, value] of values)
    if (!k.endsWith(".manifest"))
      assert.ok(Buffer.byteLength(value, "utf8") <= 1600);
  fail = true;
  await assert.rejects(() =>
    store.save("cart.account.tenant", {
      client_order_key: "new",
      note: "b".repeat(2000),
    }),
  );
  assert.deepEqual(await store.load("cart.account.tenant"), pending);
  assert.equal(await store.load("cart.someone.else"), null);
});
