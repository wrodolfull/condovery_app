import type { Order } from "../types";

export type OrdersPage = { orders: Order[]; nextCursor: string | null; hasMore: boolean };

/** A new order must not erase pages previously loaded by the seller.
 * The newest API snapshot wins for status updates; older rows stay in order.
 */
export function mergeLatestOrders(latest: Order[], previouslyLoaded: Order[]): Order[] {
  const ids = new Set(latest.map(order => order.id));
  return [...latest, ...previouslyLoaded.filter(order => !ids.has(order.id))];
}

/** API keeps this cursor opaque; clients must not derive it from timestamps. */
export function orderHistoryPath(scope: "buyer" | "seller", status: string, cursor?: string | null): string {
  const params = new URLSearchParams({limit:"20"});
  if(scope==="seller") params.set("scope","seller");
  if(scope==="buyer" && status) params.set("status",status);
  if(cursor) params.set("cursor",cursor);
  return "orders?"+params.toString();
}
