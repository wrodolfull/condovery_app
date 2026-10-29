import type { OptionGroup, Selection } from "./domain/orders";
import type { PaymentMethod } from "./domain/payment-methods";
export type Viewer = {
  id: string;
  condominium_id: string;
  name: string;
  email: string;
  phone: string;
  tower: string;
  apartment: string;
  towers: string[];
  condominium_name: string;
  avatar_image: string | null;
  status: "approved" | "pending" | "suspended";
  role: "resident" | "admin";
};
export type Category = { id: string; name: string; icon: string };
export type Shop = {
  id: string;
  slug: string;
  name: string;
  description: string;
  cover_image: string | null;
  logo_image: string | null;
  is_open: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_fee_cents: number;
  lead_time: string;
  pickup_instructions?: string;
  payment_methods: PaymentMethod[];
};
export type Product = {
  id: string;
  shop_id: string;
  shop_name?: string;
  is_open?: boolean;
  category_id: string;
  name: string;
  description: string;
  image_url: string | null;
  price_cents: number;
  promo_price_cents: number | null;
  stock: number | null;
  visibility: "available" | "unavailable" | "hidden";
  is_featured?: boolean;
  lead_time?: string;
  option_groups?: OptionGroup[];
};
export type HomeData = {
  categories: Category[];
  shops: Shop[];
  products: Product[];
};
export type CommunityFair = {
  id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  starts_at: string;
  ends_at: string;
};
export type CartItem = {
  key: string;
  product: Product;
  quantity: number;
  note: string;
  selections: Selection;
};
export type Order = {
  id: string;
  code: number;
  status: string;
  total_cents: number;
  subtotal_cents: number;
  delivery_fee_cents: number;
  shop_name: string;
  tower: string;
  apartment: string;
  fulfillment: "delivery" | "pickup";
  delivery_day: string | null;
  delivery_window: string;
  delivery_instructions: string[];
  note: string;
  payment_method?: PaymentMethod;
  can_review: boolean;
  created_at: string;
  items: {
    name: string;
    quantity: number;
    unit_price_cents: number;
    note: string;
    options?: { group: string; name: string; price_cents: number }[];
  }[];
};
export type Notice = {
  id: string;
  kind: "order" | "seller_order" | "condominium" | "shop";
  title: string;
  body: string;
  target_id: string | null;
  read_at: string | null;
  created_at: string;
};
export type Quote = {
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  lines: {
    name: string;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
    note: string;
    options: { group: string; name: string; price_cents: number }[];
  }[];
};
export const statusLabels: Record<string, string> = {
  awaiting_confirmation: "Aguardando confirmação",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};
