import { SetState } from "zustand";
import { DefaultStore } from "../state/types/types";


export interface Org {
  name: string;
  parent_path: string;
  desc: string;
  controller: string; // wallet address of owner
  members: string[]; // ships
  sub_orgs: string[];
}

export interface Orgs {
  [org: string]: Org;
}

export interface OrgPayload {
  name: string;
  'parent-path': string; // empty string for top-level org
  desc: string; // empty string
  controller: string; // wallet address of owner
  members: string[];
  'sub-orgs': null;
}

export interface EditOrgPayload {
  'org-id': string;
  where: string; // path of sub org
  desc: string; // optional
  controller: string; // optional
}

export interface SubOrgPayload {
  'org-id': string;
  where: string; // path of sub org
  org: OrgPayload;
}

export interface OrgsStore extends DefaultStore {
  orgs: Orgs;

  getMembers: (org: string, path: string) => Promise<string[]>;
  createOrg: (address: string, payload: OrgPayload) => void;
  editOrg: (address: string, payload: EditOrgPayload) => void;
  addSubOrg: (address: string, payload: SubOrgPayload) => void;
  deleteOrg: (address: string, id: string, path: string) => void;
  addMember: (address: string, id: string, path: string, ship: string) => void;
  deleteMember: (address: string, id: string, path: string, ship: string) => void;

  set: SetState<OrgsStore>;
}



