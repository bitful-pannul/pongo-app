import create, { SetState } from "zustand"

import Urbit from "@uqbar/react-native-api";
import { Guest } from "../types/Handshake";
import { hoonToJSDate } from "../util/time";
import { DefaultStore } from "./types/types";
import { resetSubscriptions } from "./util";

interface CodeData {
  code: string
  expires_at: string
}

export interface HandshakeStore extends DefaultStore {
  loading: boolean,
  api: Urbit | null,
  code: string | null,
  expiresAt: Date | null,
  guestList: Guest[],
  guestSuccess?: string,
  possePopupShip: string,
  showPossePopup: boolean,
  subscriptions: number[],
  setLoading: (loading: boolean) => void,
  init: (api: Urbit) => Promise<void>,
  createCode: () => Promise<void>,
  verifyCode: (code: string) => Promise<void>,
  setPossePopupShip: (possePopupShip?: string) => void,
  set: SetState<HandshakeStore>;
}

export function createSubscription(app: string, path: string, e: (data: any) => void): any {
  const request = {
    app,
    path,
    event: e,
    err: () => console.warn('SUBSCRIPTION ERROR'),
    quit: () => {
      throw new Error('subscription clogged');
    }
  };
  // TODO: err, quit handling (resubscribe?)
  return request;
}

const useHandshakeStore = create<HandshakeStore>((set, get) => ({
  loading: true,
  api: null,
  code: null,
  expiresAt: null,
  guestList: [],
  possePopupShip: '',
  showPossePopup: false,
  subscriptions: [],
  setLoading: (loading) => set({ loading }),
  init: async (api: Urbit) => {
    const handleSignerUpdate = ({ code, expires_at }: CodeData) => {
      const expiresAt = hoonToJSDate(expires_at)
      set({ code, expiresAt })
    }
    const handleReaderUpdate = (data: { [key: string]: string }) => {
      // good-sig, bad-sig, expired-sig

      if (data['good-sig']) {
        set({ possePopupShip: data['good-sig'], showPossePopup: true })
      }
    }

    resetSubscriptions(set, api, get().subscriptions, [
      api.subscribe(createSubscription('handshake', '/signer-updates', handleSignerUpdate)),
      api.subscribe(createSubscription('handshake', '/reader-updates', handleReaderUpdate)),
    ])

    get().createCode()
    set({ loading: false })
  },
  clearSubscriptions: async () => {
    const { api, subscriptions } = get()
    if (api && subscriptions.length) {
      resetSubscriptions(set, api, subscriptions, [])
    }
  },
  createCode: async () => {
    set({ loading: true })
    await get().api?.poke({
      app: 'handshake',
      mark: 'action',
      json: { create: true }
    })
    setTimeout(() => set({ loading: false }), 1000)
  },
  verifyCode: async (code: string) => {
    await get().api?.poke({
      app: 'handshake',
      mark: 'action',
      json: { verify: { code } }
    })
  },
  setPossePopupShip: (possePopupShip?: string) => {
    if (possePopupShip) {
      set({ possePopupShip, showPossePopup: true })
    } else {
      set({ showPossePopup: false })
    }
  },
  set,
}));

export default useHandshakeStore;
