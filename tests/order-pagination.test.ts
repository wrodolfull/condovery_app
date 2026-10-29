import test from "node:test";
import assert from "node:assert/strict";
import {mergeLatestOrders,orderHistoryPath} from "../src/domain/order-pagination";
import type { Order } from "../src/types";

function row(code:number):Order {
  return {id:"order-"+code,code,status:"awaiting_confirmation",total_cents:1500,subtotal_cents:1500,delivery_fee_cents:0,shop_name:"Loja",tower:"Torre A",apartment:"1",fulfillment:"pickup",delivery_day:null,delivery_window:"",delivery_instructions:[],note:"",can_review:false,created_at:"2026-10-29T12:00:00Z",items:[]};
}
test("order history URL encodes scope, status and cursor",()=>{
  assert.equal(orderHistoryPath("buyer",""),"orders?limit=20");
  assert.equal(orderHistoryPath("buyer","completed","102"),"orders?limit=20&status=completed&cursor=102");
  assert.equal(orderHistoryPath("seller","","55"),"orders?limit=20&scope=seller&cursor=55");
});
test("polling preserves previously loaded older orders and fresh statuses",()=>{
  const old=[row(9),row(8),row(7)];
  const latest=[{...row(11),status:"confirmed"}, {...row(9),status:"completed"}];
  const merged=mergeLatestOrders(latest,old);
  assert.deepEqual(merged.map(r=>r.code),[11,9,8,7]);
  assert.equal(merged.find(r=>r.code===9)?.status,"completed");
});
