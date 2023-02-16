import { SetState } from "zustand";
import Urbit from "@uqbar/react-native-api";

export const resetSubscriptions = async (set: SetState<any>, api: Urbit, oldSubs: number[], newSubs: Promise<number>[]) => {
  await Promise.all(oldSubs.map(os => api.unsubscribe(os)))
  const subscriptions = await Promise.all(newSubs)
  set({ api, subscriptions })
}

export function createStorageKey(name: string): string {
  return `~${window.ship}/${window.desk}/${name}`;
}

// for purging storage with version updates
export function clearStorageMigration<T>() {
  return {} as T;
}

export const storageVersion = parseInt(
  process.env.STORAGE_VERSION || '1',
  10
);
