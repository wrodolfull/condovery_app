import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
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
  ArrowRight,
  Clock3,
  Share2,
  Heart,
  Store,
  Truck,
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
  ProductGrid,
  SearchBox,
  ShopLogo,
  Quantity,
  Screen,
  Section,
  ShopRow,
  T,
  alertError,
} from "../ui";
import { colors, fonts, money } from "../theme";
import {
  extrasTotal,
  selectedOptions,
  unitPrice,
  type Selection,
} from "../domain/orders";
import { RoundedStars } from "../components/RoundedStars";
import type { Category, Product, Shop } from "../types";
import { AdsCarousel, type AdCampaign } from "../components/AdsCarousel";
import { FairHomeTeaser } from "../components/FairCards";
import { ShopShareSheet } from "../components/ShopShareSheet";
import { appendUniqueShops } from "../domain/shop-directory";
import { remainingToAdd } from "../domain/cart-stock";
import { getCategoryImagePath } from "../domain/category-artwork";
export function Home() {
  const { viewer } = useAuth();
  const { home } = useMarket();
  const [query, setQuery] = useState("");
  const catalog = useCatalog(query, "", !!query);
  const ads = useResource<{ campaigns: AdCampaign[] }>("ads");
  const { width } = useWindowDimensions();
  const explore = () => router.navigate("/explorar");
  const recentProducts = home.data?.recentProducts ?? [];
  const featured = (home.data?.products ?? [])
    .filter((p) => p.promo_price_cents != null || p.is_featured)
    .slice(0, 8);
  const products = query
    ? catalog.products.slice(0, 24)
    : (home.data?.products ?? []).slice(0, 10);
  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={home.loading}
          onRefresh={() => {
            void Promise.allSettled([home.reload(), ads.reload()]);
          }}
          tintColor={colors.orange}
        />
      }
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 0,
          marginTop: 7,
        }}
      >
        <View style={{ flex: 1 }}>
          <T
            style={{
              color: "#595B56",
              fontFamily: fonts.medium,
              lineHeight: 31.5,
              marginBottom: 4,
            }}
          >
            Olá, {viewer?.name.split(" ")[0]}!{" "}
            <T style={{ color: colors.orange, fontSize: 21 }}>✳</T>
          </T>
          <T
            heading
            style={{
              fontFamily: fonts.display,
              fontSize: Math.min(35, Math.max(25, width * 0.03)),
              lineHeight: 29,
              letterSpacing: -1.15,
            }}
          >
            Seu condomínio mais perto de você!
          </T>
        </View>
        <View
          style={{
            backgroundColor: "#FFDFCF",
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ rotate: "5deg" }],
          }}
        >
          <ShoppingBasket size={27} color="#E65731" />
        </View>
      </View>
      <View style={{ marginBottom: 4 }}>
        <SearchBox value={query} onChangeText={setQuery} />
      </View>
      <View style={{ marginBottom: 10 }}>
        <Categories categories={home.data?.categories ?? []} />
      </View>
      {!query && (
        <LinearGradient
          colors={["#F96036", "#FF8550"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.6 }}
          style={{
            padding: width <= 420 ? 19 : 22,
            borderRadius: 29,
            boxShadow: "0 15px 35px rgba(234,88,43,.13)",
            alignItems: "flex-start",
            overflow: "hidden",
          }}
        >
          <T
            bold
            style={{ color: "#FFF3E9", fontSize: 10, lineHeight: 15, letterSpacing: 1.1 }}
          >
            TUDO DE BOM MORA AQUI
          </T>
          <T
            heading
            style={{
              marginTop: 12,
              marginBottom: 8,
              fontFamily: fonts.display,
              fontSize: Math.min(28, Math.max(24, width * 0.064)),
              lineHeight: Math.min(28, Math.max(24, width * 0.064)) * 1.06,
              letterSpacing: -0.6,
              color: "white",
            }}
          >
            Descubra o melhor{" "}
            <T
              heading
              style={{
                color: "#FFE24D",
                fontFamily: fonts.display,
                fontSize: Math.min(28, Math.max(24, width * 0.064)),
                lineHeight: Math.min(28, Math.max(24, width * 0.064)) * 1.06,
              }}
            >
              da sua vizinhança.
            </T>
          </T>
          <T style={{ color: "#FFF2EA", fontSize: 13, lineHeight: 19.5 }}>
            Produtos, comida e serviços de quem mora pertinho de você.
          </T>
          <Image
            source={require("../../assets/images/hero.png")}
            accessibilityLabel="Produtos e serviços do condomínio"
            style={{
              width: "100%",
              maxWidth: 290,
              height: width <= 420 ? 123 : 134,
              alignSelf: "center",
              marginTop: 6,
              marginBottom: 4,
            }}
            resizeMode="contain"
          />
          <Pressable
            accessibilityRole="button"
            onPress={explore}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#FFFEF7",
              borderRadius: 999,
              paddingVertical: 10,
              paddingHorizontal: 12,
              marginTop: 12,
              boxShadow: "0 4px 14px rgba(40,22,10,.08)",
            }}
          >
            <T bold style={{ fontSize: 12, lineHeight: 18, color: "#292119" }}>
              Começar a explorar
            </T>
            <ArrowRight size={17} color="#292119" />
          </Pressable>
        </LinearGradient>
      )}
      <ErrorBox
        message={home.error || (query ? catalog.error : "")}
        retry={() => void home.reload().catch(() => {})}
      />
      {home.loading && !home.data && <Loading />}
      {!query && (
        <>
          <FairHomeTeaser />
          {ads.data?.campaigns.length ? (
            <AdsCarousel
              key={ads.data.campaigns.map((ad) => ad.id).join(".")}
              campaigns={ads.data.campaigns}
            />
          ) : (
            !ads.loading && <WeeklyOffers />
          )}
          <Track
            title="Novidades por aqui"
            subtitle="Produtos adicionados nos últimos 3 dias"
            products={recentProducts}
            showAction={false}
          />
          <Track title="Produtos em destaque" products={featured} />
        </>
      )}
      <Section
        title={query ? "Resultados da busca" : "Feito pelos seus vizinhos"}
        action={query ? undefined : "Ver produtos"}
        onAction={explore}
      />
      {query && catalog.loading && <Loading />}
      <ProductGrid products={products} />
      {!products.length && !(query ? catalog.loading : home.loading) && (
        <Empty
          title={query ? "Nada por aqui ainda" : "A vitrine está começando!"}
          body={
            query
              ? "Tente outro termo ou explore as categorias."
              : "As primeiras lojas e produtos vão aparecer aqui assim que forem aprovados."
          }
        />
      )}
      {query && catalog.hasMore && (
        <Button
          title="Ver todos os resultados"
          secondary
          onPress={() =>
            router.push({ pathname: "/explorar", params: { busca: query } })
          }
        />
      )}
      {!query && (
        <>
          <Section
            title="Lojas em destaque"
            action="Ver todas"
            onAction={explore}
          />
          <View style={{ gap: 10 }}>
            {home.data?.shops.slice(0, 8).map((shop) => (
              <ShopRow shop={shop} key={shop.id} />
            ))}
          </View>
          {home.data && !home.data.shops.length && (
            <Empty
              title="Nenhuma loja publicada"
              body="As lojas do condomínio aparecerão aqui."
            />
          )}
        </>
      )}
    </Screen>
  );
}
function WeeklyOffers() {
  const { width } = useWindowDimensions();
  return (
    <View
      style={{
        backgroundColor: "#FFE4D2",
        borderWidth: 1,
        borderColor: "#FFD8BF",
        padding: width <= 420 ? 17 : 24,
        borderRadius: width <= 420 ? 21 : 26,
        minHeight: width <= 420 ? 166 : 190,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <T bold style={{ fontSize: 10, letterSpacing: 0.75, color: "#A04B28" }}>
          ACHADINHOS DA VIZINHANÇA
        </T>
        <T
          heading
          style={{
            fontFamily: fonts.display,
            fontSize: Math.min(26, Math.max(21, width * 0.06)),
            lineHeight: 26,
            color: "#3B281E",
            marginVertical: 9,
          }}
        >
          Ofertas da semana
        </T>
        <T
          style={{
            fontSize: width <= 420 ? 11 : 12,
            lineHeight: 17,
            color: "#805645",
          }}
        >
          Confira o que seus vizinhos prepararam por aqui.
        </T>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate("/explorar")}
          style={{
            backgroundColor: "#2B241F",
            borderRadius: 999,
            paddingVertical: 9,
            paddingHorizontal: 12,
            minHeight: 42,
            marginTop: 16,
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 7,
          }}
        >
          <T bold style={{ color: "white", fontSize: 11 }}>
            Conferir agora
          </T>
          <ArrowRight size={17} color="white" />
        </Pressable>
      </View>
      <Image
        source={require("../../assets/images/ofertas-semana.png")}
        accessibilityLabel="Arte promocional das ofertas da semana"
        style={{
          width: width <= 420 ? "36%" : "38%",
          height: width <= 420 ? 127 : 150,
          backgroundColor: "rgba(255,255,255,.30)",
          borderRadius: 24,
        }}
        resizeMode="contain"
      />
    </View>
  );
}
function Track({ title, products, subtitle, showAction = true }: {
  title: string; products: Product[]; subtitle?: string; showAction?: boolean;
}) {
  if (!products.length) return null;
  return (
    <>
      <Section
        title={title}
        action={showAction ? "Explorar" : undefined}
        onAction={showAction ? () => router.push("/explorar") : undefined}
      />
      {subtitle && <T style={{ fontSize: 12, color: "#77736B", marginTop: 4, marginBottom: 11 }}>{subtitle}</T>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={showAction ? undefined : 179}
        decelerationRate={showAction ? "normal" : "fast"}
        contentContainerStyle={{ gap: 14, paddingBottom: 5 }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} width={165} />
        ))}
      </ScrollView>
    </>
  );
}
function CategoryGlyph({
  category,
  color,
}: {
  category: Category;
  color: string;
}) {
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
  return <Icon size={25} strokeWidth={1.8} color={color} />;
}
/** Reuse public category art hosted on the same origin as the web app.
 * A broken/missing file never leaves a blank tile: the original Lucide glyph appears.
 */
function CategoryPicture({
  category,
  color,
  origin,
}: {
  category: Category;
  color: string;
  origin: string;
}) {
  const path = category.id ? getCategoryImagePath(category.name, category.icon) : null;
  const uri = path && origin ? origin.replace(/\/$/, "") + path : null;
  // Store the failed URL instead of resetting state inside an effect.
  // When the category changes, a different URL is attempted automatically.
  const [failedUri, setFailedUri] = useState<string | null>(null);

  if (!uri || failedUri === uri) return <CategoryGlyph category={category} color={color} />;

  return (
    <Image
      source={{ uri, cache: "force-cache" }}
      style={{ width: 76, height: 76, borderRadius: 38 }}
      resizeMode="contain"
      accessible={false}
      onError={() => setFailedUri(uri)}
    />
  );
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
  const { api } = useAuth();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12 }}
    >
      {[...categories, { id: "", name: "Tudo", icon: "layout-grid" }].map((c, i) => (
        <Pressable
          key={c.id}
          onPress={() =>
            !c.id
              ? onSelect ? onSelect("") : router.push({ pathname: "/explorar", params: { categoria: "", ofertas: "" } })
              : c.name === "Desapego"
                ? router.push("/desapego")
                : onSelect
                  ? onSelect(c.id)
                  : router.push({
                      pathname: "/explorar",
                      params: { categoria: c.id },
                    })
          }
          accessibilityRole="button"
          accessibilityState={{
            selected: selected !== undefined && c.id === selected,
          }}
          style={{ width: 90, alignItems: "center", gap: 9 }}
        >
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: ["#FFF0DD", "#E8F2E3", "#EAE6F5", "#FFE8D7"][
                i % 4
              ],
              borderWidth: c.id === selected ? 2 : 0,
              borderColor: colors.orange,
              overflow: "hidden",
            }}
          >
            <CategoryPicture
              category={c}
              origin={api.origin}
              color={["#DE6D50", "#628755", "#7974BC", "#C59114"][i % 4]}
            />
          </View>
          <T bold style={{ fontSize: 11, lineHeight: 13.75, textAlign: "center" }}>
            {c.name}
          </T>
        </Pressable>
      ))}
    </ScrollView>
  );
}
function useCatalog(query: string, category: string, enabled = true) {
  const { api } = useAuth();
  const [pagination, setPagination] = useState({ filter: "", page: 0 });
  const [result, setResult] = useState<{ filter: string; products: Product[] }>(
    { filter: "", products: [] },
  );
  const [request, setRequest] = useState({
    filter: "",
    loading: true,
    error: "",
    hasMore: false,
  });
  const filter = query + "|" + category;
  const page = pagination.filter === filter ? pagination.page : 0;
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const timer = setTimeout(() => {
      setRequest((previous) => ({
        ...previous,
        filter,
        loading: true,
        error: "",
      }));
      const params = new URLSearchParams({
        page: String(page),
        limit: "24",
        search: query,
        ...(category ? { category } : {}),
      });
      api
        .request<{ products: Product[]; hasMore: boolean }>("catalog?" + params)
        .then((response) => {
          if (!active) return;
          setResult((previous) => ({
            filter,
            products:
              page && previous.filter === filter
                ? [...previous.products, ...response.products]
                : response.products,
          }));
          setRequest({
            filter,
            loading: false,
            error: "",
            hasMore: response.hasMore,
          });
        })
        .catch((error) => {
          if (active)
            setRequest({
              filter,
              loading: false,
              error: error.message,
              hasMore: false,
            });
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [api, query, category, filter, page, enabled]);
  return {
    products: result.filter === filter ? result.products : [],
    loading: enabled && (request.filter !== filter || request.loading),
    error: request.filter === filter ? request.error : "",
    hasMore: request.filter === filter && request.hasMore,
    next: () => {
      if (request.filter !== filter || request.loading || !request.hasMore) return;
      // Lock synchronously: two rapid taps must not skip an API page.
      setRequest((previous) => ({ ...previous, loading: true }));
      setPagination({ filter, page: page + 1 });
    },
  };
}
function useShopDirectory(query: string) {
  const {api,viewer}=useAuth();
  const filter=(viewer?.condominium_id??"")+"|"+query.trim();
  const [pagination,setPagination]=useState<{filter:string;cursor:string|null}>({filter:"",cursor:null});
  const [result,setResult]=useState<{filter:string;shops:Shop[];nextCursor:string|null;hasMore:boolean}>({filter:"",shops:[],nextCursor:null,hasMore:false});
  const [request,setRequest]=useState({filter:"",loading:true,error:""});
  const [retry,setRetry]=useState(0);
  const cursor=pagination.filter===filter?pagination.cursor:null;
  // Reset pagination when switching tenants or search terms; schedule outside render.
  useEffect(()=>{
    const timer=setTimeout(()=>setPagination({filter,cursor:null}),0);
    return()=>clearTimeout(timer);
  },[filter]);
  const enabled=viewer?.status==="approved";
  useEffect(()=>{
    if(!enabled)return;
    let active=true;
    const timer=setTimeout(()=>{
      setRequest({filter,loading:true,error:""});
      const params=new URLSearchParams({limit:"24"});
      if(query.trim())params.set("search",query.trim());
      if(cursor)params.set("cursor",cursor);
      api.request<{shops:Shop[];nextCursor:string|null;hasMore:boolean}>("shops?"+params)
        .then(response=>{
          if(!active)return;
          setResult(previous=>({
            filter,
            shops:cursor&&previous.filter===filter?appendUniqueShops(previous.shops,response.shops):response.shops,
            nextCursor:response.nextCursor,
            hasMore:response.hasMore
          }));
          setRequest({filter,loading:false,error:""});
        })
        .catch(error=>{
          if(active)setRequest({filter,loading:false,error:error instanceof Error?error.message:"Não foi possível carregar as lojas."});
        });
    },80);
    return()=>{active=false;clearTimeout(timer)};
  },[api,enabled,filter,query,cursor,retry]);
  const valid=result.filter===filter;
  const loading=request.filter!==filter||request.loading;
  return {
    shops:valid?result.shops:[],
    loading,
    error:request.filter===filter?request.error:"",
    hasMore:valid&&result.hasMore,
    retry:()=>setRetry(n=>n+1),
    next:()=>{
      if(!valid||loading||request.error||!result.nextCursor)return;
      setRequest(previous=>({...previous,loading:true}));
      setPagination({filter,cursor:result.nextCursor});
    }
  };
}
type ExploreRow =
  | { kind: "products"; key: string; products: Product[] }
  | { kind: "shop"; key: string; shop: Shop }
  | { kind: "more" | "empty" | "loading" | "shops-title" | "shops-more" | "shops-empty" | "shops-loading" | "shops-error"; key: string };
export function Explore() {
  const params = useLocalSearchParams<{ categoria?: string; ofertas?: string; busca?: string }>();
  const { home } = useMarket();
  const [query, setQuery] = useState(params.busca ?? "");
  const category = params.categoria ?? "";
  const catalog = useCatalog(query, category);
  const directory = useShopDirectory(query);
  const { loading, error, hasMore } = catalog;
  const products = catalog.products.filter(
    (p) => !params.ofertas || p.promo_price_cents != null,
  );
  const { width } = useWindowDimensions();
  const horizontal = width <= 420 ? 15 : 20;
  const productWidth = Math.max(0, (width - horizontal * 2 - 15) / 2);
  const setCategory = (id: string) =>
    router.setParams({ categoria: id, ofertas: "" });
  // One vertical virtualized list for products AND shops, avoiding nested lists
  // and unbounded mounting as additional catalog pages are appended.
  const rows: ExploreRow[] = [];
  for (let i = 0; i < products.length; i += 2)
    rows.push({
      kind: "products",
      key: "products-" + products[i].id,
      products: products.slice(i, i + 2),
    });
  if (loading) rows.push({ kind: "loading", key: "loading" });
  else if (!products.length) rows.push({ kind: "empty", key: "empty" });
  if (hasMore) rows.push({ kind: "more", key: "more" });
  rows.push({ kind: "shops-title", key: "shops-title" });
  for (const shop of directory.shops)
    rows.push({ kind: "shop", key: "shop-" + shop.id, shop });
  if(directory.loading) rows.push({kind:"shops-loading",key:"shops-loading"});
  else if(directory.error) rows.push({kind:"shops-error",key:"shops-error"});
  else if(!directory.shops.length) rows.push({kind:"shops-empty",key:"shops-empty"});
  if(!directory.loading&&!directory.error&&directory.hasMore)
    rows.push({kind:"shops-more",key:"shops-more"});
  return (
    <Screen title="Explorar" scrollable={false}>
      <FlatList
        accessibilityLabel="Catálogo e lojas"
        data={rows}
        keyExtractor={(item) => item.key}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        contentContainerStyle={{
          paddingHorizontal: horizontal,
          paddingTop: width <= 420 ? 20 : 24,
          paddingBottom: 180,
          gap: 15,
        }}
        ListHeaderComponent={
          <View style={{ gap: 20 }}>
            <T heading style={{ fontSize: 28 }}>Explorar</T>
            <SearchBox value={query} onChangeText={setQuery} />
            <Categories
              categories={home.data?.categories ?? []}
              selected={category}
              onSelect={setCategory}
            />
            {!!category && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setCategory("")}
                style={{ alignSelf: "flex-start", paddingVertical: 7 }}
              >
                <T bold style={{ color: "#CF5A3A", fontSize: 12 }}>Limpar filtro</T>
              </Pressable>
            )}
            <ErrorBox message={error} />
          </View>
        }
        renderItem={({ item }) => {
          if (item.kind === "products")
            return (
              <View style={{ flexDirection: "row", gap: 15 }}>
                {item.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    width={productWidth}
                  />
                ))}
              </View>
            );
          if (item.kind === "shop") return <ShopRow shop={item.shop} />;
          if (item.kind === "shops-title")
            return <Section title="Todas as lojas" />;
           if (item.kind === "shops-loading") return <Loading />;
           if (item.kind === "shops-empty") return <Empty title="Nenhuma loja encontrada" body={query?"Tente buscar por outro nome.":"As lojas aprovadas aparecerão aqui."} />;
           if (item.kind === "shops-error") return <View style={{gap:10}}><ErrorBox message={directory.error}/><Button title="Tentar novamente" secondary onPress={directory.retry}/></View>;
           if (item.kind === "shops-more") return <Button title="Mostrar mais lojas" secondary onPress={directory.next}/>;
          if (item.kind === "loading") return <Loading />;
          if (item.kind === "empty")
            return (
              <Empty
                title="Nenhum produto encontrado"
                body="Tente outra categoria ou volte mais tarde."
              />
            );
          return (
            <Button
              title="Mostrar mais produtos"
              busy={loading}
              secondary
              onPress={catalog.next}
            />
          );
        }}
      />
    </Screen>
  );
}
export function Favorites() {
  const { favorites } = useMarket();
  const savedShops = useResource<{ids:string[];shops:Shop[]}>("favorite-shops");
  const { width } = useWindowDimensions();
  const horizontal = width <= 420 ? 15 : 20;
  const productWidth = Math.max(0, (width - horizontal * 2 - 15) / 2);
  const products = favorites.data?.products ?? [];
  return (
    <Screen title="Meus favoritos" scrollable={false}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 15 }}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        contentContainerStyle={{
          paddingHorizontal: horizontal,
          paddingTop: width <= 420 ? 20 : 24,
          paddingBottom: 180,
          gap: 15,
        }}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <T heading style={{ fontSize: 28 }}>Meus favoritos</T>
            {!!savedShops.data?.shops.length && <View style={{gap:12}}>
              <Section title="Lojas salvas"/>
              {savedShops.data.shops.map(shop=><ShopRow key={shop.id} shop={shop}/>)}
              <Section title="Produtos salvos"/>
            </View>}
            <ErrorBox
              message={favorites.error || savedShops.error}
              retry={() => void Promise.all([favorites.reload(),savedShops.reload()]).catch(() => {})}
            />
          </View>
        }
        ListEmptyComponent={
          favorites.loading || savedShops.loading ? (
            <Loading />
          ) : favorites.error || savedShops.error || !!savedShops.data?.shops.length ? null : (
            <Empty
              title="Seu próximo favorito mora aqui"
              body="Toque no coração de um produto para salvá-lo."
            />
          )
        }
        renderItem={({ item }) => (
          <ProductCard product={item} width={productWidth} />
        )}
      />
    </Screen>
  );
}
export function ShopDetail() {
  const [sharing,setSharing]=useState(false);
  const [savingShop,setSavingShop]=useState(false);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useAuth();
  const resource = useResource<{ shop: Shop; products: Product[] }>(
    "shops/" + id,
  );
  const shop = resource.data?.shop;
  const reviews = useResource<{
    summary: { average: number | null; count: number };
    reviews: {
      id: string;
      rating: number;
      description: string;
      created_at: string;
    }[];
  }>(shop ? "shops/" + shop.id + "/reviews" : null);
  const savedShops = useResource<{ids:string[];shops:Shop[]}>(shop ? "favorite-shops" : null);
  const saved = !!shop && !!savedShops.data?.ids.includes(shop.id);
  const offers = (resource.data?.products ?? []).filter(p=>
    p.visibility==="available" && p.stock!==0 && p.promo_price_cents!=null &&
    p.promo_price_cents>0 && p.promo_price_cents<p.price_cents,
  );
  const toggleShopSave = async () => {
    if(!shop||savingShop)return;
    setSavingShop(true);
    try{
      await api.request(saved ? "favorite-shops/"+shop.id : "favorite-shops",saved ? "DELETE":"POST",saved?undefined:{shop_id:shop.id});
      await savedShops.reload();
    }catch(e){alertError(e);}finally{setSavingShop(false);}
  };
  return (
    <Screen title="Loja" back backLabel="Voltar às lojas">
      <ErrorBox
        message={resource.error}
        retry={() => void resource.reload().catch(() => {})}
      />
      {resource.loading && <Loading />}
      {shop && (
        <>
          <View style={{opacity:shop.is_open?1:0.48}}>
            <Picture
              path={shop.cover_image}
              label={"Capa " + shop.name}
              height={175}
              radius={22}
              fallback={
                <LinearGradient
                  colors={["#FBE248", "#FFE9AC"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0.6 }}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Store size={62} color="#AB8538" />
                </LinearGradient>
              }
            />
            <View
              style={{
                marginTop: -43,
                marginLeft: 17,
                marginBottom: 10,
                borderWidth: 4,
                borderColor: "#FFFDFA",
                borderRadius: 44,
                width: 88,
                height: 88,
                backgroundColor: "#FFEFCA",
                boxShadow: "0 7px 21px rgba(51,35,12,.1)",
              }}
            >
              <ShopLogo shop={shop} size={80} />
            </View>
          </View>
          <View style={{ gap: 18 }}>
            <View>
              <T heading style={{ fontSize: 27, lineHeight: 32 }}>
                {shop.name}
              </T>
              <T style={{ fontSize: 13, color: colors.muted, marginTop: 7 }}>
                {shop.description}
              </T>
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 9,
              }}
            >
              <View
                style={{
                  borderRadius: 99,
                  paddingVertical: 5,
                  paddingHorizontal: 9,
                  backgroundColor: shop.is_open ? "#E3F4EB" : "#ECEEEA",
                }}
              >
                <T
                  bold
                  style={{
                    fontSize: 10,
                    lineHeight: 15,
                    color: shop.is_open ? "#166D4A" : "#555555",
                  }}
                >
                  {shop.is_open ? "Aceitando pedidos" : "Fechada"}
                </T>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSharing(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  minHeight: 39,
                  borderWidth: 1,
                  borderColor: "#EAD7BF",
                  borderRadius: 999,
                  backgroundColor: "#FFF6DF",
                  paddingVertical: 9,
                  paddingHorizontal: 13,
                }}
              >
                <Share2 size={17} color="#5D4325" />
                <T bold style={{ fontSize: 12, color: "#5D4325" }}>
                  Compartilhar loja
                </T>
              </Pressable>
              <Pressable accessibilityRole="button"
                accessibilityLabel={saved?"Remover loja dos salvos":"Salvar loja"}
                accessibilityState={{selected:saved,disabled:savingShop}}
                disabled={savingShop || savedShops.loading}
                onPress={()=>void toggleShopSave()}
                style={{
                  flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7,
                  minHeight:39,borderWidth:1,borderColor:saved?"#EFB4A9":colors.line,
                  backgroundColor:saved?"#FFF0E8":"#FFFCF8",
                  borderRadius:99,paddingVertical:9,paddingHorizontal:13,
                }}>
                <Heart size={17} color={saved?"#D8553C":colors.ink} fill={saved?"#D8553C":"none"}/>
                <T bold style={{fontSize:12}}>{saved?"Loja salva":"Salvar loja"}</T>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/denunciar",
                    params: { tipo: "shop", id: shop.id },
                  })
                }
                style={{ paddingVertical: 8 }}
              >
                <T style={{ fontSize: 11, color: colors.muted }}>
                  Denunciar loja
                </T>
              </Pressable>
            </View>
          </View>
          <View
            accessibilityLabel="Avaliação da loja"
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 7,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: "#E8E2D7",
            }}
          >
            <RoundedStars
              value={reviews.data?.summary.average ?? 0}
              size={22}
            />
            {reviews.data?.summary.count ? (
              <>
                <T bold style={{ fontSize: 15 }}>
                  {(reviews.data.summary.average ?? 0).toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}{" "}
                  de 5
                </T>
                <T style={{ fontSize: 12, color: "#797368" }}>
                  ({reviews.data.summary.count}{" "}
                  {reviews.data.summary.count === 1
                    ? "avaliação"
                    : "avaliações"}
                  )
                </T>
              </>
            ) : (
              <T style={{ fontSize: 12, color: "#797368" }}>
                {reviews.loading
                  ? "Carregando avaliações..."
                  : reviews.error
                    ? "Avaliações indisponíveis"
                    : "Sem avaliação"}
              </T>
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 13,
              borderBottomWidth: 1,
              borderColor: colors.line,
              paddingBottom: 16,
            }}
          >
            <Benefit
              Icon={Truck}
              label={
                shop.delivery_enabled ? "Entrega disponível" : "Sem entrega"
              }
            />
            {shop.pickup_enabled && (
              <Benefit Icon={ShoppingBag} label="Retirada" />
            )}
            {!!shop.lead_time && (
              <Benefit Icon={Clock3} label={shop.lead_time} />
            )}
          </View>
          {!shop.is_open&&<View accessibilityRole="alert" style={{backgroundColor:"#EEEEEC",borderRadius:14,padding:14}}><T bold style={{color:"#575757"}}>Loja fechada</T><T style={{color:"#666666"}}>Compras temporariamente indisponíveis. Os produtos continuam visíveis para consulta.</T></View>}
          {offers.length>0&&<View style={{gap:12}}>
            <Section title="Ofertas"/>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{marginHorizontal:-15}} contentContainerStyle={{gap:13,paddingHorizontal:15,paddingBottom:8}}>
              {offers.map(p=><View key={p.id} style={{width:174}}>
                <ProductCard product={{...p,shop_name:shop.name,is_open:shop.is_open}} width={174}/>
              </View>)}
            </ScrollView>
          </View>}
          <Section title="Produtos da loja" />
          <ProductGrid
            products={(resource.data?.products ?? []).map((p) => ({
              ...p,
              shop_name: shop.name,
              is_open: shop.is_open,
            }))}
          />
          {!resource.data?.products.length && (
            <Empty
              title="Loja sem produtos no momento"
              body="Em breve, novidades por aqui."
            />
          )}
          <Section title="Avaliações dos moradores" />
          <ErrorBox
            message={reviews.error}
            retry={() => void reviews.reload().catch(() => {})}
          />
          {reviews.loading ? (
            <Loading />
          ) : reviews.data?.reviews.length ? (
            reviews.data.reviews.map((review) => (
              <Card
                key={review.id}
                style={{
                  borderColor: "#EBE3D5",
                  backgroundColor: "#FFFDFA",
                  borderRadius: 19,
                  paddingVertical: 16,
                  paddingHorizontal: 17,
                  gap: 9,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <RoundedStars value={review.rating} size={19} />
                  <T style={{ fontSize: 11, color: "#877F70" }}>
                    {new Date(review.created_at).toLocaleDateString("pt-BR")}
                  </T>
                </View>
                <T style={{ fontSize: 13, lineHeight: 21 }}>
                  {review.description}
                </T>
                <T style={{ fontSize: 11, color: "#877F70" }}>
                  Compra verificada · Morador do condomínio
                </T>
              </Card>
            ))
          ) : (
            !reviews.error && (
              <Card
                style={{
                  paddingVertical: 29,
                  paddingHorizontal: 15,
                  alignItems: "center",
                  gap: 8,
                  borderStyle: "dashed",
                  borderColor: "#DED8C9",
                  borderRadius: 22,
                  backgroundColor: "#FFFDFA",
                }}
              >
                <RoundedStars value={0} size={24} />
                <T bold>Sem avaliação</T>
                <T
                  style={{
                    fontSize: 12,
                    color: "#898175",
                    textAlign: "center",
                  }}
                >
                  As avaliações dos compradores aparecerão aqui após moderação.
                </T>
              </Card>
            )
          )}
        </>
      )}
      {!!shop&&<ShopShareSheet visible={sharing} onClose={()=>setSharing(false)}
        shopName={shop.name} url={api.web("/loja/"+shop.slug)}/>}
    </Screen>
  );
}
function Benefit({ Icon, label }: { Icon: typeof Truck; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Icon size={17} color="#168257" />
      <T style={{ fontSize: 12, color: "#5C6259" }}>{label}</T>
    </View>
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
  const existingLines=market.cart.shop?.id===shop?.id?market.cart.items:[];
  const remaining=p?remainingToAdd(p.stock,existingLines,p.id):null;
  const maximumToAdd=Math.min(30,remaining??30);
  const purchasable = !!p && !!shop && shop.is_open && p.visibility==="available" && p.stock!==0;
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
          <View style={{opacity:purchasable?1:0.45}}><Picture
            path={p.image_url}
            label={p.name}
            aspectRatio={1.15}
            radius={25}
          /></View>
          {!purchasable&&<Card style={{backgroundColor:"#EFEFEC"}}><T bold>{shop.is_open?"Produto indisponível":"Loja fechada"}</T><T>Compras temporariamente indisponíveis.</T></Card>}
          <T heading style={{ fontSize: 30, lineHeight: 36 }}>
            {p.name}
          </T>
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
            <T style={{ color: colors.muted }}>Por</T>
            <Pressable accessibilityRole="link" accessibilityLabel={"Abrir loja "+shop.name}
              onPress={() => router.push({ pathname: "/loja/[id]", params: { id: shop.id } })}>
              <T style={{ color: colors.muted, textDecorationLine: "underline" }}>{shop.name}</T>
            </Pressable>
          </View>
          <T>{p.description}</T>
          <T heading style={{ fontSize: 24 }}>
            {money(unitPrice(p) + extra)}
          </T>
          <View pointerEvents={purchasable?"auto":"none"} style={{gap:14,opacity:purchasable?1:0.5}}>
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
            min={1}
            max={maximumToAdd}
            onChange={(n) => setQty(Math.max(1, Math.min(Math.max(1,maximumToAdd), n)))}
          />
          {remaining!==null&&<T style={{fontSize:12,color:colors.muted}}>{remaining===0
            ?"Você já atingiu o estoque disponível deste produto no carrinho."
            :"Disponível para adicionar: "+remaining+" unidade(s)."}</T>}
          <Button
            title={
              "Adicionar ao carrinho · " + money((unitPrice(p) + extra) * qty)
            }
            disabled={!purchasable||maximumToAdd===0||qty>maximumToAdd}
            onPress={() => {
              void market
                .add(p, shop, qty, note, choices)
                .then((added) => {
                  if (added) router.push("/carrinho");
                })
                .catch((e) => setError(e.message));
            }}
          />
          </View>
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
