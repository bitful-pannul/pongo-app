import Urbit from "@uqbar/react-native-api";
import { SetState } from "zustand";
import { Chat, Chats, GetMessagesParams, Message, NotifLevel, SearchMessagesParams, SendMessagePayload, SendTokensPayload, SetNotifParams } from "../../types/Pongo";
import { DefaultStore } from "./types";

export interface PongoStore extends DefaultStore {
  loading: string | null;
  connected: boolean;
  showUqbarWallet: boolean;
  showJoinChatModal: boolean;
  currentChat?: string;
  chats: Chats;
  chatPositions: { [chatId: string]: { offset: number, index: number } };
  blocklist: string[];
  isSearching: boolean;
  searchTerm: string;
  sortedChats: Chat[];
  searchResults: string[];
  messageSearchResults: Message[];
  drafts: { [chatId: string]: string };
  replies: { [chatId: string]: Message };
  edits: { [chatId: string]: Message };
  // Settings
  notifLevel: NotifLevel;
  expoToken: string;

  setChatPosition: (chatId: string, offset: number, index: number) => void;
  setDraft: (chatId: string, text: string) => void;
  setReply: (chatId: string, reply?: Message) => void;
  setEdit: (chatId: string, edit?: Message) => void;

  refresh: (shipUrl: string) => Promise<void>;
  setNotifications: (params: SetNotifParams) => Promise<void>;
  setNotifToken: (params: { shipUrl: string, expoToken: string }) => Promise<void>;
  setNotifLevel: (level: NotifLevel, api?: Urbit) => Promise<void>;
  getChats: (api: Urbit, maintainMessages?: boolean) => Promise<Chats>;
  getMessages: (params: GetMessagesParams) => Promise<Message[]>;
  searchMessages: (params: SearchMessagesParams) => Promise<void>;

  createConversation: (chatName: string, members: string[], isOpen?: boolean) => Promise<Chat | void>;
  createConversationFromPosse: (chatName: string, tag: string) => Promise<Chat | void>;
  toggleMute: (id: string) => Promise<void>;
  leaveConversation: (id: string) => Promise<void>;

  sendMessage: (payload: SendMessagePayload) => Promise<void>;
  editMessage: (convo: string, msgId: string, edit: string) => Promise<void>;
  sendReaction: (convo: string, msgId: string, reaction: string) => Promise<void>;
  setLastReadMsg: (convo: string, msgId: string) => Promise<void>;
  sendTokens: (payload: SendTokensPayload) => Promise<void>;

  makeInvite: (convo: string, ship: string) => Promise<void>;
  acceptInvite: (convo: string) => Promise<void>;
  rejectInvite: (convo: string) => Promise<void>;
  makeInviteRequest: (convo: string, to: string) => Promise<boolean>;

  set: SetState<PongoStore>;
}
