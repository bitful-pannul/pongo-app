/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

import { NativeStackScreenProps } from "@react-navigation/native-stack";

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootDrawerParamList {}
  }
}

export type RootDrawerParamList = {
  Pongo: undefined;
  Handshake: undefined;
  UqbarWallet: undefined;
  Grid: { path?: string };
};

export type RootStackScreenProps<
  Screen extends keyof RootDrawerParamList
> = NativeStackScreenProps<RootDrawerParamList, Screen>;

export type HandshakeTabParamList = {
  QrCode: undefined;
  ScanCode: undefined;
};

export type WalletTabParamList = {
  Assets: undefined;
  Accounts: undefined;
  Transactions: { txn?: string };
};

export type PongoStackParamList = {
  Chats: undefined;
  Chat: { id: string; msgId?: string };
  Profile: { ship: string };
  Orgs: undefined;
  NewOrg: { parent: string } | undefined;
  Org: { orgId: string };
  Call: { chatId: string, answering?: boolean };
  Group: { id: string };
  Contacts: undefined;
  NewChat: undefined;
  NewGroup: undefined;
  NewPosseGroup: undefined;
  SearchResults: undefined;
  EditProfile: undefined;
  Settings: undefined;
};

export type PokurStackParamList = {
  PokurLobby: undefined;
  PokurNewTable: undefined;
  PokurTable: undefined;
  PokurGame: undefined;
};
