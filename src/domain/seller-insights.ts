/** Daily seller insights are based on order creation dates in São Paulo. */
export type DailySale={day:string;orders:number;amount_cents:number|string};
export type DailyPoint={day:string;orders:number;amount_cents:number};
export type SalesPeriod=7|30|90;

const dayPattern=/^\d{4}-\d{2}-\d{2}$/;

export function saoPauloToday(now:Date=new Date()):string {
  const parts=new Intl.DateTimeFormat('en-US',{
    timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',
  }).formatToParts(now);
  const part=(type:string)=>parts.find(item=>item.type===type)?.value??'';
  return part('year')+'-'+part('month')+'-'+part('day');
}

function utcDay(value:string):Date {
  if(!dayPattern.test(value))throw new Error('Dia inválido.');
  const date=new Date(value+'T12:00:00.000Z');
  if(Number.isNaN(date.valueOf())||date.toISOString().slice(0,10)!==value)
    throw new Error('Dia inválido.');
  return date;
}

export function buildDailySalesSeries(
  daily:readonly DailySale[],
  period:SalesPeriod,
  today:string,
):DailyPoint[] {
  const last=utcDay(today);
  const totals=new Map<string,DailyPoint>();
  for(const item of daily){
    const day=String(item.day).slice(0,10);
    if(!dayPattern.test(day))continue;
    const orders=Number(item.orders);
    const cents=Number(item.amount_cents);
    if(!Number.isSafeInteger(orders)||orders<0||!Number.isSafeInteger(cents)||cents<0)continue;
    const existing=totals.get(day);
    totals.set(day,{day,orders:(existing?.orders??0)+orders,amount_cents:(existing?.amount_cents??0)+cents});
  }
  const points:DailyPoint[]=[];
  for(let i=period-1;i>=0;i--){
    const date=new Date(last);
    date.setUTCDate(date.getUTCDate()-i);
    const day=date.toISOString().slice(0,10);
    points.push(totals.get(day)??{day,orders:0,amount_cents:0});
  }
  return points;
}

export function dayLabel(day:string):string {
  return day.slice(8,10)+'/'+day.slice(5,7);
}

export function dailyBarHeight(orders:number,maximum:number):number {
  if(orders<=0||maximum<=0)return 2;
  return Math.max(7,Math.round(orders/maximum*90));
}
