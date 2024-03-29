import { isValidPatp } from 'urbit-ob'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Urbit from "@uqbar/react-native-api"
import AsyncStorage from '@react-native-async-storage/async-storage'

import { resetSubscriptions } from "./util"
import { Chats, Message, NotifSettings, SendMessagePayload, SetNotifParams, GetMessagesParams, MessageStatus, SearchMessagesParams, SendTokensPayload, NotifLevel } from "../types/Pongo"
import { addSig, deSig } from "../util/string"
import { ONE_SECOND } from "../util/time"
import { MAX_MESSAGES_LENGTH, dedupeAndSort, isCallRequest, sortChats } from "../util/ping"
import { getPushNotificationToken } from "../util/notification"
import { HAS_MENTION_REGEX } from "../constants/Regex"
import { PongoStore } from './types/pongo'
import { messageSub } from './subscriptions/pongoSubs'
import { isWeb } from '../constants/Layout'
import { createSubscription } from './subscriptions/util'

const usePongoStore = create(
  persist<PongoStore>(
    (set, get) => ({
      loading: null,
      connected: true,
      showUqbarWallet: false,
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
      searchStatus: 'complete',
      searchResults: [],
      messageSearchResults: [],
      subscriptions: [],
      notifLevel: 'medium',
      expoToken: '',
      init: async (api: Urbit, clearState = true, profiles = {}) => {
        set({ api })

        const chats = await get().getChats(api, !clearState)
        // await get().getBlocklist(api)
        const notifSettings = await api.scry<{ 'notif-settings': NotifSettings }>({ app: 'pongo', path: '/notif-settings' })
        const { expo_token, level } = notifSettings['notif-settings']
        set({ notifLevel: level, expoToken: expo_token, drafts: {}, replies: {}, edits: {} })

        if (level === 'off') get().setNotifLevel('medium', api)

        resetSubscriptions(set, api, get().subscriptions, [
          createSubscription('pongo', '/updates', messageSub(set, get, profiles))
        ])

        return chats
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
      refresh: async (shipUrl: string, profiles = {}) => {
        const { api, setNotifToken, getChats } = get()
        if (api) {
          getPushNotificationToken()
            .then((token) => {
              if (token) {
                setNotifToken({ shipUrl, expoToken: token })
              }
            }).catch(console.error)
    
          await getChats(api)
    
          resetSubscriptions(set, api, get().subscriptions, [
            createSubscription('pongo', '/updates', messageSub(set, get, profiles))
          ])
        }
      },
      setNotifications: async ({ shipUrl, expoToken, level }: SetNotifParams) => {
        const token = expoToken || get().expoToken
        const json = { "set-notifications": { 'ship-url': shipUrl, 'expo-token': token, level } }
        await get().api?.poke({ app: 'pongo', mark: 'pongo-action', json })
        set({ notifLevel: level, expoToken: token })
      },
      setNotifToken: async ({ shipUrl, expoToken }: { shipUrl: string, expoToken: string }) => {
        const json = { 'set-notif-token': { 'ship-url': shipUrl, 'expo-token': expoToken } }
        await get().api?.poke({ app: 'pongo', mark: 'pongo-action', json })
        set({ expoToken })
      },
      setNotifLevel: async (level: NotifLevel, api?: Urbit) => {
        const json = { 'set-notif-level': { level } }
        await (api || get().api)?.poke({ app: 'pongo', mark: 'pongo-action', json })
        set({ notifLevel: level })
      },
      getChats: async (api: Urbit, maintainMessages = true) => {
        const existingChats = get().chats
        const chats = (await api.scry<{ conversations: Chats }>({ app: 'pongo', path: '/conversations' })).conversations

        Object.keys(chats || {}).forEach(ch => {
          chats[ch].messages = maintainMessages ? (existingChats[ch]?.messages || []) : []
    
          if (chats[ch].last_message?.author && api.ship && deSig(chats[ch].last_message?.author) === deSig(api.ship)) {
            chats[ch].unreads = 0
          }
        })
    
        const sortedChats = sortChats(chats)

        const incomingChat = sortedChats.find((chat) => isCallRequest(api.ship!, chat.last_message))

        if (incomingChat && !get().incomingCall) {
          const chatId = incomingChat.conversation.id
          set({ incomingCall: { chatId, msg: incomingChat.last_message! } })

          const interval = setInterval(() => {
            get().getMessages({ chatId: incomingChat.conversation.id, msgId: incomingChat.last_message!.id, numBefore: 0, numAfter: 1 })
              .then(msgs => {
                if (!get().incomingCall) {
                  clearInterval(interval)
                } else if (msgs[0].id !== incomingChat.last_message?.id) {
                  set({ incomingCall: undefined })
                  clearInterval(interval)
                }
              })
          }, ONE_SECOND * 2)
        } else if (!incomingChat) {
          set({ incomingCall: undefined })
        }
        
        set({ chats, sortedChats })
        return chats
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
    
          if (!message_list.length) {
            return chat.messages
          }
          
          let newMessages: Message[] = message_list.map(msg => ({ ...msg, status: 'delivered' }))

          if (append) {
            newMessages = dedupeAndSort((chat.messages || []).concat(newMessages).slice(-MAX_MESSAGES_LENGTH))
          } else if (prepend) {
            newMessages = dedupeAndSort((newMessages).concat((chat.messages || [])).slice(0, MAX_MESSAGES_LENGTH))
          }
          
          chat.messages = newMessages
          set({ chats })
          return chat.messages
        }
    
        return []
      },
      searchMessages: async ({ uid, phrase, onlyIn, onlyAuthor }: SearchMessagesParams) => {
        const { api } = get()
    
        if (api && uid && uid !== '0x0') {
          api.subscribeOnce('pongo', `/search-results/${uid}`, ONE_SECOND * 12).then((result: any) => {
            const messageSearchResults: Message[] = result.search_result
            console.log(messageSearchResults.length, messageSearchResults[0])
            set({ messageSearchResults, searchStatus: 'complete' })
          }).catch(() => set({ searchStatus: 'error' }))
          const json = { search: { uid, phrase, 'only-in': onlyIn || null, 'only-author': onlyAuthor || null } }
          setTimeout(() => api.poke({ app: 'pongo', mark: 'pongo-action', json }), ONE_SECOND)
        }
      },
      createConversation: async (chatName: string, members: string[], isOpen = false) => {
        const { api } = get()
        // make-conversation name=@t config=conversation-metadata]
        if (api) {
          const config = isOpen ? members.length === 1 ? {
            'dm': { members: members.concat([addSig(api.ship!)]) }
          } : {
            'open': { members: members.concat([addSig(api.ship!)]) }
          } : {
            'managed': { members: members.concat([addSig(api.ship!)]), leaders: [addSig(api.ship!)] }
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
      toggleMute: async (id: string) => {
        const { api } = get()
        if (api) {
          const newChats = { ...get().chats }
          const muted = newChats[id].conversation.muted
          newChats[id].conversation.muted = !muted
          set({ chats: newChats })
          try {
            const json = { [muted ? 'unmute-conversation' : 'mute-conversation']: { id } }
            await api.poke({ app: 'pongo', mark: 'pongo-action', json })
          } catch {
            newChats[id].conversation.muted = muted
            set({ chats: newChats })
          }
        }
      },
      leaveConversation: async (convo: string) => {
        // leave-conversation =conversation-id]
        await get().api?.poke({ app: 'pongo', mark: 'pongo-action', json: {
          'leave-conversation': { convo }
        } })
      },
      sendMessage: async ({ self, convo, kind, content, ref, resend, mentions: mens = [] }: SendMessagePayload) => {
        const reference = ref?.replace(/\./g, '') || null
        const chats = { ...get().chats }
        const chat = chats[convo]
        const timesent = new Date().getTime()
        const identifier = `-${timesent}`
        const mentions: string[] = (kind === 'text' ? content.match(HAS_MENTION_REGEX) || [] as string[] : []).concat(mens).map(m => addSig(m.trim())).filter(isValidPatp)
        chat.unreads = 0

        if (kind !== 'pass-through') {
          chat.messages = resend ? chat.messages.map(m => m.id === resend?.id ? { ...m, status: 'pending' } : m) :
            [{
              id: identifier,
              author: self,
              timestamp: Math.round(timesent / ONE_SECOND),
              kind,
              content,
              reactions: {},
              edited: false,
              mentions,
              reference: ref || null,
              status: 'pending' as MessageStatus,
            } as Message].concat(chat.messages)
        }
        set({ chats })

        const { api } = get()
        if (api && deSig(api.ship) === deSig(self)) {
          try {
            const json = resend ?
              { 'send-message': { ...resend, convo, identifier, reference: resend.reference?.replace(/\./g, ''), mentions } } :
              { 'send-message': { convo, kind, content, identifier, reference, mentions } }
            await api.poke({ app: 'pongo', mark: 'pongo-action', json })
          } catch (err) {
            chat.messages = chat.messages.map(m => m.id === identifier ? { ...m, status: 'failed' } : m)
            set({ chats })
          }
        }
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
        const { api } = get()
    
        if (api) {
          await api.poke({ app: 'pongo', mark: 'pongo-action', json: {
            'read-message': { convo, message: msgId }
          } })
        }
        const newChats = { ...get().chats }
        newChats[convo].unreads = 0
        newChats[convo].conversation.last_read = msgId
        const newSorted = sortChats(newChats)
        set({ chats: newChats, sortedChats: newSorted })
      },
      sendTokens: async (payload: SendTokensPayload) => {
        const { api } = get()
        if (api) {
          const json = { 'send-tokens': payload }
          console.log('SENDING TOKENS: ', json)
          await api.poke({ app: 'pongo', mark: 'pongo-action', json })
        }
      },
    
      makeInvite: async (convo: string, to: string) => {
        // make-invite to=@p =id]
        const { api } = get()
        if (api) {
          const newChats = { ...get().chats }
          const deSigged = deSig(to)
          newChats[convo].conversation.members.unshift(deSigged)
          set({ chats: newChats })
          try {
            await api.poke({ app: 'pongo', mark: 'pongo-action', json: {
              'make-invite': { id: convo, to }
            } })
          } catch {
            newChats[convo].conversation.members = newChats[convo].conversation.members.filter(m => m !== deSigged)
            set({ chats: newChats })
          }
        }
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
      
      set,
    }), {
      name: 'pongo',
      storage: createJSONStorage(() => isWeb ? sessionStorage : AsyncStorage),
    }
  )
);

export default usePongoStore;
