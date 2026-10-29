import test from "node:test";
import assert from "node:assert/strict";
import {appendUniqueShops} from "../src/domain/shop-directory";

test("more than 100 stores remain accessible across pages without duplicate cards",()=>{
  const all=Array.from({length:113},(_,index)=>({id:String(index),name:"Loja "+index}));
  let loaded:typeof all=[];
  for(let offset=0;offset<all.length;offset+=24)
    loaded=appendUniqueShops(loaded,all.slice(offset,offset+24));
  assert.equal(loaded.length,113);
  assert.equal(loaded.at(-1)?.id,'112');
  assert.equal(appendUniqueShops(loaded,[all[3]]).length,113);
});
