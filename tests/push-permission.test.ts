import test from "node:test";
import assert from "node:assert/strict";
import { shouldShowPushOnboarding } from "../src/domain/push-permission";

test("authenticated physical Android and iOS installations show visible opt-in when not authorized", () => {
  assert.equal(shouldShowPushOnboarding("android",true,false,false),true);
  assert.equal(shouldShowPushOnboarding("ios",true,false,false),true);
});
test("already permitted, dismissed and non-native platforms do not nag", () => {
  assert.equal(shouldShowPushOnboarding("android",true,true,false),false);
  assert.equal(shouldShowPushOnboarding("android",true,false,true),false);
  assert.equal(shouldShowPushOnboarding("android",false,false,false),false);
  assert.equal(shouldShowPushOnboarding("web",true,false,false),false);
});
