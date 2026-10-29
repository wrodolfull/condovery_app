import { quoteChanged } from "../domain/quote";
import { dateForApi, formatPreferredDate } from "../domain/date";
import React, { useState } from "react";
import { FlatList, Pressable, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { randomUUID } from "expo-crypto";
import { useAuth } from "../auth";
import { useMarket, linePrice } from "../market";
import { useResource } from "../hooks";
import { ApiError } from "../api";
import {
  Button,
  Card,
  Empty,
  ErrorBox,
  Field,
  Loading,
  Quantity,
  Screen,
  T,
  alertError,
} from "../ui";
import { colors, money } from "../theme";
import {
  arrivalInstructionOptions,
  toggleArrivalInstruction,
} from "../domain/orders";
import {
  allowedPaymentMethods,
  PAYMENT_LABELS,
  type PaymentMethod,
} from "../domain/payment-methods";
import { openWhatsApp } from "../external";
import { statusLabels, type Order, type Quote } from "../types";
import { orderHistoryPath, type OrdersPage } from "../domain/order-pagination";
export function Checkout() {
  const { viewer, api } = useAuth();
  const market = useMarket();
  const { cart } = market;
  const shop = cart.shop;
  // Cart data may have been saved before the seller closed their store.
  const liveShop = useResource<{shop: typeof shop;products:unknown[]}>(shop ? "shops/" + shop.id : null);
  const shopClosed = shop?.is_open===false || liveShop.data?.shop?.is_open===false;
  const blocked = !!shop && (shopClosed || liveShop.loading || !!liveShop.error);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">(
      shop?.delivery_enabled ? "delivery" : "pickup",
    ),
    [payment, setPayment] = useState<PaymentMethod | null>(null),
    [day, setDay] = useState(""),
    [window, setWindow] = useState(""),
    [instructions, setInstructions] = useState<string[]>([]),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [revised, setRevised] = useState<{
      quote: Quote;
      fingerprint: string;
    } | null>(null);
  const actual =
    shop?.delivery_enabled === false
      ? "pickup"
      : shop?.pickup_enabled === false
        ? "delivery"
        : fulfillment;
  const accepted = allowedPaymentMethods(shop?.payment_methods);
  const chosen = payment ?? accepted[0];
  let subtotal = 0;
  try {
    subtotal = cart.items.reduce((n, i) => n + linePrice(i) * i.quantity, 0);
  } catch {}
  const fee = actual === "delivery" ? (shop?.delivery_fee_cents ?? 0) : 0;
  const payload = () => ({
    shop_id: shop!.id,
    items: cart.items.map((i) => ({
      id: i.product.id,
      quantity: i.quantity,
      note: i.note,
      selections: i.selections,
    })),
    fulfillment: actual,
    payment_method: chosen,
    delivery_day: dateForApi(day),
    delivery_window: window,
    instructions: actual === "delivery" ? instructions : [],
    note,
  });
  let activeQuote: Quote | null = null;
  try {
    if (revised?.fingerprint === JSON.stringify(payload()))
      activeQuote = revised.quote;
  } catch {}
  const finish = async () => {
    market.lockCheckout(true);
    setBusy(true);
    setError("");
    try {
      if(!shop)throw new Error("Carrinho indisponível.");
      // Always recheck the current store state before resuming or sending.
      const latest = await api.request<{shop:{is_open:boolean}}>("shops/"+shop.id);
      if(!latest.shop.is_open){
        await liveShop.reload().catch(()=>{});
        throw new Error("Loja fechada. Não é possível realizar pedidos agora.");
      }
      let body = cart.pending?.payload;
      if (!body) {
        if (!chosen) throw new Error("Escolha uma forma de pagamento.");
        const draft = payload();
        const fingerprint = JSON.stringify(draft);
        const { quote } = await api.request<{ quote: Quote }>(
          "orders/quote",
          "POST",
          draft,
        );
        const prior =
          revised?.fingerprint === fingerprint
            ? revised.quote
            : {
                subtotal_cents: subtotal,
                delivery_fee_cents: fee,
                total_cents: subtotal + fee,
                lines: cart.items.map((i) => ({
                  name: i.product.name,
                  quantity: i.quantity,
                  unit_price_cents: linePrice(i),
                  total_cents: linePrice(i) * i.quantity,
                  note: i.note,
                  options: [],
                })),
              };
        if (quoteChanged(prior, quote)) {
          setRevised({ quote, fingerprint });
          return;
        }
        body = {
          ...draft,
          expected_total_cents: quote.total_cents,
          client_order_key: randomUUID(),
        };
      }
      await market.pending({ payload: body });
      const result = await api.request<{
        order: { id: string };
        whatsapp_url: string;
      }>("orders", "POST", body);
      market.clear();
      void market.home.reload().catch(() => {});
      router.replace({
        pathname: "/sucesso/[id]",
        params: { id: result.order.id },
      });
      void openWhatsApp(result.whatsapp_url).catch(() =>
        alertError(
          new Error(
            "Seu pedido foi registrado. Use Enviar pedido para abrir o WhatsApp novamente.",
          ),
        ),
      );
    } catch (e) {
      if (e instanceof ApiError && e.status < 500) {
        await market.pending(null).catch(() => {});
        if (e.status === 409) setRevised(null);
      }
      setError((e as Error).message);
    } finally {
      market.lockCheckout(false);
      setBusy(false);
    }
  };
  if (!market.cartReady)
    return (
      <Screen title="Carrinho" back>
        <Loading />
      </Screen>
    );
  if (!shop || !cart.items.length)
    return (
      <Screen title="Carrinho" back>
        <Empty
          title="Seu carrinho está vazio"
          body="Explore as lojas e encontre algo de bom por aqui."
        />
        <Button
          title="Começar a explorar"
          onPress={() => router.replace("/explorar")}
        />
      </Screen>
    );
  return (
    <Screen title="Carrinho" back>
      <T heading style={{ fontSize: 27 }}>
        Seu pedido · {shop.name}
      </T>
      <ErrorBox message={error || liveShop.error} />
      {blocked&&<Card style={{backgroundColor:"#EFEFEC",borderColor:"#D9D9D5"}}>
        <T bold style={{color:"#555555"}}>{shopClosed?"Loja fechada":"Verificando disponibilidade da loja"}</T>
        <T style={{color:"#666666"}}>{shopClosed
          ?"Os produtos podem ser consultados, mas não é possível finalizar pedidos enquanto a loja estiver fechada."
          :"Aguarde a verificação antes de enviar o pedido."}</T>
      </Card>}
      {cart.pending && (
        <Card>
          <T bold>Uma tentativa de pedido está em andamento.</T>
          <T>
            Retome a mesma tentativa para conferir o resultado sem criar outro
            pedido.
          </T>
          <Button
            title="Ver meus pedidos"
            secondary
            onPress={() => router.push("/pedidos")}
          />
        </Card>
      )}
      {shopClosed&&!cart.pending&&<Button title="Esvaziar carrinho" secondary onPress={()=>market.clear()}/>}
      <View style={{opacity:blocked?0.55:1}} pointerEvents={blocked?"none":"auto"}>
      {cart.items.map((i, index) => (
        <Card key={i.key}>
          <T bold>{i.product.name}</T>
          <T>{i.note}</T>
          <T>
            {money(
              activeQuote?.lines[index]?.total_cents ??
                linePrice(i) * i.quantity,
            )}
          </T>
          {!cart.pending && (
            <Quantity
              value={i.quantity}
              onChange={(n) => {
                if (busy) return;
                try {
                  market.quantity(i.key, n);
                } catch (e) {
                  alertError(e);
                }
              }}
            />
          )}
        </Card>
      ))}
      {!cart.pending && (
        <>
          <T heading style={{ fontSize: 21 }}>
            Como você quer receber?
          </T>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {shop.delivery_enabled && (
              <Button
                title="Entrega"
                secondary={actual !== "delivery"}
                onPress={() => setFulfillment("delivery")}
              />
            )}
            {shop.pickup_enabled && (
              <Button
                title="Retirada"
                secondary={actual !== "pickup"}
                onPress={() => setFulfillment("pickup")}
              />
            )}
          </View>
          <T>
            {actual === "delivery"
              ? viewer?.tower + ", apto " + viewer?.apartment
              : shop.pickup_instructions || "Combine a retirada com a loja."}
          </T>
          <Field
            label="Data preferida (opcional)"
            placeholder="dd/mm/aaaa"
            value={day}
            onChangeText={(value) => setDay(formatPreferredDate(value))}
            keyboardType="number-pad"
            maxLength={10}
          />
          <Field
            label="Horário preferido (opcional)"
            value={window}
            onChangeText={setWindow}
            maxLength={70}
          />
          <T style={{ fontSize: 12, color: colors.muted }}>
            Data e horário estão sujeitos à confirmação da loja.
          </T>
          {actual === "delivery" && (
            <Card>
              <T bold>Instruções de entrega</T>
              {arrivalInstructionOptions.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: instructions.includes(item) }}
                  onPress={() =>
                    setInstructions((v) =>
                      toggleArrivalInstruction(v, item, !v.includes(item)),
                    )
                  }
                  style={{ paddingVertical: 8 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 21, height: 21, borderRadius: 5,
                        borderWidth: 1.5, borderColor: instructions.includes(item) ? colors.orange : colors.muted,
                        backgroundColor: instructions.includes(item) ? colors.orange : "transparent",
                      }}
                    />
                    <T>{item}</T>
                  </View>
                </Pressable>
              ))}
            </Card>
          )}
          <Field
            label="Observações do pedido"
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={400}
          />
          <T heading style={{ fontSize: 21 }}>
            Forma de pagamento
          </T>
          <T style={{ color: colors.muted, fontSize: 12 }}>
            O pagamento será combinado diretamente com a loja.
          </T>
          {accepted.map((m) => (
            <Pressable
              key={m}
              accessibilityRole="radio"
              accessibilityState={{ selected: chosen === m }}
              accessibilityLabel={PAYMENT_LABELS[m]}
              onPress={() => setPayment(m)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 12,
                borderWidth: 1, borderColor: chosen === m ? colors.orange : colors.line,
                borderRadius: 14, padding: 16,
                backgroundColor: chosen === m ? "#FFF2DA" : colors.card,
              }}
            >
              <View style={{
                width: 21, height: 21, borderRadius: 5, borderWidth: 1.5,
                borderColor: chosen === m ? colors.orange : colors.muted,
                backgroundColor: chosen === m ? colors.orange : "transparent",
              }} />
              <T bold>{PAYMENT_LABELS[m]}</T>
            </Pressable>
          ))}
        </>
      )}
      </View>
      <Card>
        <T>Subtotal: {money(activeQuote?.subtotal_cents ?? subtotal)}</T>
        <T>Taxa de entrega: {money(activeQuote?.delivery_fee_cents ?? fee)}</T>
        <T heading style={{ fontSize: 23 }}>
          Total: {money(activeQuote?.total_cents ?? subtotal + fee)}
        </T>
      </Card>
      {activeQuote && (
        <T bold style={{ color: colors.orange }}>
          O valor foi atualizado pela loja. Confira o novo total antes de
          continuar.
        </T>
      )}
      <Button
        title={
          cart.pending
            ? "Retomar envio do pedido"
            : activeQuote
              ? "Confirmar novo valor e continuar"
              : "Enviar pedido"
        }
        busy={busy}
        disabled={blocked}
        onPress={() => void finish()}
      />
    </Screen>
  );
}
export function Orders() {
  const [status, setStatus] = useState("");
  const { api } = useAuth();
  const [history, setHistory] = useState<{ status:string;older:Order[];nextCursor:string|null }|null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const { width } = useWindowDimensions();
  const r = useResource<OrdersPage>(orderHistoryPath("buyer",status));
  const older = history?.status===status?history.older:[];
  const nextCursor = history?.status===status?history.nextCursor:(r.data?.nextCursor??null);
  const first = r.data?.orders??[];
  const firstIds = new Set(first.map(o=>o.id));
  const visibleOrders=[...first,...older.filter(o=>!firstIds.has(o.id))];
  const loadOlder=async()=>{
    if(!nextCursor||loadingOlder)return;
    setLoadingOlder(true);setHistoryError("");
    try{
      const result=await api.request<OrdersPage>(orderHistoryPath("buyer",status,nextCursor));
      setHistory(previous=>{
        const previousOlder=previous?.status===status?previous.older:[];
        const seen=new Set([...first,...previousOlder].map(o=>o.id));
        return {status,older:[...previousOlder,...result.orders.filter(o=>!seen.has(o.id))],nextCursor:result.nextCursor};
      });
    }catch(e){setHistoryError((e as Error).message);}
    finally{setLoadingOlder(false);}
  };
  return (
    <Screen title="Meus pedidos" scrollable={false}>
      <FlatList
        accessibilityLabel="Lista de pedidos"
        data={visibleOrders}
        keyExtractor={(item) => item.id}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        refreshing={!!r.loading && !!r.data}
        onRefresh={() => {setHistory(null);setHistoryError("");void r.reload().catch(() => {});}}
        contentContainerStyle={{
          paddingHorizontal: width <= 420 ? 15 : 20,
          paddingTop: width <= 420 ? 20 : 24,
          paddingBottom: 180,
          gap: 15,
        }}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <T heading style={{ fontSize: 28 }}>Meus pedidos</T>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {[
                ["", "Todos"],
                ["awaiting_confirmation", "Criados"],
                ["confirmed", "Confirmados"],
                ["completed", "Concluídos"],
                ["cancelled", "Cancelados"],
              ].map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => {setStatus(key);setHistoryError("");}}
                  style={{
                    backgroundColor: key === status ? colors.yellow : "white",
                    padding: 10,
                    borderRadius: 22,
                  }}
                >
                  <T bold style={{ fontSize: 12 }}>{label}</T>
                </Pressable>
              ))}
            </View>
            <ErrorBox
              message={r.error}
              retry={() => void r.reload().catch(() => {})}
            />
          </View>
        }
        ListEmptyComponent={
          r.loading ? <Loading /> : r.error ? null : (
            <Empty
              title="Seus pedidos aparecerão aqui"
              body="Explore as lojas do seu condomínio para começar."
            />
          )
        }
        ListFooterComponent={
          <View style={{gap:12,paddingTop:8}}>
            {!!historyError&&<ErrorBox message={historyError}/>}
            {!!nextCursor&&<Button title={loadingOlder?"Carregando pedidos...":"Ver pedidos anteriores"}
              disabled={loadingOlder} onPress={()=>void loadOlder()}/>}
          </View>
        }
        renderItem={({ item: o }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/pedido/[id]", params: { id: o.id } })
            }
          >
            <Card>
              <T bold>Pedido #{o.code} · {o.shop_name}</T>
              <T>{statusLabels[o.status] ?? o.status}</T>
              <T bold>{money(o.total_cents)}</T>
              <T style={{ fontSize: 12, color: colors.muted }}>
                {new Date(o.created_at).toLocaleString("pt-BR")}
              </T>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
export function OrderDetail({ success = false }: { success?: boolean }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useAuth();
  const r = useResource<{ orders: Order[] }>("orders");
  const order = r.data?.orders.find((o) => o.id === id);
  const [rating, setRating] = useState(0),
    [review, setReview] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <Screen title={success ? "Pedido registrado" : "Meu pedido"} back>
      <ErrorBox
        message={r.error}
        retry={() => void r.reload().catch(() => {})}
      />
      {success && (
        <>
          <T heading style={{ fontSize: 28 }}>
            Seu pedido foi registrado!
          </T>
          <T>A confirmação e o pagamento serão combinados com a loja.</T>
        </>
      )}
      {r.loading && <Loading />}
      {order ? (
        <>
          <T heading style={{ fontSize: 25 }}>
            Pedido #{order.code}
          </T>
          <T bold>{order.shop_name}</T>
          <T
            bold
            style={{
              color:
                order.status === "cancelled" ? colors.danger : colors.green,
            }}
          >
            {statusLabels[order.status]}
          </T>
          {order.status !== "cancelled" && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 7,
              }}
            >
              {["Pedido criado", "Confirmado", "Concluído"].map((label, i) => (
                <T
                  key={label}
                  style={{
                    fontSize: 11,
                    color:
                      i <=
                      [
                        "awaiting_confirmation",
                        "confirmed",
                        "completed",
                      ].indexOf(order.status)
                        ? colors.green
                        : colors.muted,
                  }}
                >
                  ● {label}
                </T>
              ))}
            </View>
          )}
          {order.items.map((item, i) => (
            <Card key={i}>
              <T bold>
                {item.quantity}x {item.name}
              </T>
              {item.options?.map((o, j) => (
                <T key={j} style={{ fontSize: 12 }}>
                  {o.group}: {o.name}{" "}
                  {o.price_cents ? "(+" + money(o.price_cents) + ")" : ""}
                </T>
              ))}
              {item.note ? <T>{item.note}</T> : null}
              <T>{money(item.quantity * item.unit_price_cents)}</T>
            </Card>
          ))}
          <Card>
            <T>
              {order.fulfillment === "delivery"
                ? "Entrega · " + order.tower + ", apto " + order.apartment
                : "Retirada"}
            </T>
            {order.delivery_day && (
              <T>
                Data preferida:{" "}
                {String(order.delivery_day)
                  .slice(0, 10)
                  .split("-")
                  .reverse()
                  .join("/")}
              </T>
            )}
            {order.delivery_window && <T>{order.delivery_window}</T>}
            {order.delivery_instructions?.length > 0 && (
              <T>{order.delivery_instructions.join(" · ")}</T>
            )}
            {order.note ? <T>{order.note}</T> : null}
            {order.payment_method && (
              <T>{PAYMENT_LABELS[order.payment_method]}</T>
            )}
            <T>Subtotal: {money(order.subtotal_cents)}</T>
            <T>Taxa: {money(order.delivery_fee_cents)}</T>
            <T bold>Total: {money(order.total_cents)}</T>
          </Card>
          {["awaiting_confirmation", "confirmed"].includes(order.status) && (
            <Button
              title="Enviar pedido"
              onPress={() =>
                void api
                  .request<{ whatsapp_url: string }>(
                    "orders/" + id + "/whatsapp",
                  )
                  .then((r) => openWhatsApp(r.whatsapp_url))
                  .catch(alertError)
              }
            />
          )}
          {order.can_review && (
            <Card>
              <T heading style={{ fontSize: 21 }}>
                Avaliar a loja
              </T>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={n}
                    accessibilityLabel={n + " estrelas"}
                    onPress={() => setRating(n)}
                  >
                    <T
                      style={{
                        fontSize: 30,
                        color: n <= rating ? colors.orange : colors.muted,
                      }}
                    >
                      ★
                    </T>
                  </Pressable>
                ))}
              </View>
              <Field
                label="Comentário"
                value={review}
                onChangeText={setReview}
                multiline
                maxLength={200}
              />
              <Button
                title="Enviar avaliação"
                busy={busy}
                disabled={!rating}
                onPress={() => {
                  setBusy(true);
                  api
                    .request("orders/" + id + "/review", "POST", {
                      rating,
                      description: review,
                    })
                    .then(() => {
                      setMessage("Avaliação enviada para moderação.");
                      return r.reload();
                    })
                    .catch(alertError)
                    .finally(() => setBusy(false));
                }}
              />
            </Card>
          )}
          {message && <T>{message}</T>}
          <Button
            title="Ver meus pedidos"
            secondary
            onPress={() => router.replace("/pedidos")}
          />
        </>
      ) : (
        !r.loading &&
        !r.error && (
          <Empty
            title="Pedido não encontrado"
            body="Confira o histórico da sua conta."
          />
        )
      )}
    </Screen>
  );
}
