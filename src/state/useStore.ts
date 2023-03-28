import Urbit from "@uqbar/react-native-api";
import { configureApi } from "@uqbar/react-native-api/configureApi";
import WebUrbit from "@urbit/http-api";
import React from "react";
import WebView from "react-native-webview";
import { create, SetState } from "zustand";
import { isWeb } from "../constants/Layout";
import storage from "../util/storage";
import { deSig } from "../util/string";

const initializeApi = (ship: string, shipUrl: string) => {
  if (isWeb) {
    const api = new WebUrbit("", "", "pongo")
    api.ship = window.ship
    return api
  }
  
  return configureApi(ship, shipUrl)
}

declare global {
  var api: Urbit;
  var window: Window & typeof globalThis;
  var ship: string;
}

export interface ShipConnection {
  ship: string;
  shipUrl: string;
  authCookie?: string;
}

interface Store {
  loading: boolean;
  needLogin: boolean;
  ship: string;
  shipUrl: string;
  authCookie: string;
  ships: ShipConnection[];
  api: Urbit | null;
  webViewRef: React.RefObject<WebView> | null;
  setNeedLogin: (needLogin: boolean) => void;
  loadStore: (store: any) => void;
  setShipUrl: (shipUrl: string) => void;
  setLoading: (loading: boolean) => void;
  addShip: (ship: ShipConnection) => void;
  removeShip: (ship: string) => void;
  removeAllShips: () => void;
  setShip: (ship: string) => void;
  clearShip: () => void;
  setWebViewRef: (webViewRef: React.RefObject<WebView>) => void;
  set: SetState<Store>
}

const getNewStore = (store: Store, targetShip: string, shipConnection: ShipConnection, api?: Urbit) => {
  const { ship, shipUrl, authCookie, ships } = store;
  const shipSet = Boolean(ship && shipUrl && authCookie);

  return {
    api: api || store.api,
    ships: [...ships.filter((s) => s.ship !== targetShip), shipConnection],
    ship: shipSet ? ship : shipConnection.ship,
    shipUrl: (shipSet ? shipUrl : shipConnection.shipUrl).toLowerCase(),
    authCookie: shipSet ? authCookie : shipConnection.authCookie,
  };
}

const useStore = create<Store>((set, get) => ({
  loading: true,
  needLogin: true,
  ship: '',
  shipUrl: '',
  authCookie: '',
  ships: [],
  api: null,
  webViewRef: null,
  setNeedLogin: (needLogin: boolean) => set(() => ({ needLogin })),
  loadStore: (store: any) => set(() => {
    window.ship = deSig(store.ship);
    global.window.ship = deSig(store.ship);

    const api = initializeApi(store.ship, store.shipUrl);
    global.api = api as any
    window.api = api as any

    return { ...store, api };
  }),
  setShipUrl: (shipUrl: string) => set({ shipUrl }),
  setLoading: (loading: boolean) => set({ loading }),
  addShip: (shipConnection: ShipConnection) => set((store) => {
    const { ship } = shipConnection;
    const api = initializeApi(shipConnection.ship, shipConnection.shipUrl);
    const newStore: any = getNewStore(store, shipConnection.ship, { ...shipConnection, ship: `~${deSig(ship)}` }, api as any);
    
    storage.save({ key: 'store', data: newStore });
    return newStore;
  }),
  removeShip: (oldShip: string) => set(({ ships }: any) => {
    const newShips = ships.filter(({ ship }: any) => ship !== oldShip)
    const firstShip = newShips[0];
    
    const newStore = {
      ships: newShips,
      ship: '',
      shipUrl: '',
      authCookie: '',
      ...(firstShip ? firstShip : {})
    };

    storage.save({ key: 'store', data: newStore });

    return newStore;
  }),
  removeAllShips: () => set(() => {
    const newStore = { ships: [], ship: '', shipUrl: '', authCookie: '' };
    storage.save({ key: 'store', data: newStore });

    return newStore;
  }),
  setShip: (selectedShip: string) => set(({ ships }) => {
    window.ship = deSig(selectedShip);
    global.window.ship = deSig(selectedShip);
    const newShip = ships.find(({ ship }) => ship === selectedShip);
    const newStore: any = { ships, ship: '', shipUrl: '', authCookie: '', api: null };

    if (newShip) {
      const api = initializeApi(newShip.ship, newShip.shipUrl);
      newStore.ship = newShip.ship;
      newStore.shipUrl = newShip.shipUrl;
      newStore.authCookie = newShip.authCookie || '';
      newStore.api = api;
    }

    storage.save({ key: 'store', data: newStore });
    return newStore;
  }),
  clearShip: () => set(() => ({ ship: '', shipUrl: '', authCookie: '' })),
  setWebViewRef: (webViewRef: React.RefObject<WebView>) => set({ webViewRef }),
  set
}));

export default useStore;
