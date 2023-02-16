import Urbit from "@uqbar/react-native-api";
import { SetState } from "zustand";
import { Chat, Chats, GetMessagesParams, Message, NotifLevel, SendMessagePayload, SetNotifParams } from "../../types/Pongo";
import { DefaultStore } from "./types";

export interface PongoStore extends DefaultStore {
  loading: string | null;
  showJoinChatModal: boolean;
  currentChat?: string;
  chats: Chats;
  chatPositions: { [chatId: string]: { offset: number, index: number } };
  blocklist: string[];
  isSearching: boolean;
  searchTerm: string;
  sortedChats: Chat[];
  searchResults: Chat[] | string[];
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
  getChats: (api: Urbit, maintainMessages?: boolean) => Promise<Chats>;
  getBlocklist: (api: Urbit) => Promise<string[]>;
  getMessages: (params: GetMessagesParams) => Promise<Message[]>;

  createConversation: (chatName: string, members: string[], isOpen?: boolean) => Promise<Chat | void>;
  createConversationFromPosse: (chatName: string, tag: string) => Promise<Chat | void>;
  leaveConversation: (id: string) => Promise<void>;

  sendMessage: (payload: SendMessagePayload) => Promise<void>;
  editMessage: (convo: string, msgId: string, edit: string) => Promise<void>;
  sendReaction: (convo: string, msgId: string, reaction: string) => Promise<void>;
  setLastReadMsg: (convo: string, msgId: string) => Promise<void>;

  makeInvite: (convo: string, ship: string) => Promise<void>;
  acceptInvite: (convo: string) => Promise<void>;
  rejectInvite: (convo: string) => Promise<void>;
  makeInviteRequest: (convo: string, to: string) => Promise<boolean>;

  block: (who: string) => Promise<void>;
  unblock: (who: string) => Promise<void>;

  set: SetState<PongoStore>;
}
