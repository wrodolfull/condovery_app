import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import { notificationDestination } from "../src/domain/notification-navigation";
import type { Notice } from "../src/types";

const id = "11111111-1111-4111-8111-111111111111";
const notice = (kind:Notice["kind"], target_id:string|null=id) => ({kind,target_id});
test("seller's new orders and completion reminders open native seller Orders",()=>{
  assert.deepEqual(notificationDestination(notice("seller_order")),{screen:"seller",tab:"Pedidos",orderId:id});
  assert.deepEqual(notificationDestination(notice("seller_reminder")),{screen:"seller",tab:"Pedidos",orderId:id});
});
test("seller reviews open native Reviews; buyer status and moderation open buyer order",()=>{
  assert.deepEqual(notificationDestination(notice("seller_review")),{screen:"seller",tab:"Avaliações",reviewId:id});
  assert.deepEqual(notificationDestination(notice("order")),{screen:"buyer-order",orderId:id});
  assert.deepEqual(notificationDestination(notice("review_update")),{screen:"buyer-order",orderId:id});
});
test("announcements and malformed targets safely open inbox notice detail",()=>{
  assert.deepEqual(notificationDestination(notice("condominium")),{screen:"notice"});
  assert.deepEqual(notificationDestination(notice("order","bad-id")),{screen:"notice"});
  assert.deepEqual(notificationDestination(notice("seller_review",null)),{screen:"seller",tab:"Avaliações"});
});
test("Android first-use shows an explicit consent control and never persists failed auto-request flags",()=>{
  const onboarding=readFileSync("src/PushOnboarding.tsx","utf8");
  const push=readFileSync("src/push.ts","utf8");
  assert.match(onboarding,/Ativar notificações/);
  assert.match(onboarding,/Agora não/);
  assert.match(onboarding,/openSettings/);
  assert.match(push,/requestPermissionsAsync/);
  assert.doesNotMatch(push,/push_permission_prompted_v1/);
  assert.match(push,/useOpenNotification/);
});
test("seller panel accepts tab and record deep links",()=>{
  const panel=readFileSync("src/screens/SellerPanel.tsx","utf8");
  assert.match(panel,/useLocalSearchParams/);
  assert.match(panel,/focusedOrderId/);
  assert.match(panel,/focusedReviewId/);
  assert.match(panel,/"orders\\/"\\+focusedOrderId/);
});
