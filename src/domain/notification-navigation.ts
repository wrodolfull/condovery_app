import type { Notice } from "../types";

type Destination =
  | { screen: "seller"; tab: "Pedidos" | "Avaliações"; orderId?: string; reviewId?: string }
  | { screen: "buyer-order"; orderId: string }
  | { screen: "shop"; shopId: string }
  | { screen: "notice" };

const uuid = (value: string | null) =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/** Same route for a tapped push, inbox item, and a previously saved notice.
 * The destination is based on a server-authorized notice, never raw push data.
 */
export function notificationDestination(
  notice: Pick<Notice, "kind" | "target_id">,
): Destination {
  const id = notice.target_id;
  if (notice.kind === "seller_order" || notice.kind === "seller_reminder")
    return { screen: "seller", tab: "Pedidos", ...(uuid(id) ? { orderId: id! } : {}) };
  if (notice.kind === "seller_review")
    return { screen: "seller", tab: "Avaliações", ...(uuid(id) ? { reviewId: id! } : {}) };
  if ((notice.kind === "order" || notice.kind === "review_update") && uuid(id))
    return { screen: "buyer-order", orderId: id! };
  if (notice.kind === "shop" && uuid(id))
    return { screen: "shop", shopId: id! };
  return { screen: "notice" };
}
