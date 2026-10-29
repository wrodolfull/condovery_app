import React from "react";
import { Linking, Modal, Pressable, ScrollView, Share, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Facebook, Instagram, Link2, Mail, MessageCircle, MoreHorizontal, Send, Share2, X } from "lucide-react-native";
import { colors } from "../theme";
import { T, alertError } from "../ui";

type Props = { visible: boolean; onClose: () => void; shopName: string; url: string };
export function ShopShareSheet({ visible, onClose, shopName, url }: Props) {
  const message = "Conheça " + shopName + " no Condovery! " + url;
  const nativeShare = () => Share.share({ title: shopName, message, url }).then(onClose).catch(alertError);
  const launch = (link:string) => {
    void Linking.openURL(link).then(onClose).catch(() => void nativeShare());
  };
  const options = [
    {name:"WhatsApp", color:"#25C565", icon:<MessageCircle size={26} color="white"/>,
      action:()=>launch("https://wa.me/?text="+encodeURIComponent(message))},
    {name:"Facebook",color:"#5178BE",icon:<Facebook size={26} color="white"/>,
      action:()=>launch("https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(url))},
    {name:"X",color:"#111111",icon:<T bold style={{fontSize:24,color:"white"}}>X</T>,
      action:()=>launch("https://twitter.com/intent/tweet?text="+encodeURIComponent(message))},
    {name:"Telegram",color:"#2BA7D7",icon:<Send size={26} color="white"/>,
      action:()=>launch("https://t.me/share/url?url="+encodeURIComponent(url)+"&text="+encodeURIComponent("Conheça esta loja!"))},
    {name:"Instagram",color:"#C2529E",icon:<Instagram size={26} color="white"/>,
      action:nativeShare},
    {name:"SMS",color:"#37C36D",icon:<MessageCircle size={26} color="white"/>,
      action:()=>launch("sms:?body="+encodeURIComponent(message))},
    {name:"E-mail",color:"#45A6E6",icon:<Mail size={26} color="white"/>,
      action:()=>launch("mailto:?subject="+encodeURIComponent("Conheça "+shopName)+"&body="+encodeURIComponent(message))},
    {name:"Copiar link",color:"#555555",icon:<Link2 size={26} color="white"/>,
      action:()=>void Clipboard.setStringAsync(url).then(onClose).catch(alertError)},
    {name:"Mais",color:"#E8E8E8",icon:<MoreHorizontal size={27} color="#444444"/>,
      action:nativeShare},
  ];
  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent
    onRequestClose={onClose}>
    <View style={{flex:1,justifyContent:"flex-end",backgroundColor:"rgba(0,0,0,0.55)"}}>
      <Pressable style={{flex:1}} accessibilityLabel="Fechar compartilhamento" onPress={onClose}/>
      <View style={{
        backgroundColor:"#FFFCF8",borderTopLeftRadius:26,borderTopRightRadius:26,
        paddingHorizontal:22,paddingTop:24,paddingBottom:40,maxHeight:"85%",
      }}>
        <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <T heading style={{fontSize:25}}>Compartilhar</T>
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose}
            style={{padding:8,borderRadius:20,backgroundColor:"#F1EFEA"}}>
            <X color={colors.muted} size={22}/>
          </Pressable>
        </View>
        <T numberOfLines={1} style={{color:colors.muted,marginBottom:24}}>{shopName}</T>
        <ScrollView>
          <View style={{flexDirection:"row",flexWrap:"wrap",rowGap:26}}>
            {options.map(o=><Pressable key={o.name} onPress={o.action} accessibilityRole="button"
              accessibilityLabel={"Compartilhar: "+o.name}
              style={{width:"25%",alignItems:"center",gap:8}}>
              <View style={{
                width:55,height:55,borderRadius:15,backgroundColor:o.color,
                alignItems:"center",justifyContent:"center",
              }}>{o.icon}</View>
              <T style={{fontSize:11,textAlign:"center"}}>{o.name}</T>
            </Pressable>)}
          </View>
        </ScrollView>
        <T style={{fontSize:11,color:colors.muted,textAlign:"center",marginTop:20}}>
          No Instagram, selecione o aplicativo no menu de compartilhamento ou cole o link.
        </T>
      </View>
    </View>
  </Modal>;
}
