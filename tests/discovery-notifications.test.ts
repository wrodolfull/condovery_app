import test from "node:test";
import assert from "node:assert/strict";
import {notificationDestination} from "../src/domain/notification-navigation";
import type {Notice} from "../src/types";

const notice=(kind:Notice["kind"],target_id:string|null=null)=>({kind,target_id});
const id="0ec46ce3-0e73-4d95-b87c-090ca25cbfa2";
test("new shop opens its store while other discoveries go to Explore",()=>{
  assert.deepEqual(notificationDestination(notice("discovery_shop",id)),{screen:"shop",shopId:id});
  assert.deepEqual(notificationDestination(notice("discovery_products")),{screen:"explore"});
  assert.deepEqual(notificationDestination(notice("discovery_sunday")),{screen:"explore"});
  assert.deepEqual(notificationDestination(notice("discovery_shop","not-a-uuid")),{screen:"notice"});
});
test("existing transactional and seller notification destinations remain unchanged",()=>{
  assert.deepEqual(notificationDestination(notice("order",id)),{screen:"buyer-order",orderId:id});
  assert.deepEqual(notificationDestination(notice("seller_order",id)),{screen:"seller",tab:"Pedidos",orderId:id});
});
