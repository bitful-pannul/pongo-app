import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, RouteProp, useNavigation } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View as DefaultView,
  AppStateStatus,
  AppState,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Image } from "expo-image"

import usePongoStore from '../../state/usePongoState'
import useStore from '../../state/useStore'
import useColors from '../../hooks/useColors'
import Row from '../../components/spacing/Row'
import { Text, View } from '../../components/Themed'
import Col from '../../components/spacing/Col'
import MessageMenu from '../../components/pongo/Chat/MessageMenu'
import { addSig } from '../../util/string'
import { INBOX_CHAT_ID, isAdminMsg, RETRIEVAL_NUM } from '../../util/ping'
import { ONE_SECOND } from '../../util/time'
import { isIos, isWeb, keyboardAvoidBehavior, keyboardOffset } from '../../constants/Layout'
import { uq_pink, uq_purple } from '../../constants/Colors'
import { PongoStackParamList } from '../../types/Navigation'
import { Message } from '../../types/Pongo'
import useKeyboard from '../../hooks/useKeyboard'
import { fromUd, numToUd } from '../../util/number'
import ChatInput from '../../components/pongo/Inputs/ChatInput'
import MentionSelector from '../../components/pongo/Inputs/MentionSelector'
import MessagesList from '../../components/pongo/Chat/MessageList'
import SendTokensModal from '../../components/pongo/SendTokensModal'
import useDimensions from '../../hooks/useDimensions'
import AudioHeader from '../../components/pongo/Chat/AudioHeader'
import PollInput from '../../components/pongo/Inputs/PollInput'
import MessageSearch from './MessageSearch'

interface ChatScreenProps {
  navigation: NavigationProp<PongoStackParamList>
  route: RouteProp<PongoStackParamList, 'Chat'>
}

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
  const listRef = useRef<FlatList<any>>(null)
  const inputRef = useRef<TextInput>(null)
  const scrollYRef = useRef<number>(0)
  const indexRef = useRef<number>(0)
  const lastFetch = useRef<number>(0)
  const appState = useRef(AppState.currentState)
  const { ship, api } = useStore()
  const {
    set, chats, edits, replies, chatPositions, isSearching, connected, getChats,
    setDraft, sendMessage, getMessages, setReply, setEdit, setLastReadMsg, editMessage, sendReaction, setChatPosition
  } = usePongoStore()
  const { color, chatBackground, backgroundColor } = useColors()
  const { isKeyboardVisible, keyboardHeight } = useKeyboard()
  const { cWidth, height } = useDimensions()

  const [selected, setSelected] = useState<{ msg: Message; offsetY: number; height: number } | undefined>()
  const [highlighted, setHighlighted] = useState<string | null>()
  const [focused, setFocused] = useState<string | undefined>()
  const [atEnd, setAtEnd] = useState(true)
  const [showMentions, setShowMentions] = useState(false)
  const [initialPositionLoad, setInitialPositionLoad] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [potentialMentions, setPotentialMentions] = useState<string[]>([])
  const [unreadInfo, setUnreadInfo] = useState<{unreads: number; lastRead: string} | undefined>()
  const [showSendTokensModal, setShowSendTokensModal] = useState(false)
  const [showPollModal, setShowPollModal] = useState(false)
  const [gettingMessages, setGettingMessages] = useState(false)

  const chatId = route.params.id
  const msgId = route.params.msgId
  
  const chat = useMemo(() => chats[chatId], [chatId, chats])
  const reply = useMemo(() => replies[chatId], [replies, chatId])
  const edit = useMemo(() => edits[chatId], [edits, chatId])
  const messages = chat?.messages || []

  useEffect(() => () => {
    setChatPosition(chatId, scrollYRef.current, indexRef.current)
    set({ currentChat: undefined })
    if (api) {
      getChats(api)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (chat && !messages.length) {
        getMessages({ chatId, msgId: chat.conversation.last_read, numBefore: RETRIEVAL_NUM, numAfter: RETRIEVAL_NUM })
      } else if (chat && messages.length) {
        clearInterval(interval)
      }
    }, ONE_SECOND * 3)

    return () => clearInterval(interval)
  }, [chatId, messages?.length])

  useEffect(() => {
    if (!chatId || !chats[chatId]) {
      navigation.goBack()
    } else {
      set({ currentChat: chatId })

      if (!isWeb) {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
          if (appState.current.match(/inactive|background/) && nextAppState === "active" && scrollYRef.current < 50) {
            if (chat?.conversation.last_read === messages[0]?.id) {
              getMessagesOnScroll({ prepend: true })()
              setUnreadIndicator({ unreads: chat?.unreads || 0, lastRead: chat.conversation.last_read })
            }
          }
          appState.current = nextAppState
        }
        const appStateListener = AppState.addEventListener("change", handleAppStateChange)
        return () => {
          set({ currentChat: undefined })
          appStateListener?.remove()
        }
      }
    }

    return () => set({ currentChat: undefined })
  }, [chatId, ship])

  useEffect(() => {
    if (msgId && !initialPositionLoad) {
      setFocused(msgId)
      setInitialPositionLoad(true)
    } else if (chatId && chatPositions[chatId]?.offset && chatPositions[chatId]?.offset > 0 && !initialPositionLoad) {
      const wait = new Promise(resolve => setTimeout(resolve, 100));
      wait.then(() => {

        listRef.current?.scrollToOffset({ offset: chatPositions[chatId].offset, animated: false });
      })
      setInitialPositionLoad(true)
    }
  }, [msgId, chatPositions, chatId, initialPositionLoad])

  // Get initial message
  useEffect(() => {
    const getInitialMessages = async () => {
      if (chatId && chat && initialLoading) {
        try {
          let msgs: Message[] | undefined = undefined
          // come to msg from push notification
          if (msgId) {
            await getMessages({ chatId, msgId, numBefore: RETRIEVAL_NUM, numAfter: RETRIEVAL_NUM })
            setUnreadIndicator({ unreads: chat?.unreads || 0, lastRead: msgId })
          // open with no messages
          } else if (!messages || messages.length < 1) {
            if (chat.conversation.last_read === '0' && chat.last_message?.id) {
              msgs = await getMessages({ chatId, msgId: chat.last_message?.id, numBefore: 50, numAfter: 5 })
            } else {
              msgs = await getMessages({ chatId, msgId: chat.conversation.last_read, numBefore: RETRIEVAL_NUM, numAfter: RETRIEVAL_NUM })
              const targetMsg = chat.conversation.last_read === msgs[0]?.id ? undefined : msgs.findIndex(({ id }) => id === chat.conversation.last_read)
              setUnreadIndicator({ unreads: chat?.unreads || 0, lastRead: chat.conversation.last_read }, targetMsg)
            }

            if (msgs?.length) {
              msgs[0]?.id && setLastReadMsg(chatId, msgs[0].id).catch(console.warn)
            }
            
          // if the most recent message in our chat is also the last one we read (i.e. we were previously caught up)
          } else if (messages[0]?.id === chat.conversation.last_read) {
            msgs = await getMessages({ chatId, msgId: chat.conversation.last_read, numBefore: RETRIEVAL_NUM, numAfter: RETRIEVAL_NUM })
            const targetMsg = chat.conversation.last_read === msgs[0]?.id ? undefined : msgs.findIndex(({ id }) => id === chat.conversation.last_read)
            setUnreadIndicator({ unreads: chat?.unreads || 0, lastRead: chat.conversation.last_read }, targetMsg)
          // if we're near the bottom
          } else if (!chatPositions[0]?.offset || chatPositions[0].offset < 50) {
            setUnreadIndicator({ unreads: chat?.unreads || 0, lastRead: chat.conversation.last_read })
          // if we have fewer than 30 messages
          } else if (chat.last_message) {
            const msgs = await getMessages({ chatId, msgId: chat.last_message.id, numBefore: RETRIEVAL_NUM, numAfter: RETRIEVAL_NUM })
            const targetMsg = chat.conversation.last_read === msgs[0]?.id ? undefined : msgs.findIndex(({ id }) => id === chat.conversation.last_read)
            setUnreadIndicator({ unreads: chat.unreads, lastRead: chat.conversation.last_read }, targetMsg)
            msgs[0]?.id && setLastReadMsg(chatId, msgs[0].id).catch(console.warn)
          }
        } catch {} finally {
          setInitialLoading(false)
        }
      }
    }

    getInitialMessages()
  }, [chatId, ship, msgId])

  useEffect(() => {
    if (chat?.conversation?.last_read && atEnd && (chat.conversation.last_read === messages[0]?.id || messages[0]?.id[0] === '-')) {
      const getMessagesInterval = setInterval(() => {
        getMessages({ chatId, msgId: numToUd(fromUd(chat.conversation.last_read) + 1), numBefore: 0, numAfter: 5, prepend: true })
          .catch(() => {
            // TODO: if this fails, set an indicator that the connection is broken
          })
      }, ONE_SECOND * 5)

      return () => clearInterval(getMessagesInterval)
    }
  }, [atEnd, chat?.conversation?.last_read, messages[0]?.id])

  // Set last_read message ID
  useEffect(() => {
    if (messages[0] && messages[0].id[0] !== '-' && chat && Number(messages[0].id || 0) > Number(chat.conversation.last_read)) {
      setLastReadMsg(chatId, messages[0].id).catch(console.warn)
    }
  }, [messages[0]?.id])

  useEffect(() => {
    if (focused) {
      const item = messages.find(({ id }) => id === focused)
      if (item) {
        setTimeout(() => {
          listRef.current?.scrollToItem({ item, animated: true, viewPosition: isWeb ? 0.9 : 0.3 })
          if (isWeb) {
            setTimeout(() => {
              document?.getElementById('highlighted')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 500)
          }
          setFocused(undefined)
        }, 100)
      }
    }
  }, [focused, messages])

  const setUnreadIndicator = useCallback((data: { unreads: number; lastRead: string }, index?: number) => {
    setUnreadInfo(data)
    if (index && index > 6) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.8 })

        if (isWeb) {
          setTimeout(() => {
            document?.getElementById('unread-indicator')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 500)
        }
      }, 0.5 * ONE_SECOND)
    }
  }, [])

  const onPressMessage = useCallback((msg: Message) => (offsetY: number, height: number) => {
    if (!isAdminMsg(msg)) {
      setSelected({ msg, offsetY, height })
    }
  }, [])

  const focusReply = useCallback(async (msgId: string | null) => {
    if (msgId) {
      const message = messages.find(({ id }) => id === msgId)

      if (message) {
        setFocused(msgId)
        setHighlighted(msgId)
      } else {
        await getMessages({ chatId, msgId, numBefore: isWeb ? RETRIEVAL_NUM + 20 : RETRIEVAL_NUM, numAfter: isWeb ? 20 : RETRIEVAL_NUM })
        setFocused(msgId)
        setHighlighted(msgId)
      }
    }
  }, [listRef, messages, setHighlighted])

  const react = useCallback((emoji: string) => () => {
    if (selected) {
      sendReaction(chatId, selected.msg.id, emoji)
    }
    setSelected(undefined)
  }, [chatId, selected])

  const addReaction = useCallback((msgId: string) => (emoji: string) => {
    const message = messages.find(({ id }) => id === msgId)
    if (message && !message.author.includes(ship)) {
      if (message.reactions[emoji]?.includes(addSig(ship))) {
        sendReaction(chatId, msgId, '')
      } else {
        sendReaction(chatId, msgId, emoji)
      }
    }
  }, [chatId, messages, ship])

  const interactWithSelected = useCallback((act: 'reply' | 'copy' | 'edit' | 'resend' | 'delete') => () => {
    if (selected) {
      if (act === 'reply') {
        setReply(chatId, selected.msg)
        setEdit(chatId, undefined)
        inputRef.current?.focus()
      } else if (act === 'copy') {
        Clipboard.setStringAsync(selected.msg.content)
      } else if (act === 'edit') {
        setReply(chatId, undefined)
        setEdit(chatId, selected.msg)
        inputRef.current?.focus()
      } else if (act === 'resend') {
        sendMessage({ self: ship, convo: chatId, kind: 'text', content: selected.msg.content, ref: reply?.id, resend: selected.msg })
      } else if (act === 'delete') {
        editMessage(chatId, selected.msg.id, '')
      }
    }

    setSelected(undefined)
  }, [chatId, selected, inputRef, setReply, setEdit])

  const swipeToReply = useCallback((msg: Message) => {
    setReply(chatId, msg)
    inputRef.current?.focus()
  }, [chatId, setReply])

  const removeEditReply = useCallback(() => {
    if (edit) {
      setDraft(chatId, '')
    }
    setEdit(chatId, undefined)
    setReply(chatId, undefined)
  }, [chatId, edit, setReply, setEdit, setDraft])
  
  const clearSelected = useCallback(() => setSelected(undefined), [])

  const scrollToEnd = useCallback(async () => {
    lastFetch.current = Date.now()
    setTimeout(() => setAtEnd(true), 100)
    listRef.current?.scrollToOffset({ offset: 0, animated: false })
    
    if (!(chat.last_message?.id === messages[0]?.id || !chat.last_message?.id)) {
      await getMessages({ chatId, msgId: chat.last_message.id, numBefore: RETRIEVAL_NUM, numAfter: 2 })
    }
    // listRef.current?.scrollToOffset({ offset: 0, animated: false })
    scrollYRef.current = 0
    setChatPosition(chatId, 0, 0)
  }, [listRef, chatId, chat, messages])

  const getMessagesOnScroll = useCallback(({ append, prepend }: { append?: boolean; prepend?: boolean }) => async () => {
    const msgId = append ? messages[messages.length - 1]?.id : messages.find(({ id }) => id && String(id)[0] !== '-')?.id
    const fetchedRecently = (Date.now() - lastFetch.current) < ONE_SECOND

    if (!msgId || String(msgId)[0] === '-' || fetchedRecently || msgId === '0' || msgId === chat.last_message?.id) {
      return
    }

    lastFetch.current = Date.now()

    const msgs = await getMessages({ chatId, msgId, numBefore: append ? RETRIEVAL_NUM : 0, numAfter: prepend ? RETRIEVAL_NUM : 0, append, prepend })
    if (msgs[0]?.id && prepend) {
      setLastReadMsg(chatId, msgs[0].id).catch(console.warn)
    }
  }, [chatId, chat, messages, getMessages])

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { nativeEvent: { contentOffset: { y } } } = event
    const atTheEnd = y <= 40
    setAtEnd(atTheEnd)
    const fetchedRecently = (Date.now() - lastFetch.current) < ONE_SECOND * 0.5

    if (!fetchedRecently && !atTheEnd && y <= (height * 2) && y <= scrollYRef.current) {
      getMessagesOnScroll({ prepend: true })()
    }
    scrollYRef.current = y
  }, [getMessagesOnScroll])

  // console.log('messages', messages.length)

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    indexRef.current = viewableItems[viewableItems.length - 1]?.index || 0
  }, [])

  const onSelectMention = useCallback((mention: string) => {
    inputRef.current?.focus()
  }, [inputRef])

  const isOwnMsg = useMemo(() => selected?.msg.author.includes(ship), [selected, ship])
  const canDelete = isOwnMsg
  const canEdit = useMemo(
    () => isOwnMsg && selected?.msg.kind === 'text' && (selected?.msg.status === 'delivered' || selected?.msg.status === 'sent'),
    [selected, isOwnMsg]
  )
  const canResend = useMemo(() => isOwnMsg && selected?.msg.kind === 'text' && selected?.msg.status === 'failed', [selected, isOwnMsg])
  const initialNumToRender = useMemo(() => Math.max((chatPositions[chatId]?.index || 0) + 1, 25), [chatPositions, chatId])
  const goToEndButtonBottom = useMemo(() => isIos ? (isKeyboardVisible ? 60 + keyboardHeight : 100) :  60, [isKeyboardVisible, keyboardHeight])
  const showDownButton = !atEnd || (messages[0]?.id && messages[0].id[0] !== '-' && (fromUd(messages[0].id) - fromUd(chat.conversation.last_read) > 2))

  const styles = useMemo(() => StyleSheet.create({
    unreadIndicator: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: uq_pink,
      borderRadius: 11,
      height: 22,
      minWidth: 22,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 2,
    },
    goToEndButton: { position: 'absolute', right: 16 },
    noMessages: { fontSize: 18, padding: 40, width: '100%', position: 'absolute', top: 0, textAlign: 'center', fontWeight: '600' },
  }), [])

  if (!chats || !chats[chatId]) {
    return null
  }

  return (
    <KeyboardAvoidingView
      style={{ height: '100%', width: cWidth, flex: 1 }}
      behavior={keyboardAvoidBehavior}
      keyboardVerticalOffset={keyboardOffset}
    >
      {isSearching ? (
        <MessageSearch focusMessage={focusReply} />
      ) : (
        <>
          <AudioHeader chatId={chatId} />
          <DefaultView style={{ flex: 1 }}>
            <Image contentFit="cover"
              source={require('../../../assets/images/retro-background-small.jpg')}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3, width: '100%', height: '100%' }}
            />

            <MessagesList
              messages={messages}
              self={ship}
              chatBackground={chatBackground}
              color={color}
              listRef={listRef}
              highlighted={highlighted}
              unreadInfo={unreadInfo}
              initialNumToRender={initialNumToRender}
              enableAutoscrollToTop={atEnd && !initialLoading}
              isDm={chat?.conversation?.dm}
              chatId={chatId}
              onViewableItemsChanged={onViewableItemsChanged}
              onScroll={onScroll}
              getMessagesOnScroll={getMessagesOnScroll}
              onPressMessage={onPressMessage}
              addReaction={addReaction}
              swipeToReply={swipeToReply}
              focusReply={focusReply}
              navigation={navigation}
              // scrollEnabled={!(isWeb && gettingMessages)}
            />
            
            {showMentions && <MentionSelector {...{ chatId, potentialMentions, color, backgroundColor, setShowMentions, onSelectMention }} />}
            {!messages?.length && (
              initialLoading ? (
                <ActivityIndicator size="large" style={{ width: '100%', padding: 40, position: 'absolute' }} />
              ) : (
                <Text style={styles.noMessages}>{!connected ? 'No internet connection' : 'No messages'}</Text>
              )
            )}
          </DefaultView>

          {showDownButton && (
            <TouchableOpacity onPress={scrollToEnd} style={[styles.goToEndButton, { bottom: goToEndButtonBottom }]}>
              <Col style={{ width: 48, height: 48, borderRadius: 36, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name='chevron-down' size={36} color={uq_purple} style={{ marginTop: 4 }} />
                {!!chat?.unreads && chat.unreads > 0 && <View style={styles.unreadIndicator}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{chat.unreads}</Text>
                </View>}
              </Col>
            </TouchableOpacity>
          )}
          
          {chatId !== INBOX_CHAT_ID && <Col>
            {Boolean(reply || edit) && (
              <Row style={{ padding: 8, paddingHorizontal: 12 }}>
                <TouchableOpacity onPress={removeEditReply} style={{ marginRight: 8 }}>
                  <Ionicons name='close-circle-outline' color={color} size={20} />
                </TouchableOpacity>
                <Text style={{ marginRight: 8, fontSize: 16 }}>{edit ? 'Editing' : 'Reply to'}:</Text>
                <Text numberOfLines={1} style={{ fontSize: 14, marginTop: 2, maxWidth: cWidth - 140 }}>"{(edit || reply).content}"</Text>
              </Row>
            )}

            <ChatInput {...{ inputRef, chatId, showMentions, setShowMentions, setPotentialMentions, setShowSendTokensModal, setShowPollModal }} />

          </Col>}

          {Boolean(selected) && (
            <TouchableOpacity onPress={clearSelected} style={{ width: '100%', height: '100%', position: 'absolute' }}>
              <MessageMenu {...{ interactWithSelected, react, selected, color, isOwnMsg, canEdit, canResend, canDelete, backgroundColor, clearSelected }} />
            </TouchableOpacity>
          )}

          {showSendTokensModal && <SendTokensModal convo={chatId} show={showSendTokensModal} hide={() => setShowSendTokensModal(false)} />}
          {showPollModal && <PollInput convo={chatId} show={showPollModal} hide={() => setShowPollModal(false)} />}
        </>
      )}
    </KeyboardAvoidingView>
  )
}
