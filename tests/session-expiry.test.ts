import test from "node:test";
import assert from "node:assert/strict";
import {expirationBelongsToCurrentLogin} from "../src/domain/session-expiry";
import {ApiClient,ApiError} from "../src/api";

test("a late 401 from a previous account cannot sign out a newer login",()=>{
  const older="a".repeat(64),newer="b".repeat(64);
  assert.equal(expirationBelongsToCurrentLogin(older,older),true);
  assert.equal(expirationBelongsToCurrentLogin(older,newer),false);
  assert.equal(expirationBelongsToCurrentLogin(older,null),false);
  assert.equal(expirationBelongsToCurrentLogin(null,newer),false);
});

test("expired server credentials trigger logout, not HTTP 403 or transient connection failures",async()=>{
  const original=globalThis.fetch;
  const active="a".repeat(64);
  let expired=0,calls=0;
  globalThis.fetch=async()=>{
    calls++;
    if(calls===1)return Response.json({error:"Sua sessão expirou."},{status:401});
    if(calls===2)return Response.json({error:"Não autorizado para esta loja."},{status:403});
    throw new TypeError("Network request failed");
  };
  const api=new ApiClient("https://condovery.example",active,()=>expired++);
  try{
    await assert.rejects(()=>api.request("orders"),(e:unknown)=>{
      assert.ok(e instanceof ApiError);assert.equal(e.status,401);return true;
    });
    assert.equal(expired,1);
    await assert.rejects(()=>api.request("shops/mine"),(e:unknown)=>{
      assert.ok(e instanceof ApiError);assert.equal(e.status,403);return true;
    });
    assert.equal(expired,1);
    await assert.rejects(()=>api.request("orders"),/Verifique sua conexão/);
    assert.equal(expired,1);
    assert.equal(calls,3);
  }finally{globalThis.fetch=original;}
});

test("an invalid login password never expires an existing native session",async()=>{
  const original=globalThis.fetch;
  let expired=0;
  globalThis.fetch=async()=>Response.json({error:"Senha inválida"},{status:401});
  try{
    const api=new ApiClient("https://condovery.example","a".repeat(64),()=>expired++);
    await assert.rejects(()=>api.request("mobile/auth/login","POST",{email:"a@b.com",password:"wrong"},true),ApiError);
    assert.equal(expired,0);
  }finally{globalThis.fetch=original;}
});
