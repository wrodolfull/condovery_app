import type { Quote } from "../types";
export function quoteChanged(
  previous: Pick<
    Quote,
    "subtotal_cents" | "delivery_fee_cents" | "total_cents" | "lines"
  >,
  next: Quote,
) {
  return (
    previous.subtotal_cents !== next.subtotal_cents ||
    previous.delivery_fee_cents !== next.delivery_fee_cents ||
    previous.total_cents !== next.total_cents ||
    previous.lines.length !== next.lines.length ||
    previous.lines.some(
      (line, i) =>
        line.unit_price_cents !== next.lines[i]?.unit_price_cents ||
        line.quantity !== next.lines[i]?.quantity,
    )
  );
}
