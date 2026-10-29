import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  View,
  useWindowDimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Search,
  ShoppingBag,
  LayoutGrid,
  CakeSlice,
  Sandwich,
  Utensils,
  Coffee,
  Sparkles,
  Shirt,
  Gift,
  Pizza,
  IceCreamCone,
  ShoppingBasket,
  Wrench,
  HeartPulse,
  House,
  Smartphone,
} from "lucide-react-native";
import { useAuth } from "../auth";
import { useMarket } from "../market";
import { useResource } from "../hooks";
import {
  Button,
  Card,
  Empty,
  ErrorBox,
  Field,
  Loading,
  Picture,
  ProductCard,
  Quantity,
  Screen,
  Section,
  ShopRow,
  T,
  alertError,
} from "../ui";
import { colors, money } from "../theme";
import {
  extrasTotal,
  selectedOptions,
  unitPrice,
  type Selection,
} from "../domain/orders";
import { PAYMENT_LABELS } from "../domain/payment-methods";
import type { Category, Product, Shop } from "../types";
import { openWeb } from "../external";
export function Home() {
  const { viewer } = useAuth();
  const { home } = useMarket();
  const ads = useResource<{
    campaigns: {
      id: string;
      merchant_name: string;
      headline: string;
      description: string;
      location: string;
      image_url: string | null;
      destination_url: string;
    }[];
  }>("ads");
  const fairs = useResource<{ fairs: { id: string; title: string }[] }>(
    "fairs",
  );
  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={home.loading}
          onRefresh={() => void home.reload().catch(() => {})}
          tintColor={colors.orange}
        />
      }
    >
      <View>
        <T style={{ color: colors.muted }}>
          Olá, {viewer?.name.split(" ")[0]} 👋
        </T>
        <T heading style={{ fontSize: 29, lineHeight: 35 }}>
          Seu condomínio mais perto de você!
        </T>
      </View>
      <Pressable
        onPress={() => router.push("/explorar")}
        style={{
          padding: 15,
          backgroundColor: "white",
          borderRadius: 28,
          flexDirection: "row",
          gap: 10,
        }}
      >
        <Search size={19} color={colors.muted} />
        <T style={{ color: colors.muted }}>Buscar por produto ou loja</T>
      </Pressable>
      <LinearGradient
        colors={["#F96036", "#FF8550"]}
        style={{ padding: 24, borderRadius: 29, gap: 14 }}
      >
        <T style={{ color: "white", fontSize: 12 }}>COMPRE DOS SEUS VIZINHOS</T>
        <T heading style={{ fontSize: 29, lineHeight: 35, color: "white" }}>
          Tudo de bom mora aqui.
        </T>
        <T style={{ color: "white" }}>
          Descubra o que seus vizinhos preparam para você.
        </T>
        <Button
          title="Começar a explorar"
          onPress={() => router.push("/explorar")}
        />
      </LinearGradient>
      <ErrorBox
        message={home.error}
        retry={() => void home.reload().catch(() => {})}
      />
      {home.loading && !home.data && <Loading />}
      <Section title="Descubra o que tem por aqui" />
      <Categories categories={home.data?.categories ?? []} />
      {ads.data?.campaigns.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {ads.data.campaigns.map((ad) => (
            <Ad key={ad.id} ad={ad} />
          ))}
        </ScrollView>
      ) : null}
      {fairs.data?.fairs.map((f) => (
        <Card key={f.id}>
          <T heading style={{ fontSize: 19 }}>
            {f.title}
          </T>
          <Button
            title="Visitar a feira"
            secondary
            onPress={() =>
              router.push({ pathname: "/feira/[id]", params: { id: f.id } })
            }
          />
        </Card>
      ))}
      <Pressable
        onPress={() =>
          router.push({ pathname: "/explorar", params: { ofertas: "1" } })
        }
        style={{
          backgroundColor: "#FFCF25",
          padding: 18,
          borderRadius: 24,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <T heading style={{ fontSize: 23 }}>
            Ofertas da semana
          </T>
          <T>Achadinhos da sua vizinhança</T>
        </View>
        <Image
          source={require("../../assets/images/ofertas-semana.png")}
          style={{ width: 110, height: 100 }}
          resizeMode="contain"
        />
      </Pressable>
      <Track
        title="Ofertas da semana"
        products={(home.data?.products ?? [])
          .filter((p) => p.promo_price_cents != null || p.is_featured)
          .slice(0, 8)}
      />
      <Track
        title="Feito pelos seus vizinhos"
        products={(home.data?.products ?? []).slice(0, 10)}
      />
      <Section title="Lojas em destaque" />
      {home.data?.shops.map((shop) => (
        <ShopRow shop={shop} key={shop.id} />
      ))}
      {home.data && !home.data.shops.length && (
        <Empty
          title="Sua vizinhança está chegando"
          body="As lojas do condomínio aparecerão aqui."
        />
      )}
    </Screen>
  );
}
function Ad({
  ad,
}: {
  ad: {
    id: string;
    merchant_name: string;
    headline: string;
    description: string;
    location: string;
    image_url: string | null;
    destination_url: string;
  };
}) {
  const { api } = useAuth();
  const target = useRef<View>(null);
  const dimensions = useWindowDimensions();
  useEffect(() => {
    let seen = false;
    const timer = setInterval(() => {
      if (seen || AppState.currentState !== "active") return;
      target.current?.measureInWindow((x, y, width, height) => {
        const visibleWidth = Math.max(
          0,
          Math.min(x + width, dimensions.width) - Math.max(0, x),
        );
        const visibleHeight = Math.max(
          0,
          Math.min(y + height, dimensions.height) - Math.max(0, y),
        );
        if (
          width > 0 &&
          height > 0 &&
          visibleWidth * visibleHeight >= width * height * 0.5
        ) {
          seen = true;
          void api
            .request("ads/" + ad.id + "/impression", "POST")
            .catch(() => {});
        }
      });
    }, 750);
    return () => clearInterval(timer);
  }, [ad.id, api, dimensions.width, dimensions.height]);
  return (
    <Pressable
      ref={target}
      style={{ width: 300, gap: 8 }}
      onPress={() => {
        void api.request("ads/" + ad.id + "/click", "POST").catch(() => {});
        void openWeb(ad.destination_url).catch(alertError);
      }}
    >
      <Picture path={ad.image_url} label={ad.headline} height={130} />
      <T bold>{ad.headline}</T>
      <T>{ad.merchant_name}</T>
      <T>{ad.description}</T>
      <T style={{ fontSize: 10, color: colors.muted }}>Patrocinado</T>
    </Pressable>
  );
}
function Track({ title, products }: { title: string; products: Product[] }) {
  if (!products.length) return null;
  return (
    <>
      <Section
        title={title}
        action="Ver tudo"
        onAction={() => router.push("/explorar")}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 14 }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} width={165} />
        ))}
      </ScrollView>
    </>
  );
}
function CategoryGlyph({ category }: { category: Category }) {
  const icons: Record<string, React.ElementType> = {
    "cake-slice": CakeSlice,
    sandwich: Sandwich,
    utensils: Utensils,
    coffee: Coffee,
    sparkles: Sparkles,
    shirt: Shirt,
    gift: Gift,
    "shopping-bag": ShoppingBag,
    pizza: Pizza,
    "ice-cream-cone": IceCreamCone,
    "shopping-basket": ShoppingBasket,
    wrench: Wrench,
    "heart-pulse": HeartPulse,
    house: House,
    smartphone: Smartphone,
  };
  const Icon = category.id ? (icons[category.icon] ?? ShoppingBag) : LayoutGrid;
  return <Icon size={25} strokeWidth={1.8} color={colors.orange} />;
}
function Categories({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[];
  selected?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12 }}
    >
      {[{ id: "", name: "Todos", icon: "" }, ...categories].map((c, i) => (
        <Pressable
          key={c.id}
          onPress={() =>
            c.name === "Desapego"
              ? router.push("/desapego")
              : onSelect
                ? onSelect(c.id)
                : router.push({
                    pathname: "/explorar",
                    params: { categoria: c.id },
                  })
          }
          style={{ width: 82, alignItems: "center", gap: 8 }}
        >
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                c.id === selected
                  ? colors.yellow
                  : ["#FFF0DD", "#E8F2E3", "#EAE6F5", "#FFE8D7"][i % 4],
            }}
          >
            <CategoryGlyph category={c} />
          </View>
          <T bold style={{ fontSize: 11, textAlign: "center" }}>
            {c.name}
          </T>
        </Pressable>
      ))}
    </ScrollView>
  );
}
export function Explore() {
  const params = useLocalSearchParams<{
    categoria?: string;
    ofertas?: string;
  }>();
  const { home } = useMarket();
  const { api } = useAuth();
  const [query, setQuery] = useState(""),
    [pagination, setPagination] = useState({ filter: "", page: 0 }),
    [result, setResult] = useState<{ filter: string; products: Product[] }>({
      filter: "",
      products: [],
    }),
    [hasMore, setMore] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const category = params.categoria ?? "",
    filter = query + "|" + category;
  const page = pagination.filter === filter ? pagination.page : 0;
  const products = result.filter === filter ? result.products : [];
  const setCategory = (id: string) =>
    router.setParams({ categoria: id, ofertas: "" });
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      const p = new URLSearchParams({
        page: String(page),
        limit: "24",
        search: query,
        ...(category ? { category } : {}),
      });
      api
        .request<{ products: Product[]; hasMore: boolean }>("catalog?" + p)
        .then((r) => {
          if (active) {
            setResult((old) => ({
              filter,
              products:
                page && old.filter === filter
                  ? [...old.products, ...r.products]
                  : r.products,
            }));
            setMore(r.hasMore);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, category, page, api, filter]);
  return (
    <Screen title="Explorar">
      <T heading style={{ fontSize: 28 }}>
        Explorar
      </T>
      <Field
        label="Buscar por produto ou loja"
        value={query}
        onChangeText={setQuery}
      />
      <Categories
        categories={home.data?.categories ?? []}
        selected={category}
        onSelect={setCategory}
      />
      <ErrorBox message={error} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {products
          .filter((p) => !params.ofertas || p.promo_price_cents != null)
          .map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
      </View>
      {loading ? (
        <Loading />
      ) : (
        !products.length && (
          <Empty
            title="Nenhum produto encontrado"
            body="Tente outra categoria ou volte mais tarde."
          />
        )
      )}
      {hasMore && (
        <Button
          title="Mostrar mais produtos"
          busy={loading}
          secondary
          onPress={() => setPagination({ filter, page: page + 1 })}
        />
      )}
      <Section title="Todas as lojas" />
      {home.data?.shops.map((shop) => (
        <ShopRow shop={shop} key={shop.id} />
      ))}
    </Screen>
  );
}
export function Favorites() {
  const { favorites } = useMarket();
  return (
    <Screen title="Meus favoritos">
      <T heading style={{ fontSize: 28 }}>
        Meus favoritos
      </T>
      <ErrorBox
        message={favorites.error}
        retry={() => void favorites.reload().catch(() => {})}
      />
      {favorites.loading ? (
        <Loading />
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {favorites.data?.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </View>
      )}
      {favorites.data && !favorites.data.products.length && (
        <Empty
          title="Seu próximo favorito mora aqui"
          body="Toque no coração de um produto para salvá-lo."
        />
      )}
    </Screen>
  );
}
export function ShopDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useAuth();
  const resource = useResource<{ shop: Shop; products: Product[] }>(
    "shops/" + id,
  );
  const shop = resource.data?.shop;
  const reviews = useResource<{
    summary: { average: number | null; count: number };
    reviews: { id: string; rating: number; description: string }[];
  }>(shop ? "shops/" + shop.id + "/reviews" : null);
  const subscription = useResource<{ subscribed: boolean }>(
    shop ? "push/shops/" + shop.id : null,
  );
  return (
    <Screen title="Loja" back>
      <ErrorBox
        message={resource.error}
        retry={() => void resource.reload().catch(() => {})}
      />
      {resource.loading && <Loading />}
      {shop && (
        <>
          <Picture path={shop.cover_image} label={shop.name} height={180} />
          <T heading style={{ fontSize: 29, lineHeight: 35 }}>
            {shop.name}
          </T>
          <T>{shop.description}</T>
          <T bold style={{ color: shop.is_open ? colors.green : colors.muted }}>
            {shop.is_open ? "Aceitando pedidos" : "Fechada"}
          </T>
          <T>
            {shop.delivery_enabled
              ? "Entrega no condomínio · " + money(shop.delivery_fee_cents)
              : ""}
            {shop.pickup_enabled ? " · Retirada" : ""}
          </T>
          {shop.lead_time ? <T>{shop.lead_time}</T> : null}
          <T>
            {shop.payment_methods.map((m) => PAYMENT_LABELS[m]).join(" · ")}
          </T>
          <Button
            title="Compartilhar loja"
            secondary
            onPress={() =>
              void Share.share({
                message: shop.name + " — " + api.web("/loja/" + shop.slug),
              }).catch(alertError)
            }
          />
          <Button
            title={
              subscription.data?.subscribed
                ? "Desativar avisos desta loja"
                : "Receber avisos desta loja"
            }
            secondary
            onPress={() =>
              void api
                .request(
                  "push/shops/" + shop.id,
                  subscription.data?.subscribed ? "DELETE" : "PUT",
                )
                .then(() => subscription.reload())
                .catch(alertError)
            }
          />
          <Button
            title="Denunciar loja"
            secondary
            onPress={() =>
              router.push({
                pathname: "/denunciar",
                params: { tipo: "shop", id: shop.id },
              })
            }
          />
          <T bold>
            ★{" "}
            {reviews.data?.summary.count
              ? `${reviews.data.summary.average} · ${reviews.data.summary.count} avaliações`
              : "Ainda sem avaliações"}
          </T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {resource.data?.products.map((p) => (
              <ProductCard
                key={p.id}
                product={{ ...p, shop_name: shop.name }}
              />
            ))}
          </View>
          {reviews.data?.reviews.map((r) => (
            <Card key={r.id}>
              <T bold>{"★".repeat(r.rating)}</T>
              <T>{r.description}</T>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
export function ProductDetail() {
  const { shop: shopId, id } = useLocalSearchParams<{
    shop: string;
    id: string;
  }>();
  const r = useResource<{ shop: Shop; products: Product[] }>("shops/" + shopId);
  const p = r.data?.products.find((p) => p.id === id),
    shop = r.data?.shop;
  const market = useMarket();
  const [qty, setQty] = useState(1),
    [note, setNote] = useState(""),
    [choices, setChoices] = useState<Selection>({}),
    [error, setError] = useState("");
  let extra = 0;
  try {
    extra = extrasTotal(
      selectedOptions(
        (p?.option_groups ?? []).map((g) => ({ ...g, required: false })),
        choices,
      ),
    );
  } catch {}
  return (
    <Screen title="Produto" back>
      <ErrorBox message={r.error || error} />
      {r.loading && <Loading />}
      {p && shop ? (
        <>
          <Picture path={p.image_url} label={p.name} height={290} />
          <T heading style={{ fontSize: 30, lineHeight: 36 }}>
            {p.name}
          </T>
          <T style={{ color: colors.muted }}>{shop.name}</T>
          <T>{p.description}</T>
          <T heading style={{ fontSize: 24 }}>
            {money(unitPrice(p) + extra)}
          </T>
          {p.option_groups?.map((group) => (
            <Card key={group.id}>
              <T bold>
                {group.name} {group.required ? "· Obrigatório" : "· Opcional"}
              </T>
              <T style={{ fontSize: 12 }}>
                {group.multiple
                  ? "Escolha uma ou mais opções"
                  : "Escolha uma opção"}
              </T>
              {group.options.map((o) => {
                const checked = choices[group.id]?.includes(o.id);
                return (
                  <Pressable
                    key={o.id}
                    accessibilityRole={group.multiple ? "checkbox" : "radio"}
                    accessibilityState={{ checked: !!checked }}
                    onPress={() =>
                      setChoices((old) => ({
                        ...old,
                        [group.id]: checked
                          ? (old[group.id] ?? []).filter((id) => id !== o.id)
                          : group.multiple
                            ? [...(old[group.id] ?? []), o.id]
                            : [o.id],
                      }))
                    }
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      gap: 12,
                      paddingVertical: 9,
                    }}
                  >
                    <T style={{ flex: 1 }}>
                      {checked ? "●" : "○"} {o.name}
                    </T>
                    <T>{o.price_cents ? "+" + money(o.price_cents) : ""}</T>
                  </Pressable>
                );
              })}
            </Card>
          ))}
          <Field
            label="Observações do item"
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={200}
          />
          <Quantity
            value={qty}
            onChange={(n) => setQty(Math.max(1, Math.min(30, n)))}
          />
          <Button
            title={
              "Adicionar ao carrinho · " + money((unitPrice(p) + extra) * qty)
            }
            disabled={
              p.visibility !== "available" || p.stock === 0 || !shop.is_open
            }
            onPress={() => {
              void market
                .add(p, shop, qty, note, choices)
                .then((added) => {
                  if (added) router.push("/carrinho");
                })
                .catch((e) => setError(e.message));
            }}
          />
          <Button
            title="Denunciar produto"
            secondary
            onPress={() =>
              router.push({
                pathname: "/denunciar",
                params: { tipo: "product", id: p.id },
              })
            }
          />
        </>
      ) : (
        !r.loading &&
        !r.error && (
          <Empty
            title="Produto indisponível"
            body="Este produto não está mais no catálogo."
          />
        )
      )}
    </Screen>
  );
}
