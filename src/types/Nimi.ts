import { SetState } from "zustand";
import { Urbit } from "@uqbar/react-native-api";
import { DefaultStore } from "../state/types/types";

export interface MintPayload {
  name: string;
  uri: string;
  nft: string; // %ux
  address: string; // %ux
  ship: boolean;
}

export interface Profile {
  name: string;
  uri: string;
  item: string;
  lastFetched: number;
}

export interface NimiShip extends Profile {
  ship: string;
  address: string;
}

export interface Profiles {
  [ship: string]: Profile;
}

export interface NimiStore extends DefaultStore {
  me?: Profile;
  profiles: Profiles;

  // scries:
  // user/:nickname
  // ship/:@p
  // ships/:numShips

  whodis: (ship: string, api?: Urbit) => Promise<any>;
  mint: (mint: MintPayload) => Promise<void>;
  getProfile: () => Promise<void>;
  setProfile: (item: string, address: string) => Promise<void>;
  searchForUser: (query: string) => Promise<{ ship: NimiShip } | undefined> | undefined;

  set: SetState<NimiStore>;
}
