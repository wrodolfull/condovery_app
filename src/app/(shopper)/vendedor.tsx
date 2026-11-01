import { useLocalSearchParams } from "expo-router";
import SellerPanel from "@/screens/SellerPanel";

/** Remount only on new notification targets, preserving manual tab changes. */
export default function SellerRoute() {
  const {tab,order_id,review_id}=useLocalSearchParams<{
    tab?:string;order_id?:string;review_id?:string
  }>();
  return <SellerPanel key={[tab??"",order_id??"",review_id??""].join(":")}/>;
}
