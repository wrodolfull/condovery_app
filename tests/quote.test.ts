import assert from "node:assert/strict";
import test from "node:test";
import { quoteChanged } from "../src/domain/quote";
import type { Quote } from "../src/types";
test("checkout detects changed line prices even when the total remains identical", () => {
  const quote: Quote = {
    subtotal_cents: 2000,
    delivery_fee_cents: 0,
    total_cents: 2000,
    lines: [1000, 1000].map((p, i) => ({
      name: String(i),
      quantity: 1,
      unit_price_cents: p,
      total_cents: p,
      note: "",
      options: [],
    })),
  };
  assert.equal(
    quoteChanged(quote, {
      ...quote,
      lines: quote.lines.map((l, i) => ({
        ...l,
        unit_price_cents: i ? 1100 : 900,
        total_cents: i ? 1100 : 900,
      })),
    }),
    true,
  );
  assert.equal(quoteChanged(quote, structuredClone(quote)), false);
});
