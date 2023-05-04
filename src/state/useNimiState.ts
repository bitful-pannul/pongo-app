import { create, SetState } from "zustand"
import Urbit from "@uqbar/react-native-api";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { resetSubscriptions } from "./util";
import { MintPayload, NimiShip, NimiStore, Profile, Profiles } from "../types/Nimi";
import { nimiSub } from "./subscriptions/nimiSubs";
import { addSig } from "../util/string";
import { createJSONStorage, persist } from "zustand/middleware";
import { isWeb } from "../constants/Layout";
import { ONE_DAY, ONE_SECOND } from "../util/time";

const useNimiState = create(
  persist<NimiStore>((set, get) => ({
    api: null,
    profiles: {},
    subscriptions: [],
    init: async (api: Urbit) => {
      try {
        const [profile, { ships }] = await Promise.all([
          api.scry<{ ship: NimiShip }>({ app: 'nimi', path: '/profile' }),
          api.scry<{ ships: Profiles }>({ app: 'nimi', path: '/niccbook' }),
        ])

        resetSubscriptions(set, api, get().subscriptions, [
          api.subscribe({ app: 'nimi', path: '/updates', event: nimiSub(set, get) })
        ])

        const oldProfiles = get().profiles
        const profiles = ships
        Object.keys(profiles).forEach(ship => profiles[ship].lastFetched = oldProfiles[ship]?.lastFetched || Date.now())

        if (profile.ship) {
          set({ me: profile.ship })
          profiles[profile.ship.ship] = profile.ship
        }

        set({ api, profiles })
      } catch {}
    },
    clearSubscriptions: async () => {
      const { api, subscriptions } = get()
      if (api && subscriptions.length) {
        resetSubscriptions(set, api, subscriptions, [])
      }
    },

    whodis: async (ship: string, api?: Urbit) => {
      const sigShip = addSig(ship)
      const apiToUse = api || get().api
      const target = get().profiles[sigShip]
      if (apiToUse && (!target || !target.lastFetched || target.lastFetched > Date.now() - ONE_DAY)) {
        await (api || get().api)?.poke({ app: 'nimi', mark: 'nimi-action', json: { whodis: sigShip } })
      }
    },
    mint: async (mint: MintPayload) => {
      await get().api?.poke({ app: 'nimi', mark: 'nimi-action', json: { mint } })
    },
    getProfile: async () => {
      const me = await get().api?.scry<{ ship: NimiShip }>({ app: 'nimi', path: '/profile' })
      if (me?.ship) {
        set({ me: me.ship, profiles: { ...get().profiles, [me.ship.ship]: me.ship } })
      }
    },
    setProfile: async (item: string, address: string) => {
      await get().api?.poke({ app: 'nimi', mark: 'nimi-action', json: { 'set-profile': { item, address } } })
    },

    set,
  }), {
    name: 'pongo',
    storage: createJSONStorage(() => isWeb ? sessionStorage : AsyncStorage),
  })
);

export default useNimiState;
