import test from "node:test";
import assert from "node:assert/strict";
import { formatBRLInput, parseBRLInput } from "../src/domain/money-input";

test("pt-BR amounts keep cents and thousands without floating point rounding",()=>{
  assert.equal(parseBRLInput("5,50"),550);
  assert.equal(parseBRLInput("19,90"),1990);
  assert.equal(parseBRLInput("1.234"),123400);
  assert.equal(parseBRLInput("1.234,56"),123456);
  assert.equal(parseBRLInput("19.90"),1990);
  assert.equal(parseBRLInput("0,05"),5);
  assert.equal(parseBRLInput("R$ 25,75"),2575);
  assert.equal(formatBRLInput(123456),"1234,56");
});

test("ambiguous or over-limit input is rejected, not silently repriced",()=>{
  for(const input of ["","1.234.56","19,999","1,2,3","R$ -1","-1,00","1.23.4","abc"])
    assert.equal(parseBRLInput(input),null,input);
  assert.equal(parseBRLInput("100.000,01"),null);
  assert.equal(parseBRLInput("10.000,01",1_000_000),null);
  assert.equal(parseBRLInput("0,00"),0);
});
