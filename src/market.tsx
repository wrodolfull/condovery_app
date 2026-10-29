import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import { randomUUID } from "expo-crypto";
import { useAuth } from "./auth";
import { useResource, type Resource } from "./hooks";
import { loadCart, saveCart } from "./storage";
import {
  extrasTotal,
  selectedOptions,
  unitPrice,
  type Selection,
} from "./domain/orders";
import type { CartItem, HomeData, Product, Shop } from "./types";
export type PendingOrder = { payload: Record<string, unknown> };
type Cart = {
  shop: Shop | null;
  items: CartItem[];
  pending: PendingOrder | null;
};
const empty: Cart = { shop: null, items: [], pending: null };
export const linePrice = (item: CartItem) =>
  unitPrice(item.product) +
  extrasTotal(
    selectedOptions(item.product.option_groups ?? [], item.selections),
  );
type Market = {
  home: Resource<HomeData>;
  favorites: Resource<{ ids: string[]; products: Product[] }>;
  cart: Cart;
  cartReady: boolean;
  toggleFavorite: (id: string) => Promise<void>;
  add: (
    product: Product,
    shop: Shop,
    qty: number,
    note: string,
    choices: Selection,
  ) => Promise<boolean>;
  quantity: (key: string, qty: number) => void;
  clear: () => void;
  pending: (value: PendingOrder | null) => Promise<void>;
  lockCheckout: (value: boolean) => void;
};
const Context = createContext<Market | null>(null);
export function MarketProvider({ children }: { children: React.ReactNode }) {
  const { viewer, api } = useAuth();
  const home = useResource<HomeData>(viewer ? "home" : null),
    favorites = useResource<{ ids: string[]; products: Product[] }>(
      viewer ? "favorites" : null,
    );
  const [cart, setCart] = useState<Cart>(empty),
    [cartReady, setReady] = useState(false);
  const checkoutLock = useRef(false);
  const scope = viewer
    ? "cart." + viewer.id + "." + viewer.condominium_id
    : null;
  useEffect(() => {
    let active = true;
    if (!scope) return;
    void loadCart(scope)
      .then((value) => {
        if (!active) return;
        const v = value as Cart | null;
        if (
          v &&
          Array.isArray(v.items) &&
          v.items.length <= 25 &&
          v.items.every(
            (i) =>
              i.product?.shop_id === v.shop?.id &&
              Number.isInteger(i.quantity) &&
              i.quantity >= 1 &&
              i.quantity <= 30,
          )
        )
          setCart({ ...v, pending: v.pending ?? null });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [scope]);
  useEffect(() => {
    if (scope && cartReady) void saveCart(scope, cart).catch(() => {});
  }, [cart, scope, cartReady]);
  const ensure = () => {
    if (cart.pending || checkoutLock.current)
      throw new Error(
        "Conclua a tentativa de pedido no carrinho antes de alterá-lo.",
      );
    if (!cartReady) throw new Error("Aguarde o carregamento do carrinho.");
  };
  return (
    <Context.Provider
      value={{
        home,
        favorites,
        cart,
        cartReady,
        toggleFavorite: async (id) => {
          const exists = favorites.data?.ids.includes(id);
          await api.request(
            exists ? "favorites/" + id : "favorites",
            exists ? "DELETE" : "POST",
            exists ? undefined : { product_id: id },
          );
          await favorites.reload();
        },
        add: async (product, shop, qty, note, choices) => {
          ensure();
          selectedOptions(product.option_groups ?? [], choices);
          if (
            product.stock === 0 ||
            product.visibility !== "available" ||
            !shop.is_open
          )
            throw new Error("Produto ou loja indisponível.");
          if (cart.shop && cart.shop.id !== shop.id) {
            const yes = await new Promise<boolean>((resolve) =>
              Alert.alert(
                "Comprar de outra loja?",
                "Seu carrinho atual será substituído.",
                [
                  {
                    text: "Manter carrinho",
                    style: "cancel",
                    onPress: () => resolve(false),
                  },
                  { text: "Substituir", onPress: () => resolve(true) },
                ],
                { cancelable: true, onDismiss: () => resolve(false) },
              ),
            );
            if (!yes) return false;
          }
          const items = cart.shop?.id === shop.id ? cart.items : [];
          const matching = items.find(
            (i) =>
              i.product.id === product.id &&
              i.note === note &&
              JSON.stringify(i.selections) === JSON.stringify(choices),
          );
          if (matching && matching.quantity + qty > 30)
            throw new Error("O limite é de 30 unidades por item.");
          if (!matching && items.length >= 25)
            throw new Error("O limite é de 25 itens por pedido.");
          const next = matching
            ? items.map((i) =>
                i.key === matching.key
                  ? { ...i, quantity: i.quantity + qty }
                  : i,
              )
            : [
                ...items,
                {
                  key: randomUUID(),
                  product,
                  quantity: qty,
                  note,
                  selections: choices,
                },
              ];
          setCart({ shop, items: next, pending: null });
          return true;
        },
        quantity: (key, qty) => {
          ensure();
          setCart((c) => ({
            ...c,
            items: c.items.flatMap((i) =>
              i.key === key
                ? qty > 0
                  ? [{ ...i, quantity: Math.min(30, qty) }]
                  : []
                : [i],
            ),
          }));
        },
        clear: () => setCart(empty),
        pending: async (value) => {
          const next = { ...cart, pending: value };
          if (scope) await saveCart(scope, next);
          setCart(next);
        },
        lockCheckout: (value) => {
          checkoutLock.current = value;
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useMarket() {
  const v = useContext(Context);
  if (!v) throw new Error("MarketProvider ausente");
  return v;
}
