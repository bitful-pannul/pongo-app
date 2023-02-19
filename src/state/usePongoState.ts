import { isValidPatp } from 'urbit-ob'
import create from "zustand"
import Urbit from "@uqbar/react-native-api";

import { resetSubscriptions } from "./util";
import { Chats, Message, NotifSettings, SendMessagePayload, SetNotifParams, GetMessagesParams, MessageKind, MessageStatus } from "../types/Pongo";
import { addSig, deSig } from "../util/string";
import { ONE_SECOND } from "../util/time";
import { sortChats, sortMessages } from "../util/ping";
import { getPushNotificationToken } from "../util/notification";
import { HAS_MENTION_REGEX } from "../constants/Regex";
import { PongoStore } from './types/pongo';
import { messageSub } from './subscriptions/pongoSubs';

const usePongoStore = create<PongoStore>((set, get) => ({
  loading: null,
  showJoinChatModal: false,
  api: null,
  searchTerm: '',
  isSearching: false,
  chats: {},
  chatPositions: {},
  blocklist: [],
  sortedChats: [],
  drafts: {},
  replies: {},
  edits: {},
  searchResults: [],
  subscriptions: [],
  notifLevel: 'medium',
  expoToken: '',
  init: async (api: Urbit, clearState = true) => {
    resetSubscriptions(set, api, get().subscriptions, [
      api.subscribe({
        app: 'pongo',
        path: '/updates',
        event: messageSub(set, get)
      }),
    ])
    
    await get().getChats(api, !clearState)
    await get().getBlocklist(api)
    const notifSettings = await api.scry<{ 'notif-settings': NotifSettings }>({ app: 'pongo', path: '/notif-settings' })
    const { expo_token, level } = notifSettings['notif-settings']

    set({ notifLevel: level, expoToken: expo_token })
  },
  clearSubscriptions: async () => {
    const { api, subscriptions } = get()
    if (api && subscriptions.length) {
      resetSubscriptions(set, api, subscriptions, [])
    }
  },
  setChatPosition: (chatId: string, offset: number, index: number) => {
    const chatPositions = { ...get().chatPositions }
    chatPositions[chatId] = { offset, index }
    set({ chatPositions })
  },
  setDraft: (chatId: string, text: string) => {
    const drafts = { ...get().drafts }
    drafts[chatId] = text
    set({ drafts })
  },
  setReply: (chatId: string, reply?: Message) => {
    const replies = { ...get().replies }
    if (reply === undefined) {
      delete replies[chatId]
    } else {
      replies[chatId] = reply
    }
    set({ replies })
  },
  setEdit: (chatId: string, edit?: Message) => {
    const edits = { ...get().edits }
    const drafts = { ...get().drafts }
    if (edit === undefined) {
      delete edits[chatId]
    } else {
      edits[chatId] = edit
      drafts[chatId] = edit.content
    }
    set({ edits, drafts })
  },
  refresh: async (shipUrl: string) => {
    const { api, notifLevel, setNotifications, getChats } = get()
    if (api) {
      getPushNotificationToken()
        .then((token) => {
          if (token) {
            setNotifications({ shipUrl, expoToken: token, level: notifLevel === 'off' ? 'medium' : notifLevel })
          }
        }).catch(console.error)

      await getChats(api)
    }
  },
  setNotifications: async ({ shipUrl, expoToken, level }: SetNotifParams) => {
    const token = expoToken || get().expoToken
    const json = { "set-notifications": { 'ship-url': shipUrl, 'expo-token': token, level } }
    await get().api?.poke({ app: 'pongo', mark: 'pongo-action', json })
    set({ notifLevel: level, expoToken: token })
  },
  getChats: async (api: Urbit, maintainMessages = true) => {
    const existingChats = get().chats
    const chats = (await api.scry<{ conversations: Chats }>({ app: 'pongo', path: '/conversations' })).conversations

    Object.keys(chats || {}).forEach(ch => {
      chats[ch].messages = maintainMessages ? (existingChats[ch]?.messages || []) : []

      if (deSig(chats[ch].last_message?.author || '') === deSig(api.ship)) {
        chats[ch].unreads = 0
      }
    })

    const sortedChats = sortChats(chats)
    set({ chats, sortedChats })
    return chats
  },
  getBlocklist: async () => {
    const { blocklist } = await api.scry<{ blocklist: string[] }>({ app: 'pongo', path: '/blocklist' })
    set({ blocklist })
    return blocklist
  },
  getMessages: async ({ chatId, msgId, numBefore, numAfter, append, prepend }: GetMessagesParams) => {
    // console.log('MSGS:', chatId, msgId, numBefore, numAfter, append, prepend)
    if (isNaN(Number(msgId)) || Number(msgId) < 0) {
      console.warn('NOT A MSG ID:', msgId)
      return []
    }

    const { api, chats } = get()
    if (api) {
      const newChats = { ...chats }
      const chat = newChats[chatId]
      const { message_list } = await api.scry<{ message_list: Message[] }>(
        { app: 'pongo', path: `/messages/${chatId}/${msgId}/${numBefore}/${numAfter}` }
      )
      
      let newMessages = message_list

      if (append) {
        newMessages = (chat.messages.slice(-120) || []).concat(newMessages)
      } else if (prepend) {
        newMessages = (newMessages).concat((chat.messages || []).slice(0, 120))
      }

      const messageMap = new Map<string, Message>()
      newMessages.forEach(msg => messageMap.set(msg.id, { ...msg, status: msg.status || 'delivered' }))
      chat.messages = sortMessages(Array.from(messageMap.values()))
      // chat.messages = newMessages.map(msg => ({ ...msg, status: 'delivered' }))
      set({ chats })
      return chat.messages
    }

    return []
  },
  createConversation: async (chatName: string, members: string[], isOpen = false) => {
    const { api } = get()
    // make-conversation name=@t config=conversation-metadata]
    if (api) {
      const config = isOpen ? members.length === 1 ? {
        'dm': { members: members.concat([addSig(api.ship)]) }
      } : {
        'open': { members: members.concat([addSig(api.ship)]) }
      } : {
        'managed': { members: members.concat([addSig(api.ship)]), leaders: [addSig(api.ship)] }
      }
      const json = { 'make-conversation': { name: chatName, config } }

      await api.poke({ app: 'pongo', mark: 'pongo-action', json })
      await new Promise(resolve => setTimeout(() => resolve(true), 500))
  
      const chats = await get().getChats(api)
      const id = Object.keys(chats).find(chatId => chats[chatId].conversation.name === chatName)

      if (id) {
        return { ...chats[id], id }
      }
    }
  },
  createConversationFromPosse: async (chatName: string, tag: string) => {
    // [%make-conversation-from-posse (ot ~[[%name so] [%tag so]])]
    const { api } = get()
    if (api) {
      const json = { 'make-conversation-from-posse': { name: chatName, tag } }
      await api.poke({ app: 'pongo', mark: 'pongo-action', json })
  
      await new Promise(resolve => setTimeout(() => resolve(true), 500))
      const chats = await get().getChats(api)
      const id = Object.keys(chats).find(chatId => chats[chatId].conversation.name === chatName)

      if (id) {
        return { ...chats[id], id }
      }
    }
  },
  leaveConversation: async (convo: string) => {
    // leave-conversation =conversation-id]
    await get().api?.poke({ app: 'pongo', mark: 'pongo-action', json: {
      'leave-conversation': { convo }
    } })
  },
  sendMessage: async ({ self, convo, kind, content, ref, resend }: SendMessagePayload) => {
    const chats = { ...get().chats }
    const chat = chats[convo]
    const timesent = new Date().getTime()
    const identifier = `-${timesent}`
    const mentions = (kind === 'text' ? content.match(HAS_MENTION_REGEX) || [] : []).map(m => addSig(m.trim())).filter(isValidPatp)
    chat.unreads = 0

    chat.messages = resend ? chat.messages.map(m => m.id === resend.id ? { ...m, status: 'pending' } : m) :
      [{
        id: identifier,
        author: self,
        timestamp: Math.round(timesent / ONE_SECOND),
        kind,
        content,
        reactions: {},
        edited: false,
        reference: ref || null,
        status: 'pending' as MessageStatus,
      } as Message].concat(chat.messages)

    set({ chats })

    setTimeout(async () => {
      try {
        const json = resend ?
          { 'send-message': { ...resend, convo, identifier, reference: resend?.reference || null, mentions } } :
          { 'send-message': { convo, kind, content, identifier, reference: ref || null, mentions } }
        await get().api?.poke({ app: 'pongo', mark: 'pongo-action', json })
      } catch (err) {
        chat.messages = chat.messages.map(m => m.id === identifier ? { ...m, status: 'failed' } : m)
        set({ chats })
      }
    }, 1000)
  },
  editMessage: async (convo: string, msgId: string, edit: string) => {
    const json = { 'send-message-edit': { convo, on: msgId, edit } }
    await get().api?.poke({ app: 'pongo', mark: 'pongo-action', json })
  },
  sendReaction: async (convo: string, msgId: string, reaction: string) => {
    const { api } = get()
    if (api) {
      const chats = { ...get().chats }
      const message = chats[convo]?.messages.find(({ id }) => id === msgId)
      if (message && !message.reactions[reaction]?.includes(deSig(api.ship))) {
        if (message.reactions[reaction]) {
          message.reactions[reaction].push(deSig(api.ship))
        } else {
          message.reactions[reaction] = [deSig(api.ship)]
        }
      }
      set({ chats })
      
      try {
        
        const json = { 'send-reaction': { convo, on: msgId, reaction } }
        await api.poke({ app: 'pongo', mark: 'pongo-action', json })
      } catch {
        const revertChats = { ...get().chats }
        if (message) {
          message.reactions[reaction]?.filter(s => s !== deSig(api.ship))
        }
        set({ chats: revertChats })
      }
    }
  },
  setLastReadMsg: async (convo: string, msgId: string) => {
    await get().api?.poke({ app: 'pongo', mark: 'pongo-action', json: {
      'read-message': { convo, message: msgId }
    } })
    const newChats = { ...get().chats }
    newChats[convo].unreads = 0
    newChats[convo].conversation.last_read = msgId
    set({ chats: newChats })
  },

  makeInvite: async (convo: string, to: string) => {
    // make-invite to=@p =id]
    await get().api?.poke({ app: 'pongo', mark: 'pongo-action', json: {
      'make-invite': { id: convo, to }
    } })
  },
  acceptInvite: async (convo: string) => {
    // accept-invite =id]
    await get().api?.poke({ app: 'pongo', mark: 'pongo-action', json: {
      'accept-invite': { id: convo }
    } })
  },
  rejectInvite: async (convo: string) => {
    // reject-invite =id]
    await get().api?.poke({ app: 'pongo', mark: 'pongo-action', json: {
      'reject-invite': { id: convo }
    } })
  },
  makeInviteRequest: async (convo: string, to: string) => {
    // [%make-invite-request (ot ~[[%to (se %p)] [%id (se %ux)]])]
    const { api } = get()
    if (api) {
      await api.poke({ app: 'pongo', mark: 'pongo-action', json: {
        'make-invite-request': { id: convo, to }
      } })
  
      await new Promise(resolve => setTimeout(() => resolve(true), 500))
      const chats = await get().getChats(api)
      return Boolean(chats[convo])
    }

    return false
  },

  block: async (who: string) => {
    const { api, getBlocklist } = get()
    if (api) {
      await api.poke({ app: 'pongo', mark: 'pongo-action', json: {
        'block': { who }
      } })
      await getBlocklist(api)
    }
  },
  unblock: async (who: string) => {
    const { api, getBlocklist } = get()
    if (api) {
      await api.poke({ app: 'pongo', mark: 'pongo-action', json: {
        'unblock': { who }
      } })
      await getBlocklist(api)
    }
  },
  set,
}));

export default usePongoStore;
