import test from "node:test";
import assert from "node:assert/strict";
import { recommendStoreProducts } from "../src/domain/cart-recommendations";
import type { Product } from "../src/types";

const product = (id: string, changes: Partial<Product> = {}): Product => ({
  id,
  shop_id: "loja-1",
  category_id: "categoria-1",
  name: "Produto " + id,
  description: "",
  image_url: null,
  price_cents: 1800,
  promo_price_cents: null,
  stock: 10,
  visibility: "available",
  ...changes,
});

test("cart suggestions include only available products from the same store", () => {
  const available = product("granola");
  const products = [
    product("in-cart"),
    available,
    product("outside", { shop_id: "loja-2" }),
    product("hidden", { visibility: "hidden" }),
    product("unavailable", { visibility: "unavailable" }),
    product("sold-out", { stock: 0 }),
    product("closed", { is_open: false }),
    product("granola"), // duplicate catalog rows should not duplicate cards
    product("no-limit", { stock: null }),
  ];
  const found = recommendStoreProducts(products, "loja-1", [{ product: product("in-cart") }]);
  assert.deepEqual(found.map(p => p.id), ["granola", "no-limit"]);
  assert.equal(found[0], available);
});

test("cart suggestions respect a small list limit and empty store", () => {
  const products = [product("one"), product("two"), product("three")];
  assert.deepEqual(recommendStoreProducts(products, "loja-1", [], 2).map(p => p.id), ["one", "two"]);
  assert.deepEqual(recommendStoreProducts(products, "loja-1", [], 0), []);
  assert.deepEqual(recommendStoreProducts(products, "loja-2", []), []);
});
