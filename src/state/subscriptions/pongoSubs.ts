import { GetState, SetState } from "zustand"
import { dedupeAndSort, getChatName, idNum, sortChats } from "../../util/ping"
import { addSig, deSig, preSig } from "../../util/string"
import { Message, MessageStatus, Update } from "../../types/Pongo"
import { PongoStore } from "../types/pongo"
import { showWebNotification } from "../../util/notification"
import { Profiles } from "../../types/Nimi"

export const messageSub = (set: SetState<PongoStore>, get: GetState<PongoStore>, profiles: Profiles) => (update: Update) => {
  console.log('UPDATE:', JSON.stringify(update))
  const { currentChat, api, getChats } = get()
  
  if ('message' in update) {
    // How to handle when message is being updated?
    const chats = { ...get().chats }
    const chatId = update.message.conversation_id
    const chat = chats[chatId]
    const messages = chat?.messages || []

    if (!chat || update.message.message.kind === 'pass-through') {
      return
    }

    const { id, kind, content, edited, reactions, reference, timestamp, author } = update.message.message

    chat.conversation.last_active = timestamp
    const isMostRecent = chat.last_message?.id && idNum(id) > idNum(chat.last_message.id)
    const isNextMsg = chat.last_message?.id && idNum(id) === idNum(chat.last_message.id) + 1
    const isCurrentChat = chatId === currentChat

    if (isMostRecent) {
      chat.last_message = update.message.message

      if (kind === 'webrtc-call' && content === 'request' && deSig(author) !== deSig(api?.ship || '')) {
        showWebNotification('Video Call', `Incoming call from ${addSig(author)}`)
        set({ incomingCall: { chatId, msg: update.message.message } })
      }
      
      if (isCurrentChat && isNextMsg) {
        chat.conversation.last_read = id
        get().setLastReadMsg(chatId, id)
      }
    }

    // Check that the chat is the current chat and the message is the next one in order
    if (api?.ship && deSig(author) === deSig(api?.ship)) {
      chat.unreads = 0
      get().setLastReadMsg(chatId, id)
    } else if (isMostRecent) {
      chat.unreads = Number(chat.unreads) + 1
    }
    
    const existing = messages?.find(m =>
      m && (m.id === id || (m.id[0] === '-' && m.kind === kind && m.content === content)))

    if (existing) {
      existing.id = id
      existing.content = content
      existing.edited = edited
      existing.reactions = reactions
      existing.reference = reference
      existing.timestamp = timestamp
      existing.status = 'delivered'
    } else if (isNextMsg) {
      chat.messages = [{ ...update.message.message, status: 'delivered' as MessageStatus } as Message].concat(messages || [])
    }
    // chat.messages = dedupeAndSort(chat.messages)

    const authorDisplay = profiles[preSig(author)]?.name || author
    if (!isCurrentChat && deSig(author) !== deSig(get().api?.ship || '') && !chat.conversation.muted) {
      showWebNotification(getChatName(api?.ship || window.ship, chat, profiles), `${chat.conversation.dm ? '' : `${authorDisplay}: `}${content}`)
    }
    
    // Handle admin message types
    if (update.message.message.kind === 'leader-add') {
      chat.conversation.leaders.push(deSig(update.message.message.content))
    } else if (update.message.message.kind === 'leader-remove') {
      chat.conversation.leaders = chat.conversation.leaders.filter(l => deSig(l) !== deSig(update.message.message.content))
    } else if (update.message.message.kind === 'member-add') {
      if (!chat.conversation.members.includes(deSig(update.message.message.content))) {
        chat.conversation.members.unshift(deSig(update.message.message.content))
      }
    } else if (update.message.message.kind === 'member-remove') {
      chat.conversation.members = chat.conversation.members.filter(m => deSig(m) !== deSig(update.message.message.content))
    } else if (update.message.message.kind === 'change-name') {
      chat.conversation.name = update.message.message.content
    }

    const sortedChats = sortChats(chats)
    set({ chats, sortedChats })
  } else if ('sending' in update) {
    const { chats } = get()
    const existing = chats[update.sending.conversation_id]?.messages?.find(m => String(m.id) === update.sending.identifier)
    if (existing) {
      existing.status = 'sent'
      existing.identifier = String(existing.id)
      chats[update.sending.conversation_id].messages = dedupeAndSort(chats[update.sending.conversation_id].messages)
    }
  } else if ('delivered' in update) {
    const { chats } = get()
    const existing = chats[update.delivered.conversation_id]?.messages?.find(m => m.identifier === update.delivered.identifier)
    if (existing) {
      if (update.delivered.message_id) {
        existing.id = update.delivered.message_id
      }
      existing.status = 'delivered'
      chats[update.delivered.conversation_id].messages = dedupeAndSort(chats[update.delivered.conversation_id].messages)
    }
  } else if ('conversations' in update) {

  } else if ('message_list' in update) {

  } else if ('invite' in update) {
    if (api) {
      getChats(api)
    }
  } else if ('search_result' in update) {

  }
}
