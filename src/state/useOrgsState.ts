import { create, SetState } from "zustand"
import Urbit from "@uqbar/react-native-api";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { resetSubscriptions } from "./util";
import { EditOrgPayload, OrgPayload, Orgs, OrgsStore, SubOrgPayload } from "../types/Orgs";
import { addSig } from "../util/string";
import { createJSONStorage, persist } from "zustand/middleware";
import { isWeb } from "../constants/Layout";

const useOrgsState = create(
  persist<OrgsStore>((set, get) => ({
    api: null,
    orgs: {},
    subscriptions: [],
    init: async (api: Urbit) => {
      try {
        const { orgs } = await api.scry<{ orgs: Orgs }>({ app: 'orgs', path: '/get-all-orgs' })

        set({ api, orgs })
      } catch {}
    },
    clearSubscriptions: async () => {
      const { api, subscriptions } = get()
      if (api && subscriptions.length) resetSubscriptions(set, api, subscriptions, [])
    },

    getMembers: async (org: string, path: string) => {
      const { api, orgs } = get()
      if (!api) return []

      const { members } = await api.scry<{ members: string[] }>({ app: 'orgs', path: `/get-members/${org}${path}` })

      const newOrgs = { ...orgs }
      newOrgs[org] = { ...newOrgs[org], members }
      set({ orgs: newOrgs })

      return members
    },
    createOrg: async (address: string, payload: OrgPayload) => {
      await get().api?.poke({ app: 'orgs', mark: 'orgs-action', json: { address, create: payload } })
    },
    editOrg: async (address: string, payload: EditOrgPayload) => {
      await get().api?.poke({ app: 'orgs', mark: 'orgs-action', json: { address, 'edit-org': payload } })
    },
    addSubOrg: async (address: string, payload: SubOrgPayload) => {
      await get().api?.poke({ app: 'orgs', mark: 'orgs-action', json: { address, 'add-sub-org': payload } })
    },
    deleteOrg: async (address: string, id: string, path: string) => {
      await get().api?.poke({ app: 'orgs', mark: 'orgs-action', json: { address, 'delete-org': { 'org-id': id, where: path } } })
      const newOrgs = get().orgs
      delete newOrgs[id]
      set({ orgs: newOrgs })
    },
    addMember: async (address: string, id: string, path: string, ship: string) => {
      await get().api?.poke({ app: 'orgs', mark: 'orgs-action', json: { address, 'add-member': { 'org-id': id, where: path, ship: addSig(ship) } } })
    },
    deleteMember: async (address: string, id: string, path: string, ship: string) => {
      await get().api?.poke({ app: 'orgs', mark: 'orgs-action', json: { address, create: { 'org-id': id, where: path, ship: addSig(ship) } } })
    },

    set,
  }), {
    name: 'orgs',
    storage: createJSONStorage(() => isWeb ? sessionStorage : AsyncStorage),
  })
);

export default useOrgsState;
