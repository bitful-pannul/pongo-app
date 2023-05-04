import { create, SetState } from "zustand"
import Urbit from "@uqbar/react-native-api";

import { Guest } from "../types/Handshake";
import { hoonToJSDate, ONE_SECOND } from "../util/time";
import { DefaultStore } from "./types/types";
import { resetSubscriptions } from "./util";

interface CodeData {
  code: string
  expires_at: number
}

export interface HandshakeStore extends DefaultStore {
  loading: boolean,
  api: Urbit | null,
  code: string | null,
  expiresAt: Date | null,
  guestList: Guest[],
  guestSuccess?: string,
  verifyError?: string,
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
      const expiresAt = new Date(expires_at * ONE_SECOND)
      set({ code, expiresAt })
    }

    const handleReaderUpdate = (data: { [key: string]: string }) => {
      // good-sig, bad-sig, expired-sig
      console.log('READER UPDATE:', data)

      if (data.good_sig) {
        set({ possePopupShip: data.good_sig, showPossePopup: true })
      } else if (data.expired_sig) {
        set({ verifyError: 'Code has expired' })
      } else {
        set({ verifyError: 'Error reading code, please try again' })
      }
    }

    await get().subscriptions.map(sub => api.unsubscribe(sub))
    resetSubscriptions(set, api, [], [
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
      mark: 'handshake-action',
      json: { create: null }
    })
    setTimeout(() => set({ loading: false }), 1000)
  },
  verifyCode: async (code: string) => {
    await get().api?.poke({
      app: 'handshake',
      mark: 'handshake-action',
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
