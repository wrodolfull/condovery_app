import { createChunkStore } from "./domain/chunk-store";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
const memory = new Map<string, string>();
export const secure = {
  get: (key: string) =>
    Platform.OS === "web"
      ? Promise.resolve(memory.get(key) ?? null)
      : SecureStore.getItemAsync(key),
  set: async (key: string, value: string) => {
    if (Platform.OS === "web") memory.set(key, value);
    else
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
  },
  remove: async (key: string) => {
    if (Platform.OS === "web") memory.delete(key);
    else await SecureStore.deleteItemAsync(key);
  },
};
const carts = createChunkStore(secure);
export const saveCart = carts.save;
export const loadCart = carts.load;
