import { SetState } from "zustand";
import Urbit from "@uqbar/react-native-api";
import { SubParams } from "./subscriptions/util";

export const resetSubscriptions = async (set: SetState<any>, api: Urbit, oldSubs: number[], newSubs: SubParams[]) => {
  await Promise.all(oldSubs.map(os => api.unsubscribe(os)))
  const subscriptions = await Promise.all(newSubs.map(ns => api.subscribe(ns)))
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
