import type { Order } from "../types";
import { PAYMENT_LABELS } from "./payment-methods";
import { BRL } from "./orders";

type SellerItem = Order["items"][number];

// Keep order snapshots intact: product descriptions and option prices may have
// changed since the buyer placed the order.
export function sellerItemDetails(item: SellerItem): string[] {
  const result = (item.options ?? []).map(
    (option) =>
      option.group +
      ": " +
      option.name +
      (option.price_cents > 0 ? " (+" + BRL(option.price_cents) + ")" : ""),
  );
  if (item.note?.trim()) result.push("Observação do produto: " + item.note.trim());
  return result;
}

export function sellerOrderDetails(order: Order): string[] {
  const result = [
    "Morador: " + (order.buyer_name?.trim() || "Não informado"),
    order.fulfillment === "delivery"
      ? "Entrega: " + order.tower + " · Ap. " + order.apartment
      : "Retirada na loja",
  ];
  if (order.buyer_phone?.trim())
    result.push("Contato: " + order.buyer_phone.trim());
  if (order.delivery_day) {
    const date = String(order.delivery_day).slice(0, 10);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    result.push("Data preferida: " + (match ? match[3] + "/" + match[2] + "/" + match[1] : date));
  }
  if (order.delivery_window?.trim())
    result.push("Horário preferido: " + order.delivery_window.trim());
  if (order.fulfillment === "delivery" && order.delivery_instructions?.length)
    result.push("Instruções de entrega: " + order.delivery_instructions.join("; "));
  if (order.payment_method)
    result.push("Pagamento: " + PAYMENT_LABELS[order.payment_method]);
  if (order.note?.trim())
    result.push("Observações do pedido: " + order.note.trim());
  return result;
}
