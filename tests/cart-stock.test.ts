import test from "node:test";
import assert from "node:assert/strict";
import {unitsInCart,remainingToAdd,maxLineQuantity} from "../src/domain/cart-stock";
const lines=[
  {product:{id:"bolo"},quantity:2},
  {product:{id:"bolo"},quantity:1},
  {product:{id:"suco"},quantity:8},
];
test("limita todas as personalizações do mesmo produto pelo estoque",()=>{
  assert.equal(unitsInCart(lines,"bolo"),3);
  assert.equal(remainingToAdd(4,lines,"bolo"),1);
  assert.equal(remainingToAdd(3,lines,"bolo"),0);
  assert.equal(remainingToAdd(2,lines,"bolo"),0);
});
test("limite por linha considera as quantidades de outras linhas",()=>{
  assert.equal(maxLineQuantity(4,lines,"bolo",0),3);
  assert.equal(maxLineQuantity(3,lines,"bolo",1),1);
  assert.equal(maxLineQuantity(1,lines,"bolo",0),0);
  assert.equal(maxLineQuantity(99,lines,"bolo",0),30);
});
test("sem estoque informado há limite por linha, não por produto",()=>{
  assert.equal(remainingToAdd(null,lines,"bolo"),null);
  assert.equal(maxLineQuantity(null,lines,"bolo",0),30);
});
