import create, { SetState } from "zustand"

import Urbit from "@uqbar/react-native-api";
import { addSig } from "../util/string";
import { DefaultStore } from "./types/types";
import { resetSubscriptions } from "./util";

export interface PosseTags {
  [ship: string]: string[]
}

export interface PosseStore extends DefaultStore {
  tags: PosseTags

  getTags: (ship: string) => Promise<PosseTags | void>;
  addTag: (who: string, tag: string) => Promise<void>;
  deleteTag: (who: string, tag: string) => Promise<void>;

  set: SetState<PosseStore>;
}

const usePosseState = create<PosseStore>((set, get) => ({
  api: null,
  tags: {},
  subscriptions: [],
  init: async (api: Urbit) => {
    try {
      resetSubscriptions(set, api, get().subscriptions, [
      ])
    } catch {}
  },
  clearSubscriptions: async () => {
    const { api, subscriptions } = get()
    if (api && subscriptions.length) {
      resetSubscriptions(set, api, subscriptions, [])
    }
  },
  getTags: async (ship: string) => {
    console.log(2)
    const { api } = get()
    if (api) {
      console.log(3)
      const tagList = await api.scry<string[]>({ app: 'posse', path: `/contact/${addSig(ship)}` })
      console.log('SHIP:', tagList)
      const tags = { ...get().tags }
      tags[ship] = tagList
      set({ tags })
    }
  },
  addTag: async (who: string, tag: string) => {
    const { api } = get()
    if (api) {
      console.log({ 'add-tag': { who, tag } })
      await api.poke({ app: 'posse', mark: 'posse-action', json: { 'add-tag': { who, tag } } })
      const tags = { ...get().tags }
      tags[who] = (tags[who] || []).concat([tag])
      set({ tags })
    }
  },
  deleteTag: async (who: string, tag: string) => {
    const { api } = get()
    if (api) {
      await api.poke({ app: 'posse', mark: 'posse-action', json: { 'del-tag': { who, tag } } })
      const tags = { ...get().tags }
      tags[who] = tags[who].filter(t => t !== tag)
      set({ tags })
    }
  },
  set,
}));

export default usePosseState;
