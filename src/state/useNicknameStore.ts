import { isValidPatp } from 'urbit-ob'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Urbit from "@uqbar/react-native-api"
import AsyncStorage from '@react-native-async-storage/async-storage'

import { resetSubscriptions } from "./util"

import { ONE_SECOND } from "../util/time"
import { isWeb } from '../constants/Layout'
import { DefaultStore } from "./types/types";

export interface NicknameStore  { // extends DefaultStore
  loading: string | null;
  api: Urbit | null
  connected: boolean;

  niccbook: Ships;
  init: (api: Urbit, clearState?: boolean) => Promise<void>

  //  clearSubscriptions: () => Promise<void>
  //  refresh: (shipUrl: string) => Promise<void>;

}
// nickbook
export interface Ships {
  [ship: string]: [name: string, uri: string, item: string];
}


const useNicknameStore = create(
  persist<NicknameStore>(
    (set, get) => ({
      loading: null,
      api: null,
      connected: true,

      niccbook: {},

      init: async (api: Urbit, clearState = false) => {
        set({ api })
        
        // init empty sub to %nimi, scry out initial nickbook
        const ships = await api.scry<{ 'ships': Ships }>({ app: 'nimi', path: '/niccbook' })
        console.log('init ships: ', ships)

        
        // something to think about, maybe in %pokur, when a new table is joined (/chat), scry for nicks, 
        // and for the ones we do not find, we can poke %nimi to check for them via %whodis pokes. 
      },
      set
    }),
    {
      name: 'nicknames',   // necessary or pongo?
      storage: createJSONStorage(() => isWeb ? sessionStorage : AsyncStorage),
    }
  )
);

export default useNicknameStore;
