import type { CartItem, Product } from "../types";

/** Recommendations must come from the same seller as the current cart. */
export function recommendStoreProducts(
  products: readonly Product[],
  shopId: string,
  items: readonly Pick<CartItem, "product">[],
  limit = 8,
): Product[] {
  const alreadyInCart = new Set(items.map(item => item.product.id));
  const seen = new Set<string>();
  return products.filter(product => {
    if (
      product.shop_id !== shopId ||
      product.visibility !== "available" ||
      product.stock === 0 ||
      product.is_open === false ||
      alreadyInCart.has(product.id) ||
      seen.has(product.id)
    ) return false;
    seen.add(product.id);
    return true;
  }).slice(0, Math.max(0, limit));
}
