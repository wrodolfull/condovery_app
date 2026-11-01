import { useEffect, useState } from "react";
import { Linking, Modal, Platform, Pressable, View } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { BellRing } from "lucide-react-native";
import { useAuth } from "./auth";
import { usePush } from "./push";
import { secure } from "./storage";
import { Button, T } from "./ui";
import { colors } from "./theme";
import { shouldShowPushOnboarding } from "./domain/push-permission";

const STORAGE_KEY = "push_onboarding_choice_v2";

/** First authenticated launch: a visible invitation followed by the native
 * system dialog on the user's tap. This does not depend on the old v1 flag,
 * which could be persisted even if the dialog never appeared.
 */
export function PushOnboarding() {
  const { viewer } = useAuth();
  const push = usePush(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needsSettings, setNeedsSettings] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!viewer || Platform.OS === "web" ||
        Constants.executionEnvironment === "storeClient" || !Device.isDevice)
      return;
    let active = true;
    void (async () => {
      if (await secure.get(STORAGE_KEY) === "1" || !active) return;
      const N = await import("expo-notifications");
      const permission = await N.getPermissionsAsync();
      if (active && shouldShowPushOnboarding(Platform.OS,Device.isDevice,
        permission.granted,false)) {
        setNeedsSettings(!permission.canAskAgain);
        setVisible(true);
      }
    })().catch(e => {
      if (active) {
        setError(e instanceof Error ? e.message : "Não foi possível verificar as notificações.");
        setVisible(true);
      }
    });
    return () => {active = false;};
  }, [viewer?.id]);
  const dismiss = async () => {
    await secure.set(STORAGE_KEY, "1").catch(() => {});
    setVisible(false);
  };
  const activate = async () => {
    setBusy(true);
    setError("");
    try {
      await push.activate();
      await dismiss();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível ativar notificações.");
      const N = await import("expo-notifications").catch(() => null);
      if (N) {
        const permission = await N.getPermissionsAsync().catch(() => null);
        setNeedsSettings(permission?.canAskAgain === false);
      }
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal visible={visible} transparent animationType="fade"
      onRequestClose={() => void dismiss()}>
      <View style={{
        flex:1, backgroundColor:"rgba(28,26,22,0.65)", alignItems:"center",
        justifyContent:"center", padding:24,
      }}>
        <View style={{
          backgroundColor:colors.card, width:"100%", maxWidth:420,
          borderRadius:24, padding:24, gap:14,
        }}>
          <View style={{
            backgroundColor:"#FFF0D9",width:56,height:56,borderRadius:18,
            alignItems:"center",justifyContent:"center",
          }}>
            <BellRing size={28} color={colors.orange}/>
          </View>
          <T heading style={{fontSize:23}}>Fique por dentro do Elevadoor</T>
          <T style={{color:colors.muted,lineHeight:22}}>
            Receba avisos de novos pedidos, avaliações e mudanças no status das suas compras.
            Você pode escolher os tipos de aviso em Conta.
          </T>
          {!!error && <T style={{color:"#B42318"}}>{error}</T>}
          {needsSettings ? (
            <Button title="Abrir configurações do celular" busy={busy}
              onPress={() => void Linking.openSettings()
                .then(dismiss)
                .catch(e => setError((e as Error).message))}/>
          ) : (
            <Button title="Ativar notificações" busy={busy}
              onPress={() => void activate()}/>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel="Agora não"
            disabled={busy} onPress={() => void dismiss()}
            style={{padding:12,alignItems:"center"}}>
            <T bold style={{color:colors.muted}}>Agora não</T>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
