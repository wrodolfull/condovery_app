import test from "node:test";
import assert from "node:assert/strict";
import { sellerItemDetails, sellerOrderDetails } from "../src/domain/seller-orders";
import type { Order } from "../src/types";

const order: Order = {
  id: "order-1",
  code: 104,
  status: "awaiting_confirmation",
  total_cents: 8275,
  subtotal_cents: 7725,
  delivery_fee_cents: 550,
  shop_name: "Bolos da Gabi",
  buyer_name: "Maria Silva",
  buyer_phone: "19999998888",
  tower: "Torre 4",
  apartment: "101",
  fulfillment: "delivery",
  delivery_day: "2026-10-29T00:00:00.000Z",
  delivery_window: "18h–20h",
  delivery_instructions: ["Não tocar a campainha","Deixar na porta"],
  note: "Entregar depois das 19h",
  payment_method: "pix",
  can_review: false,
  created_at: "2026-10-29T14:00:00Z",
  items: [{
    name:"Bolo de cenoura",
    quantity:2,
    unit_price_cents:3863,
    note:"Sem cobertura",
    options:[{group:"Tamanho",name:"Grande",price_cents:275}],
  }],
};

test("seller sees buyer, delivery timing, preferences, payment and notes",()=>{
  const summary=sellerOrderDetails(order).join("\n");
  assert.match(summary,/Morador: Maria Silva/);
  assert.match(summary,/Contato: 19999998888/);
  assert.match(summary,/Entrega: Torre 4 · Ap. 101/);
  assert.match(summary,/Data preferida: 29\/10\/2026/);
  assert.match(summary,/18h–20h/);
  assert.match(summary,/Não tocar a campainha/);
  assert.match(summary,/Deixar na porta/);
  assert.match(summary,/Pix/);
  assert.match(summary,/Entregar depois das 19h/);
});

test("customized product lines display options, extras and item notes",()=>{
  const result=sellerItemDetails(order.items[0]).join("\n").replaceAll("\u00a0"," ");
  assert.match(result,/Tamanho: Grande/);
  assert.match(result,/R\$ 2,75/);
  assert.match(result,/Sem cobertura/);
});

test("pickup does not display delivery instructions from stale order data",()=>{
  const summary=sellerOrderDetails({
    ...order,fulfillment:"pickup",delivery_instructions:["Não tocar a campainha"],
    buyer_name:"",buyer_phone:"",
  }).join("\n");
  assert.match(summary,/Retirada na loja/);
  assert.doesNotMatch(summary,/Instruções de entrega/);
  assert.match(summary,/Morador: Não informado/);
});
