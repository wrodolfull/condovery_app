import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

// A JSX whitespace expression between React Native Buttons is rendered as a
// raw string child of View and crashes Fabric: "Text strings must be rendered
// within a <Text> component." Keep label spacing inside <T>/<Text> only.
test("native action rows do not render standalone JSX whitespace strings", () => {
  for (const path of [
    "src/screens/OrderScreens.tsx",
    "src/screens/AccountScreens.tsx",
  ]) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(
      source,
      /\)\}\s*\{" "\}\s*\{/,
      path + " contains raw whitespace between conditional native controls",
    );
  }
});
