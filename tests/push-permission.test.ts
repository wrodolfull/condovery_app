import test from "node:test";
import assert from "node:assert/strict";
import { shouldAutoRequestPushPermission } from "../src/domain/push-permission";

const undecided = {
  granted: false,
  canAskAgain: true,
  status: "undetermined",
};

test("first authenticated Android use asks when the OS has not decided", () => {
  assert.equal(shouldAutoRequestPushPermission("android", undecided, false), true);
});

test("existing consent and earlier prompt never cause a second automatic dialog", () => {
  assert.equal(shouldAutoRequestPushPermission("android", undecided, true), false);
  assert.equal(
    shouldAutoRequestPushPermission("android", { granted: true, canAskAgain: true, status: "granted" }, false),
    false,
  );
});

test("OS denial, inability to prompt and iOS never trigger Android onboarding", () => {
  assert.equal(
    shouldAutoRequestPushPermission("android", { granted: false, canAskAgain: true, status: "denied" }, false),
    false,
  );
  assert.equal(
    shouldAutoRequestPushPermission("android", { granted: false, canAskAgain: false, status: "undetermined" }, false),
    false,
  );
  assert.equal(shouldAutoRequestPushPermission("ios", undecided, false), false);
  assert.equal(shouldAutoRequestPushPermission("web", undecided, false), false);
});
