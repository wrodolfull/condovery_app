import test from "node:test";
import assert from "node:assert/strict";
import {canDiscardCheckoutAttempt,shouldCheckShopAvailability} from "../src/domain/checkout-recovery";

test("an uncertain order must retry its original POST before checking whether the store closed",()=>{
  assert.equal(shouldCheckShopAvailability(null),true);
  assert.equal(shouldCheckShopAvailability({payload:{client_order_key:"same-key"}}),false);
});
test("timeout, lost connection, server error or expired session preserve pending order",()=>{
  for(const status of [null,0,401,500,502,503,504])
    assert.equal(canDiscardCheckoutAttempt(status),false);
});
test("definitive API refusal can safely unlock the cart",()=>{
  for(const status of [400,403,404,409,422])
    assert.equal(canDiscardCheckoutAttempt(status),true);
});
