import React, {useMemo, useRef, useState} from "react";
import {Pressable, ScrollView, View} from "react-native";
import {Card, T} from "../ui";
import {colors, money} from "../theme";
import {
  buildDailySalesSeries, dailyBarHeight, dayLabel, saoPauloToday,
  type DailySale, type SalesPeriod,
} from "../domain/seller-insights";

/** The same daily completed-order data as the seller's web dashboard. */
export function DailySalesChart({daily,period}:{daily:DailySale[];period:SalesPeriod}) {
  const points=useMemo(()=>buildDailySalesSeries(daily,period,saoPauloToday()),[daily,period]);
  const [selectedDay,setSelectedDay]=useState<string|null>(null);
  const chartRef=useRef<ScrollView>(null);
  const scrolled=useRef(false);
  const selected=points.find(point=>point.day===selectedDay)??points[points.length-1];
  const maximum=Math.max(0,...points.map(point=>point.orders));
  const total=points.reduce((sum,point)=>sum+point.orders,0);
  const barWidth=period===7?32:period===30?21:17;

  return <Card style={{gap:12}}>
    <T heading style={{fontSize:19}}>Evolução de pedidos concluídos</T>
    <T style={{color:colors.muted,fontSize:12}}>
      Quantidade de pedidos por dia · últimos {period} dias
    </T>
    {total===0?(
      <View style={{paddingVertical:22,alignItems:"center"}}>
        <T style={{color:colors.muted,textAlign:"center"}}>
          Ainda não há pedidos concluídos neste período.
        </T>
      </View>
    ):(
      <>
        <ScrollView
          ref={chartRef}
          horizontal
          showsHorizontalScrollIndicator
          accessibilityLabel="Gráfico de pedidos concluídos por dia"
          contentContainerStyle={{alignItems:"flex-end",gap:5,paddingBottom:6}}
          onContentSizeChange={()=>{
            if(!scrolled.current){
              scrolled.current=true;
              chartRef.current?.scrollToEnd({animated:false});
            }
          }}
        >
          {points.map((point,index)=>{
            const selectedBar=selected?.day===point.day;
            return <Pressable
              key={point.day}
              accessibilityRole="button"
              accessibilityLabel={dayLabel(point.day)+": "+point.orders+" pedidos concluídos, "+money(point.amount_cents)}
              accessibilityState={{selected:selectedBar}}
              onPress={()=>setSelectedDay(point.day)}
              style={{alignItems:"center",width:barWidth+9,gap:7}}
            >
              <View style={{height:96,justifyContent:"flex-end",alignItems:"center"}}>
                <View style={{
                  height:dailyBarHeight(point.orders,maximum),
                  width:barWidth,
                  borderRadius:4,
                  backgroundColor:selectedBar?colors.orange:point.orders?colors.ink:colors.line,
                }}/>
              </View>
              <T style={{fontSize:10,color:selectedBar?colors.ink:colors.muted}}>
                {(index%7===0||index===points.length-1||period===7)?dayLabel(point.day):"  "}
              </T>
            </Pressable>;
          })}
        </ScrollView>
        <View style={{padding:11,backgroundColor:colors.bg,borderRadius:12,gap:3}}>
          <T bold>{selected?dayLabel(selected.day):"—"} · {selected?.orders??0} pedidos concluídos</T>
          <T>{money(selected?.amount_cents??0)} em pedidos concluídos</T>
        </View>
      </>
    )}
    <T style={{fontSize:11,color:colors.muted}}>
      Os valores consideram a data em que o pedido foi registrado e seu status atual.
      Não representam pagamentos comprovados ou receita conciliada.
    </T>
  </Card>;
}
