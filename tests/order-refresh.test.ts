import test from "node:test";
import assert from "node:assert/strict";
import {orderNeedsLiveRefresh} from "../src/domain/order-refresh";

test("poll active orders, not cancelled or delivered orders",()=>{
  assert.equal(orderNeedsLiveRefresh(undefined),true);
  assert.equal(orderNeedsLiveRefresh("awaiting_confirmation"),true);
  assert.equal(orderNeedsLiveRefresh("confirmed"),true);
  assert.equal(orderNeedsLiveRefresh("completed"),false);
  assert.equal(orderNeedsLiveRefresh("cancelled"),false);
});
