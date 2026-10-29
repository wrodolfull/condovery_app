import test from "node:test";
import assert from "node:assert/strict";
import {buildDailySalesSeries,dayLabel,dailyBarHeight,saoPauloToday} from "../src/domain/seller-insights";

test("the daily chart fills missing days, without inventing sales",()=>{
  const points=buildDailySalesSeries([
    {day:"2026-10-27",orders:3,amount_cents:"15500"},
    {day:"2026-10-29T00:00:00.000Z",orders:2,amount_cents:"7500"},
  ],7,"2026-10-29");
  assert.equal(points.length,7);
  assert.deepEqual(points[0],{day:"2026-10-23",orders:0,amount_cents:0});
  assert.deepEqual(points[4],{day:"2026-10-27",orders:3,amount_cents:15500});
  assert.deepEqual(points[6],{day:"2026-10-29",orders:2,amount_cents:7500});
  assert.equal(points.reduce((sum,item)=>sum+item.orders,0),5);
});

test("time zone uses calendar day in Sao Paulo, even near midnight UTC",()=>{
  assert.equal(saoPauloToday(new Date("2026-10-30T01:30:00.000Z")),"2026-10-29");
  assert.equal(saoPauloToday(new Date("2026-10-30T03:01:00.000Z")),"2026-10-30");
});

test("30 and 90 day periods always have complete consecutive calendars",()=>{
  for(const days of [30,90] as const){
    const points=buildDailySalesSeries([{day:"2026-01-01",orders:1,amount_cents:"1000"}],days,"2026-03-01");
    assert.equal(points.length,days);
    assert.equal(points[days-1].day,"2026-03-01");
    assert.equal(new Set(points.map(p=>p.day)).size,days);
    assert.equal(points.reduce((sum,p)=>sum+p.orders,0),days===90?1:0);
  }
});

test("reject invalid sales rows and days outside the selected interval",()=>{
  const points=buildDailySalesSeries([
    {day:"2026-10-22",orders:7,amount_cents:3000},
    {day:"2026-10-27",orders:-1,amount_cents:100},
    {day:"2026-10-27",orders:2,amount_cents:-10},
    {day:"2026-10-27",orders:2,amount_cents:1200},
    {day:"bad",orders:5,amount_cents:500},
    {day:"2026-11-01",orders:8,amount_cents:800},
  ],7,"2026-10-29");
  assert.equal(points.reduce((sum,p)=>sum+p.orders,0),2);
  assert.equal(points.find(p=>p.day==="2026-10-27")?.amount_cents,1200);
  assert.equal(dayLabel("2026-10-27"),"27/10");
  assert.throws(()=>buildDailySalesSeries([],7,"2026-02-30"));
});

test("bars scale to order counts, including zero orders",()=>{
  assert.equal(dailyBarHeight(0,5),2);
  assert.equal(dailyBarHeight(1,10),9);
  assert.equal(dailyBarHeight(10,10),90);
  assert.equal(dailyBarHeight(5,0),2);
});
