import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/components/AdsCarousel.tsx", "utf8");

test("native ad carousel supports touch paging and keeps 8.5 second autoplay", () => {
  assert.match(source, /<FlatList/);
  assert.match(source, /\bhorizontal\s*\n/);
  assert.match(source, /\bpagingEnabled\s*\n/);
  assert.match(source, /\bnestedScrollEnabled\s*\n/);
  assert.match(source, /\bscrollEnabled=\{campaigns\.length > 1\}/);
  assert.match(source, /\}, 8500\)/);
  assert.match(source, /AppState\.currentState === "active"/);
  assert.match(source, /onScroll=\{\(event\) =>/);
  assert.match(source, /onPress=\{\(\) => goTo\(i\)\}/);
});

test("an ad impression is still counted only when the active slide is visible", () => {
  assert.match(source, /const ad = campaigns\[index % campaigns\.length\]/);
  assert.match(source, /seen\.current\.has\(ad\.id\)/);
  assert.match(source, /visibleWidth \* visibleHeight >= width \* height \* 0\.5/);
  assert.match(source, /"ads\/" \+ ad\.id \+ "\/impression"/);
});

test("one or zero ads do not enable pagination", () => {
  assert.match(source, /if \(!ad\) return null;/);
  assert.match(source, /campaigns\.length > 1 && \(/);
  assert.match(source, /campaigns\.length < 2/);
});
