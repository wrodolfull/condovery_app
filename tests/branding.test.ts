import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");
test("Elevadoor is the app display name, wordmark and customer-facing name",()=>{
  assert.match(read("app.config.ts"),/name: "Elevadoor"/);
  assert.match(read("src/ui.tsx"),/elevadoor<T style=/);
  const files=[
    "src/api.ts","src/auth.tsx","src/ui.tsx","src/push.ts",
    "src/domain/help-content.ts","src/domain/orders.ts",
    "src/screens/AccountScreens.tsx","src/screens/CommunityScreens.tsx",
    "src/components/ShopShareSheet.tsx",
  ];
  for(const path of files)assert.doesNotMatch(read(path),/\bCondovery\b/,
    "Legacy display name found in "+path);
  assert.match(read("src/domain/orders.ts"),/pedido pelo Elevadoor/);
});
test("legacy authentication deep link and native IDs remain stable through a brand-only release",()=>{
  const config=read("app.config.ts");
  assert.match(config,/scheme: "condovery"/);
  assert.match(config,/bundleIdentifier: "com.wrodolfull.condovery"/);
  assert.match(read("src/auth.tsx"),/condovery:\/\/auth\/callback/);
});
