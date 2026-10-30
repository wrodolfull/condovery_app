import test from "node:test";
import assert from "node:assert/strict";
import { PushRegistrationGate } from "../src/domain/push-registration";

test("concurrent registration triggers share one network operation", async () => {
  let requests = 0;
  let complete!: () => void;
  const gate = new PushRegistrationGate(() => 1000);
  const action = () => {
    requests++;
    return new Promise<void>(resolve => { complete = resolve; });
  };
  const a = gate.run(action);
  const b = gate.run(action, true);
  assert.equal(requests, 1);
  complete();
  await Promise.all([a, b]);
  assert.equal(requests, 1);
});

test("foreground events throttle success but refresh after interval", async () => {
  let time = 0, calls = 0;
  const gate = new PushRegistrationGate(() => time, 1000, 100);
  const action = async () => { calls++; };
  await gate.run(action);
  time = 999;
  await gate.run(action);
  assert.equal(calls, 1);
  time = 1000;
  await gate.run(action);
  assert.equal(calls, 2);
});

test("errors are backed off and forced token refresh can retry", async () => {
  let time = 0, calls = 0;
  const gate = new PushRegistrationGate(() => time, 1000, 100);
  const action = async () => { calls++; if (calls === 1) throw new Error("offline"); };
  await assert.rejects(gate.run(action), /offline/);
  time = 50;
  await gate.run(action);
  assert.equal(calls, 1);
  await gate.run(action, true);
  assert.equal(calls, 2);
});

test("session changes get independent gate", async () => {
  let calls = 0;
  const a = new PushRegistrationGate(() => 0);
  const b = new PushRegistrationGate(() => 0);
  await a.run(async () => { calls++; });
  await b.run(async () => { calls++; });
  assert.equal(calls, 2);
});
