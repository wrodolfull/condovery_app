import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Pressable, ScrollView, Switch, View } from "react-native";
import { randomUUID } from "expo-crypto";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../auth";
import { useMarket } from "../market";
import { Button, Card, Empty, ErrorBox, Field, Loading, Picture, Screen, T } from "../ui";
import { money, colors } from "../theme";
import { uploadPicture } from "../upload";
import { allowedPaymentMethods, PAYMENT_LABELS, type PaymentMethod } from "../domain/payment-methods";
import type { Product, Category, Order } from "../types";
import type { OptionGroup } from "../domain/orders";
import { sellerItemDetails, sellerOrderDetails } from "../domain/seller-orders";
import { formatBRLInput, parseBRLInput } from "../domain/money-input";
import { mergeLatestOrders, orderHistoryPath, type OrdersPage } from "../domain/order-pagination";

type Shop = {
  id:string; name:string; status:string; description:string; whatsapp:string;
  logo_image:string|null; cover_image:string|null; is_open:boolean;
  delivery_enabled:boolean; pickup_enabled:boolean; delivery_fee_cents:number;
  lead_time:string; pickup_instructions:string; payment_methods:PaymentMethod[];
};
type ShopForm = {
  name:string; description:string; whatsapp:string; logo_image:string;
  cover_image:string; is_open:boolean; delivery_enabled:boolean; pickup_enabled:boolean;
  delivery_fee_cents:string; lead_time:string; pickup_instructions:string;
  payment_methods:PaymentMethod[];
};
const defaultShop:ShopForm = {
  name:"",description:"",whatsapp:"",logo_image:"",cover_image:"",is_open:true,
  delivery_enabled:true,pickup_enabled:true,delivery_fee_cents:"0",
  lead_time:"",pickup_instructions:"",payment_methods:["pix","credit_card","debit_card","cash"],
};
function fromShop(s:Shop):ShopForm {
  return {name:s.name,description:s.description,whatsapp:s.whatsapp,
    logo_image:s.logo_image??"",cover_image:s.cover_image??"",is_open:s.is_open,
    delivery_enabled:s.delivery_enabled,pickup_enabled:s.pickup_enabled,
    delivery_fee_cents:((s.delivery_fee_cents??0)/100).toFixed(2).replace(".",","),lead_time:s.lead_time??"",
    pickup_instructions:s.pickup_instructions??"",
    payment_methods:allowedPaymentMethods(s.payment_methods)};
}
type Review={id:string;order_code:number;rating:number;description:string;status:string};
type Fair={id:string;title:string;starts_at:string;ends_at:string};
type FairApplication={fair_id:string;product_id:string;status:string};
type Insight={summary:{orders_total:number;awaiting:number;completed:number;completed_cents:number;average_cents:number};topProducts:{product_id:string;name:string;units:number}[]};
const tabs=["Pedidos","Produtos","Avaliações","Minha loja","Resultados","Feiras"] as const;
type Tab=typeof tabs[number];
const line={backgroundColor:"#FFFCF8",borderColor:"#E9E4DB",borderWidth:1,borderRadius:14,padding:14,gap:9} as const;

export default function SellerPanel() {
  const {api}=useAuth();
  const market=useMarket();
  const [tab,setTab]=useState<Tab>("Pedidos");
  const [shop,setShop]=useState<Shop|null>(null);
  const [products,setProducts]=useState<Product[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [ordersCursor,setOrdersCursor]=useState<string|null>(null);
  const [loadingOlder,setLoadingOlder]=useState(false);
  const historyLoaded=useRef(false);
  const [ordersLoading,setOrdersLoading]=useState(false);
  const [ordersError,setOrdersError]=useState("");
  const [lastOrdersUpdate,setLastOrdersUpdate]=useState<Date|null>(null);
  const [reviews,setReviews]=useState<Review[]>([]);
  const [categories,setCategories]=useState<Category[]>([]);
  const [insight,setInsight]=useState<Insight|null>(null);
  const [fairs,setFairs]=useState<Fair[]>([]);
  const [applications,setApplications]=useState<FairApplication[]>([]);
  const [fairProducts,setFairProducts]=useState<{id:string;name:string}[]>([]);
  const [period,setPeriod]=useState<7|30|90>(30);
  const [noticeTitle,setNoticeTitle]=useState(""),[noticeBody,setNoticeBody]=useState("");
  const [deletion,setDeletion]=useState("");
  const [form,setForm]=useState<ShopForm>(defaultShop);
  const [optionPriceDrafts,setOptionPriceDrafts]=useState<Record<string,string>>({});
  const [productForm,setProductForm]=useState<{
    id:string;name:string;description:string;category_id:string;price:string;promo:string;
    stock:string;image_url:string;visibility:Product["visibility"];lead_time:string;option_groups:OptionGroup[];
  }|null>(null);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [error,setError]=useState(""),[success,setSuccess]=useState("");
  const updateForm=(key:keyof ShopForm,value:ShopForm[keyof ShopForm])=>
    setForm(v=>({...v,[key]:value}));
  const reload=useCallback(async()=>{
    setError("");
    try {
      const result=await api.request<{shop:Shop|null;products:Product[]}>("shops/mine");
      setShop(result.shop);setProducts(result.products);
      if(result.shop)setForm(fromShop(result.shop));
      const home=await api.request<{categories:Category[]}>("home");
      setCategories(home.categories);
    }catch(e){setError((e as Error).message);}
    finally{setLoading(false);}
  },[api]);
  useFocusEffect(useCallback(()=>{void reload();},[reload]));
  // The seller sees fresh orders while this tab is active, without losing
  // historical pages they explicitly loaded. Cursor remains anchored to the
  // oldest loaded order when new orders arrive during polling.
  const refreshLatestOrders=useCallback(async(reset=false)=>{
    const r=await api.request<OrdersPage>(orderHistoryPath("seller",""));
    if(reset||!historyLoaded.current){
      setOrders(r.orders);
      setOrdersCursor(r.nextCursor);
    }else{
      setOrders(previous=>mergeLatestOrders(r.orders,previous));
    }
    setOrdersError("");
    setLastOrdersUpdate(new Date());
  },[api]);
  useFocusEffect(useCallback(()=>{
    if(tab!=="Pedidos"||!shop?.id)return;
    let active=true;
    historyLoaded.current=false;
    setOrdersLoading(true);setOrdersError("");
    const refresh=async(initial:boolean)=>{
      try{
        const page=await api.request<OrdersPage>(orderHistoryPath("seller",""));
        if(!active)return;
        if(initial||!historyLoaded.current){
          setOrders(page.orders);setOrdersCursor(page.nextCursor);
        }else setOrders(previous=>mergeLatestOrders(page.orders,previous));
        setOrdersError("");setLastOrdersUpdate(new Date());
      }catch(e){if(active)setOrdersError((e as Error).message);}
      finally{if(active&&initial)setOrdersLoading(false);}
    };
    void refresh(true);
    const timer=setInterval(()=>{if(AppState.currentState==="active")void refresh(false);},20000);
    const subscription=AppState.addEventListener("change",state=>{
      if(state==="active")void refresh(false);
    });
    return ()=>{active=false;clearInterval(timer);subscription.remove();};
  },[api,shop?.id,tab]));
  const loadOlderOrders=async()=>{
    if(!ordersCursor||loadingOlder)return;
    setLoadingOlder(true);
    try{
      const page=await api.request<OrdersPage>(orderHistoryPath("seller","",ordersCursor));
      historyLoaded.current=true;
      setOrders(previous=>{
        const seen=new Set(previous.map(o=>o.id));
        return [...previous,...page.orders.filter(o=>!seen.has(o.id))];
      });
      setOrdersCursor(page.nextCursor);
      setOrdersError("");
    }catch(e){setOrdersError((e as Error).message);}
    finally{setLoadingOlder(false);}
  };
  useEffect(()=>{
    if(!shop)return;
    let active=true;
    const task=async()=>{
      try {
        if(tab==="Avaliações"){
          const r=await api.request<{reviews:Review[]}>("shops/mine/reviews");
          if(active)setReviews(r.reviews);
        }else if(tab==="Resultados"){
          const r=await api.request<Insight>("seller/insights?days="+period);
          if(active)setInsight(r);
        }else if(tab==="Feiras"){
          const r=await api.request<{fairs:Fair[];products:{id:string;name:string}[];applications:FairApplication[]}>("fairs/seller");
          if(active){setFairs(r.fairs);setFairProducts(r.products);setApplications(r.applications);}
        }
      }catch(e){if(active)setError((e as Error).message);}
    };
    void task();return()=>{active=false;};
  },[api,shop?.id,tab,period]);
  async function run(task:()=>Promise<unknown>) {
    if(busy)return;
    setBusy(true);setError("");setSuccess("");
    try {await task();await reload();setSuccess("Alterações salvas.");}
    catch(e){setError((e as Error).message);}
    finally{setBusy(false);}
  }
  const newProduct=()=>{setOptionPriceDrafts({});setProductForm({id:"",name:"",description:"",category_id:categories[0]?.id??"",
    price:"",promo:"",stock:"",image_url:"",visibility:"available",lead_time:"",option_groups:[]});};
  const editProduct=(p:Product)=>{
    setOptionPriceDrafts(Object.fromEntries((p.option_groups??[]).flatMap(group=>
      group.options.map(option=>[option.id,formatBRLInput(option.price_cents)]))));
    setProductForm({id:p.id,name:p.name,description:p.description,
    category_id:p.category_id,price:formatBRLInput(p.price_cents),
    promo:p.promo_price_cents==null?"":formatBRLInput(p.promo_price_cents),
    stock:p.stock==null?"":String(p.stock),image_url:p.image_url??"",
    visibility:p.visibility,lead_time:p.lead_time??"",option_groups:p.option_groups??[]});};

  const uploadEditorImage = async (target:"product"|"logo_image"|"cover_image") => {
    setBusy(true);setError("");
    try {
      const url=await uploadPicture(api,target==="product"?"product":"shop");
      if(!url)return;
      if(target==="product")setProductForm(p=>p?{...p,image_url:url}:p);
      else updateForm(target,url);
    }catch(e){setError((e as Error).message);}
    finally{setBusy(false);}
  };
  const saveProduct=()=>run(async()=>{
    if(!productForm) return;
    const p=productForm;
    const price=parseBRLInput(p.price);
    const promo=p.promo.trim()?parseBRLInput(p.promo):null;
    if(!p.name.trim()||!p.category_id||price===null||price<1)
      throw new Error("Preencha nome, categoria e preço válido em reais (ex.: 19,90).");
    if(p.promo.trim()&&(promo===null||promo<1||promo>=price))
      throw new Error("O preço promocional deve ser válido e menor que o original.");
    if(p.stock.trim()&&(!/^\d+$/.test(p.stock)||Number(p.stock)>100000))
      throw new Error("Informe um estoque inteiro entre 0 e 100.000.");
    const option_groups=p.option_groups.map(group=>({...group,
      options:group.options.map(option=>{
        const amount=parseBRLInput(optionPriceDrafts[option.id]??formatBRLInput(option.price_cents),1_000_000);
        if(amount===null)throw new Error("Informe um preço adicional válido em reais (ex.: 2,50).");
        return {...option,price_cents:amount};
      }),
    }));
    const data={name:p.name,description:p.description,category_id:p.category_id,
      price_cents:price,promo_price_cents:promo,
      stock:p.stock.trim()?Number(p.stock):null,image_url:p.image_url||null,
      visibility:p.visibility,lead_time:p.lead_time,option_groups};
    await api.request(p.id?"products/"+p.id:"products",p.id?"PATCH":"POST",data);
    setProductForm(null);
  });
  return <Screen title="Painel do vendedor" back>
    <T heading style={{fontSize:27}}>Minha loja</T>
    <T style={{color:colors.muted}}>Gerencie seus produtos, pedidos e resultados no aplicativo.</T>
    <ErrorBox message={error}/>
    {!!success&&<T style={{color:colors.green}}>{success}</T>}
    {loading?<Loading/>:!shop?<Card>
      <T heading style={{fontSize:22}}>Comece a vender</T>
      <T>Cadastre sua loja para vender aos vizinhos do condomínio.</T>
      <Field label="Nome da loja" value={form.name} onChangeText={v=>updateForm("name",v)}/>
      <Field label="Descrição" value={form.description} onChangeText={v=>updateForm("description",v)} multiline/>
      <Field label="WhatsApp com DDD" value={form.whatsapp} onChangeText={v=>updateForm("whatsapp",v)} keyboardType="phone-pad"/>
      <Button title="Criar minha loja" busy={busy} onPress={()=>void run(async()=>{
        await api.request("shops/mine","POST",{name:form.name,description:form.description,
          whatsapp:form.whatsapp,accept_guidelines:true});
      })}/>
      <T style={{color:colors.muted,fontSize:12}}>Ao criar sua loja você concorda com as diretrizes de vendas da comunidade.</T>
    </Card>:<>
      <View style={line}>
        <T bold style={{fontSize:19}}>{shop.name}</T>
        <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
          <T bold>Loja aberta</T>
          <Switch value={shop.is_open} disabled={busy||shop.status!=="approved"}
            onValueChange={is_open=>void run(async()=>{
              await api.request("shops/mine/status","PATCH",{is_open});
              await market.home.reload();
            })}/>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>
        {tabs.map(t=><Pressable key={t} onPress={()=>{setTab(t);setError("");setSuccess("");setProductForm(null);}}
          style={{paddingHorizontal:15,paddingVertical:12,borderRadius:22,backgroundColor:t===tab?colors.ink:"#ECE8DF"}}>
          <T bold style={{color:t===tab?"white":colors.ink}}>{t}</T>
        </Pressable>)}
      </ScrollView>
      {tab==="Pedidos"&&<View style={{gap:12}}>
        <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <T style={{color:colors.muted,fontSize:12}}>
            {lastOrdersUpdate?"Atualizado às "+lastOrdersUpdate.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}):"Aguardando pedidos"}
          </T>
          <Button title="Atualizar" secondary busy={ordersLoading} onPress={()=>{
            setOrdersLoading(true);
            void refreshLatestOrders()
              .catch(e=>setOrdersError((e as Error).message))
              .finally(()=>setOrdersLoading(false));
          }}/>
        </View>
        {!!ordersError&&<ErrorBox message={"Não foi possível atualizar os pedidos: "+ordersError}/>}
        {ordersLoading&&!lastOrdersUpdate?<Loading/>:
          !ordersError&&!orders.length?<Empty title="Nenhum pedido recebido" body="Os pedidos da sua loja aparecerão aqui."/>:
          orders.map(o=><View key={o.id} style={line}>
            <T bold style={{fontSize:17}}>Pedido #{o.code}</T>
            <T bold>{o.status==="awaiting_confirmation"?"Aguardando confirmação":o.status==="confirmed"?"Confirmado":o.status==="completed"?"Concluído":"Cancelado"}</T>
            {sellerOrderDetails(o).map((detail,i)=><T key={"detail-"+i}>{detail}</T>)}
            <T bold>Itens do pedido</T>
            {o.items.map((item,i)=><View key={i} style={{gap:4,paddingVertical:7,borderTopWidth:1,borderColor:colors.line}}>
              <T bold>{item.quantity} × {item.name} · {money(item.unit_price_cents*item.quantity)}</T>
              {sellerItemDetails(item).map((detail,j)=><T key={j} style={{color:colors.muted}}>{detail}</T>)}
            </View>)}
            <View style={{borderTopWidth:1,borderColor:colors.line,paddingTop:9,gap:4}}>
              <T>Subtotal: {money(o.subtotal_cents??o.total_cents)}</T>
              {o.fulfillment==="delivery"&&<T>Taxa de entrega: {money(o.delivery_fee_cents??0)}</T>}
              <T bold>Total: {money(o.total_cents)}</T>
            </View>
            {o.status==="awaiting_confirmation"&&<Button title="Confirmar pedido" busy={busy} onPress={()=>void run(async()=>{
              await api.request("orders/"+o.id,"PATCH",{status:"confirmed"});
              await refreshLatestOrders();
            })}/>}
            {o.status==="confirmed"&&<Button title="Concluir pedido" busy={busy} onPress={()=>void run(async()=>{
              await api.request("orders/"+o.id,"PATCH",{status:"completed"});
              await refreshLatestOrders();
            })}/>}
            {["awaiting_confirmation","confirmed"].includes(o.status)&&
              <Button title="Cancelar pedido" secondary busy={busy} onPress={()=>Alert.alert("Cancelar pedido?","Esta ação altera o status do pedido.",[
                {text:"Voltar",style:"cancel"},
                {text:"Cancelar pedido",style:"destructive",onPress:()=>void run(async()=>{
                  await api.request("orders/"+o.id,"PATCH",{status:"cancelled"});
                  await refreshLatestOrders();
                })}])}/>}
          </View>)}
        {!!ordersCursor&&<Button title={loadingOlder?"Carregando pedidos...":"Ver pedidos anteriores"}
          disabled={loadingOlder||busy} secondary onPress={()=>void loadOlderOrders()}/>}
      </View>}
      {tab==="Produtos"&&(productForm?<Card>
        <T heading style={{fontSize:21}}>{productForm.id?"Editar produto":"Novo produto"}</T>
        <Field label="Nome" value={productForm.name} onChangeText={v=>setProductForm(p=>p?{...p,name:v}:p)}/>
        <Field label="Descrição" value={productForm.description} onChangeText={v=>setProductForm(p=>p?{...p,description:v}:p)} multiline/>
        <T bold>Categoria</T>
        <View style={{flexDirection:"row",flexWrap:"wrap",gap:7}}>
          {categories.map(c=><Pressable key={c.id} style={{padding:10,borderRadius:12,backgroundColor:c.id===productForm.category_id?colors.yellow:"white"}}
            onPress={()=>setProductForm(p=>p?{...p,category_id:c.id}:p)}><T>{c.name}</T></Pressable>)}
        </View>
        <Field label="Preço (R$)" keyboardType="decimal-pad" value={productForm.price} onChangeText={v=>setProductForm(p=>p?{...p,price:v}:p)}/>
        <Field label="Preço promocional (R$)" keyboardType="decimal-pad" value={productForm.promo} onChangeText={v=>setProductForm(p=>p?{...p,promo:v}:p)}/>
        <Field label="Estoque (vazio = ilimitado)" keyboardType="number-pad" value={productForm.stock} onChangeText={v=>setProductForm(p=>p?{...p,stock:v}:p)}/>
        <Field label="Prazo de preparo" value={productForm.lead_time} onChangeText={v=>setProductForm(p=>p?{...p,lead_time:v}:p)}/>
        <Picture path={productForm.image_url} label="Foto do produto" height={170}/>
        <Button title="Selecionar foto" secondary busy={busy} onPress={()=>void uploadEditorImage("product")}/>
        <T heading style={{fontSize:19}}>Personalização do produto</T>
        <T style={{color:colors.muted}}>Adicione grupos como tamanho, sabores ou adicionais, com preços opcionais.</T>
        {productForm.option_groups.map((g,gi)=><View key={g.id} style={line}>
          <Field label={"Nome do grupo "+(gi+1)} value={g.name}
            onChangeText={v=>setProductForm(p=>p?{...p,option_groups:p.option_groups.map(x=>x.id===g.id?{...x,name:v}:x)}:p)}/>
          <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
            <T>Escolha obrigatória</T>
            <Switch value={g.required} onValueChange={v=>setProductForm(p=>p?{...p,option_groups:p.option_groups.map(x=>x.id===g.id?{...x,required:v}:x)}:p)}/>
          </View>
          <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
            <T>Permitir várias escolhas</T>
            <Switch value={g.multiple} onValueChange={v=>setProductForm(p=>p?{...p,option_groups:p.option_groups.map(x=>x.id===g.id?{...x,multiple:v}:x)}:p)}/>
          </View>
          {g.options.map((o,oi)=><View key={o.id} style={{gap:8}}>
            <Field label={"Opção "+(oi+1)} value={o.name} onChangeText={v=>setProductForm(p=>p?{
              ...p,option_groups:p.option_groups.map(x=>x.id===g.id?{...x,options:x.options.map(a=>a.id===o.id?{...a,name:v}:a)}:x)
            }:p)}/>
            <Field label="Preço adicional (R$)" keyboardType="decimal-pad"
              value={optionPriceDrafts[o.id]??formatBRLInput(o.price_cents)}
              onChangeText={v=>setOptionPriceDrafts(previous=>({...previous,[o.id]:v}))}/>
            <Button title="Remover opção" secondary disabled={g.options.length<=1}
              onPress={()=>setProductForm(p=>p?{...p,
                option_groups:p.option_groups.map(x=>x.id===g.id?{...x,options:x.options.filter(a=>a.id!==o.id)}:x)
              }:p)}/>
          </View>)}
          <Button title="Adicionar opção" secondary disabled={g.options.length>=15}
            onPress={()=>setProductForm(p=>p?{...p,
              option_groups:p.option_groups.map(x=>x.id===g.id?{...x,
                options:[...x.options,{id:randomUUID(),name:"",price_cents:0}]}:x)
            }:p)}/>
          <Button title="Remover grupo" secondary onPress={()=>setProductForm(p=>p?{
            ...p,option_groups:p.option_groups.filter(x=>x.id!==g.id)
          }:p)}/>
        </View>)}
        <Button title="Adicionar grupo" secondary disabled={productForm.option_groups.length>=8}
          onPress={()=>setProductForm(p=>p?{...p,
            option_groups:[...p.option_groups,{id:randomUUID(),name:"",required:false,multiple:false,
              options:[{id:randomUUID(),name:"",price_cents:0}]}]
          }:p)}/>
        <T bold>Disponibilidade</T>
        {(["available","unavailable","hidden"] as const).map(v=><Pressable key={v}
          onPress={()=>setProductForm(p=>p?{...p,visibility:v}:p)} style={{...line,backgroundColor:productForm.visibility===v?"#FFF1C9":"white"}}>
          <T>{v==="available"?"Disponível":v==="unavailable"?"Indisponível":"Oculto"}</T>
        </Pressable>)}
        <Button title="Salvar produto" busy={busy} onPress={saveProduct}/>
        <Button title="Cancelar edição" secondary onPress={()=>setProductForm(null)}/>
      </Card>:<>
        <Button title="Cadastrar produto" onPress={newProduct}/>
        {products.map(p=><View key={p.id} style={line}>
          <View style={{flexDirection:"row",gap:12}}>
            <View style={{width:85}}><Picture path={p.image_url} label={p.name} height={85}/></View>
            <View style={{flex:1,gap:5}}>
              <T bold>{p.name}</T><T>{money(p.promo_price_cents??p.price_cents)}</T>
              <T style={{color:colors.muted}}>{p.visibility==="available"?"Disponível":p.visibility==="hidden"?"Oculto":"Indisponível"}</T>
            </View>
          </View>
          <Button title="Editar produto" secondary onPress={()=>editProduct(p)}/>
          <Button title="Excluir produto" secondary onPress={()=>Alert.alert("Excluir produto?",p.name,[
            {text:"Voltar",style:"cancel"},{text:"Excluir",style:"destructive",onPress:()=>void run(async()=>{
              await api.request("products/"+p.id,"DELETE",{confirmation:"EXCLUIR PRODUTO"});
            })}])}/>
        </View>)}
      </>)}
      {tab==="Avaliações"&&(reviews.length?reviews.map(r=><View key={r.id} style={line}>
        <T bold>Pedido #{r.order_code} · {r.rating}/5 estrelas</T>
        <T>{r.description}</T><T>{r.status==="pending"?"Aguardando moderação":r.status==="approved"?"Aprovada":"Recusada"}</T>
        {r.status==="pending"&&(["approved","rejected"] as const).map(status=>
          <Button key={status} title={status==="approved"?"Aprovar avaliação":"Rejeitar avaliação"} secondary busy={busy}
            onPress={()=>void run(async()=>{await api.request("shops/mine/reviews/"+r.id,"PATCH",{status});
              const v=await api.request<{reviews:Review[]}>("shops/mine/reviews");setReviews(v.reviews);})}/>)}
      </View>):<Empty title="Sem avaliações" body="As avaliações dos compradores aparecerão aqui."/>)}
      {tab==="Minha loja"&&<Card>
        <T heading style={{fontSize:21}}>Dados da loja</T>
        <Field label="Nome" value={form.name} onChangeText={v=>updateForm("name",v)}/>
        <Field label="Descrição" value={form.description} onChangeText={v=>updateForm("description",v)} multiline/>
        <Field label="WhatsApp" value={form.whatsapp} onChangeText={v=>updateForm("whatsapp",v)} keyboardType="phone-pad"/>
        <T bold>Logotipo</T><Picture path={form.logo_image} label="Logo da loja" height={130}/>
        <Button title="Trocar logo" secondary busy={busy} onPress={()=>void uploadEditorImage("logo_image")}/>
        <T bold>Capa</T><Picture path={form.cover_image} label="Capa da loja" height={160}/>
        <Button title="Trocar capa" secondary busy={busy} onPress={()=>void uploadEditorImage("cover_image")}/>
        {(["delivery_enabled","pickup_enabled"] as const).map(key=>
          <View key={key} style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
            <T bold>{key==="delivery_enabled"?"Aceita entregas":"Aceita retirada"}</T>
            <Switch value={form[key]} onValueChange={v=>updateForm(key,v)}/>
          </View>)}
        <Field label="Taxa de entrega (R$)" keyboardType="decimal-pad" value={form.delivery_fee_cents} onChangeText={v=>updateForm("delivery_fee_cents",v)}/>
        <Field label="Prazo" value={form.lead_time} onChangeText={v=>updateForm("lead_time",v)}/>
        <Field label="Instruções para retirada" value={form.pickup_instructions} onChangeText={v=>updateForm("pickup_instructions",v)} multiline/>
        <T bold>Formas de pagamento</T>
        {(["pix","credit_card","debit_card","cash"] as PaymentMethod[]).map(m=><Pressable key={m}
          onPress={()=>updateForm("payment_methods",form.payment_methods.includes(m)?form.payment_methods.filter(x=>x!==m):[...form.payment_methods,m])}
          style={{flexDirection:"row",alignItems:"center",gap:10,padding:8}}>
          <View style={{width:19,height:19,borderRadius:4,backgroundColor:form.payment_methods.includes(m)?colors.orange:"transparent",borderWidth:1,borderColor:colors.orange}}/>
          <T>{PAYMENT_LABELS[m]}</T>
        </Pressable>)}
        <T heading style={{fontSize:21}}>Avisos da loja</T>
        <T style={{color:colors.muted}}>Envie um comunicado aos moradores que acompanham sua loja e habilitaram notificações.</T>
        <Field label="Título do aviso" maxLength={70} value={noticeTitle} onChangeText={setNoticeTitle}/>
        <Field label="Mensagem" maxLength={240} multiline value={noticeBody} onChangeText={setNoticeBody}/>
        <Button title="Publicar aviso" secondary busy={busy}
          onPress={()=>Alert.alert("Publicar aviso?","Os moradores elegíveis receberão uma notificação.",[
            {text:"Voltar",style:"cancel"},
            {text:"Publicar",onPress:()=>void run(async()=>{
              const result=await api.request<{recipients:number}>("shops/mine/push","POST",{
                title:noticeTitle.trim(),body:noticeBody.trim(),client_key:randomUUID(),
              });
              setNoticeTitle("");setNoticeBody("");
              setSuccess("Aviso publicado para "+result.recipients+" moradores.");
            })},
          ])}/>
        <Button title="Salvar configurações" busy={busy} onPress={()=>void run(async()=>{
          const fee=parseBRLInput(form.delivery_fee_cents,1_000_000);
          if(fee===null)throw new Error("Informe uma taxa de entrega válida em reais.");
          await api.request("shops/mine","PATCH",{
            ...form,logo_image:form.logo_image||null,cover_image:form.cover_image||null,
            delivery_fee_cents:fee,
          });
        })}/>
        <T heading style={{fontSize:21}}>Excluir minha loja</T>
        <T style={{color:colors.muted}}>Esta operação é irreversível. Pedidos em andamento precisam estar concluídos ou cancelados.</T>
        <Field label="Digite EXCLUIR LOJA para confirmar" value={deletion} onChangeText={setDeletion}/>
        <Button title="Excluir loja definitivamente" secondary busy={busy} disabled={deletion!=="EXCLUIR LOJA"}
          onPress={()=>Alert.alert("Excluir loja definitivamente?","Os produtos deixarão de aparecer no marketplace.",[
            {text:"Manter loja",style:"cancel"},
            {text:"Excluir",style:"destructive",onPress:()=>void run(async()=>{
              await api.request("shops/mine","DELETE",{confirmation:"EXCLUIR LOJA"});
              setShop(null);setProducts([]);setDeletion("");
            })},
          ])}/>
      </Card>}
      {tab==="Resultados"&&<View style={{gap:14}}>
        <View style={{flexDirection:"row",gap:8}}>{([7,30,90] as const).map(n=><Pressable key={n} onPress={()=>setPeriod(n)}
          style={{padding:12,borderRadius:13,backgroundColor:period===n?colors.yellow:"white"}}><T>{n} dias</T></Pressable>)}</View>
        {insight?<><Card><T>Pedidos: {insight.summary.orders_total}</T><T>Em aberto: {insight.summary.awaiting}</T>
          <T>Concluídos: {insight.summary.completed}</T><T bold>Vendas concluídas: {money(Number(insight.summary.completed_cents))}</T>
          <T>Ticket médio: {money(Number(insight.summary.average_cents))}</T></Card>
          <T heading style={{fontSize:21}}>Produtos mais vendidos</T>
          {insight.topProducts.map(x=><View key={x.product_id} style={line}><T>{x.name} · {x.units} unidades</T></View>)}
        </>:<Loading/>}
      </View>}
      {tab==="Feiras"&&(fairs.length?fairs.map(f=><View key={f.id} style={line}>
        <T bold>{f.title}</T><T>Até {new Date(f.ends_at).toLocaleDateString("pt-BR")}</T>
        {fairProducts.map(p=>{
          const exists=applications.find(a=>a.fair_id===f.id&&a.product_id===p.id);
          return <View key={p.id} style={{gap:6}}>
            <T>{p.name} · {exists?exists.status:"Não inscrito"}</T>
            <Button title={exists?"Retirar inscrição":"Inscrever produto"} secondary busy={busy}
              onPress={()=>void run(async()=>{
                if(exists)await api.request("fairs/"+f.id+"/applications/"+p.id,"DELETE");
                else await api.request("fairs/"+f.id+"/applications","POST",{product_id:p.id});
                const result=await api.request<{applications:FairApplication[]}>("fairs/seller");
                setApplications(result.applications);
              })}/>
          </View>;
        })}
      </View>):<Empty title="Nenhuma feira disponível" body="Quando houver uma feira aberta, ela aparecerá aqui."/>)}
    </>}
  </Screen>;
}
