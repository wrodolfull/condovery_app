import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(file:string)=>readFileSync(file,"utf8");

test("header badge fetches unread notices even without permission to send push",()=>{
  const source=read("src/ui.tsx");
  assert.match(source,/push\/summary/);
  assert.match(source,/refetchInterval:\s*20000/);
  assert.match(source,/unreadCount\s*>\s*0/);
  assert.match(source,/backgroundColor:\s*"#E02B35"/);
});

test("foreground push and opening notices refresh unread count",()=>{
  const push=read("src/push.ts");
  assert.match(push,/addNotificationReceivedListener/);
  assert.match(push,/startsWith\("push\/summary"\)/);
  assert.match(push,/PUSH_OPT_OUT_KEY/);
  assert.match(push,/deactivate: async/);
  assert.match(push,/push\/devices","DELETE"/);
  const screen=read("src/screens/AccountScreens.tsx");
  assert.match(screen,/push\/status/);
  assert.match(screen,/useFocusEffect/);
  assert.match(screen,/api\.request\("push\/inbox\/" \+ id, "PATCH"\)/);
  assert.match(screen,/Ver pedidos da minha loja/);
  assert.match(screen,/useOpenNotification/);
});
