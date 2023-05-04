import { GetState, SetState } from "zustand"
import { NimiStore, NimiShip } from "../../types/Nimi"
import { addSig, deSig } from "../../util/string"

export const nimiSub = (set: SetState<NimiStore>, get: GetState<NimiStore>) => (update: { ship: NimiShip }) => {
  const { ship, name, uri, item } = update.ship

  if (deSig(ship) === (get().api?.ship) || '') {
    set({ me: update.ship })
  }

  // Still add ourselves to the list of profiles
  set({ profiles: { ...get().profiles, [addSig(ship)]: { name, uri, item, lastFetched: Date.now() } } })
}
