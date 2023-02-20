import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import { NavigationProp, RouteProp } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  TouchableHighlight,
  TouchableOpacity,
  View as DefaultView,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { BidirectionalFlatList } from './Bidirectional'

import usePongoStore from '../../state/usePongoState'
import useStore from '../../state/useStore'
import useColors from '../../hooks/useColors'
import MessageEntry from '../../components/pongo/Message/MessageEntry'
import Row from '../../components/spacing/Row'
import { Text, View } from '../../components/Themed'
import Col from '../../components/spacing/Col'
import SwipeList from '../../components/pongo/SwipeList'
import Avatar from '../../components/pongo/Avatar'
import ShipName from '../../components/pongo/ShipName'
import MessageMenu from '../../components/pongo/Message/MessageMenu'
import { addSig } from '../../util/string'
import { checkIsDm, isAdminMsg } from '../../util/ping'
import { ONE_SECOND } from '../../util/time'
import { MENTION_REGEX } from '../../constants/Regex'
import { isIos, isLargeDevice, keyboardAvoidBehavior, keyboardOffset, window } from '../../constants/Layout'
import { blue_overlay, light_gray, uq_pink, uq_purple } from '../../constants/Colors'
import { PongoStackParamList } from '../../types/Navigation'
import { Message } from '../../types/Pongo'
import useKeyboard from '../../hooks/useKeyboard'

const RETRIEVAL_NUM = 50

interface ChatScreenProps {
  navigation: NavigationProp<PongoStackParamList>
  route: RouteProp<PongoStackParamList, 'Chat'>
}

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
  const listRef = useRef<BidirectionalFlatList>(null)
  const inputRef = useRef<TextInput>(null)
  const scrollYRef = useRef<number>(0)
  const indexRef = useRef<number>(0)
  const lastFetch = useRef<number>(0)
  const { ship, api } = useStore()
  const {
    set, chats, drafts, edits, replies, chatPositions, getChats,
    setDraft, sendMessage, getMessages, setReply, setEdit, setLastReadMsg, editMessage, sendReaction, setChatPosition
  } = usePongoStore()
  const { color, chatBackground, backgroundColor } = useColors()
  const { isKeyboardVisible, keyboardHeight } = useKeyboard()

  const [selected, setSelected] = useState<{ msg: Message; offsetY: number; height: number } | undefined>()
  const [highlighted, setHighlighted] = useState<string | null>()
  const [focused, setFocused] = useState<string | undefined>()
  const [atEnd, setAtEnd] = useState(true)
  const [gettingMessages, setGettingMessages] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [initialPositionLoad, setInitialPositionLoad] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [potentialMentions, setPotentialMentions] = useState<string[]>([])
  const [unreadInfo, setUnreadInfo] = useState<{unreads: number; lastRead: string} | undefined>()

  const chatId = route.params.id
  const msgId = route.params.msgId
  const text = drafts[chatId] || ''
  const chat = chats[chatId]
  const messages = chat?.messages || []
  const edit = useMemo(() => edits[chatId], [edits, chatId])
  const reply = useMemo(() => replies[chatId], [replies, chatId])
  const isDm = useMemo(() => checkIsDm(chat), [chat])
  const { width, height } = window

  useEffect(() => () => {
    setChatPosition(chatId, scrollYRef.current, indexRef.current)
    set({ currentChat: undefined })
    if (api) {
      getChats(api)
    }
  }, [])

  useEffect(() => {
    if (!chatId || !chats[chatId]) {
      navigation.goBack()
    } else {
      set({ currentChat: chatId })
    }

    return () => set({ currentChat: undefined })
  }, [chatId, ship])

  useEffect(() => {
    if (msgId && !initialPositionLoad) {
      setFocused(msgId)
      setInitialPositionLoad(true)
    }
     else if (chatId && chatPositions[chatId]?.offset && chatPositions[chatId]?.offset > 0 && !initialPositionLoad) {
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
          setGettingMessages(true)
          // come to msg from push notification
          if (msgId) {
            await getMessages({ chatId, msgId, numBefore: RETRIEVAL_NUM, numAfter: RETRIEVAL_NUM })
          // open with no messages
          } else if (!messages || messages.length < 1) {
            let msgs : Message[] | undefined
            if (chat.conversation.last_read === '0' && chat.last_message?.id) {
              msgs = await getMessages({ chatId, msgId: chat.last_message?.id, numBefore: 50, numAfter: 5 })
            } else {
              msgs = await getMessages({ chatId, msgId: chat.conversation.last_read, numBefore: RETRIEVAL_NUM, numAfter: RETRIEVAL_NUM })
              setUnreadIndicator({ unreads: chat?.unreads || 0, lastRead: chat.conversation.last_read }, msgs.find(({ id }) => id === chat.conversation.last_read))
            }

            if (msgs?.length) {
              msgs[0]?.id && setLastReadMsg(chatId, msgs[0].id).catch(console.warn)
            }
            
          // if the most recent message in our chat is also the last one we read (i.e. we were previously caught up)
          } else if (messages[0]?.id === chat.conversation.last_read) {
            await getMessagesOnScroll({ prepend: true })()
            setUnreadIndicator({ unreads: chat?.unreads || 0, lastRead: chat.conversation.last_read })
          // if we're near the bottom
          } else if (!chatPositions[0]?.offset || chatPositions[0].offset < 50) {
            setUnreadIndicator({ unreads: chat?.unreads || 0, lastRead: chat.conversation.last_read })
          // if we have fewer than 30 messages
          } else if (chat.last_message) {
            const msgs = await getMessages({ chatId, msgId: chat.last_message.id, numBefore: 50, numAfter: 5 })
            setUnreadIndicator({ unreads: chat.unreads, lastRead: chat.conversation.last_read }, msgs.find(({ id }) => id === chat.conversation.last_read))
            msgs[0]?.id && setLastReadMsg(chatId, msgs[0].id).catch(console.warn)
          }
        } catch {} finally {
          setGettingMessages(false)
          setInitialLoading(false)
        }
      }
    }

    getInitialMessages()
  }, [chatId, ship, msgId])

  // Set last_read message ID
  useEffect(() => {
    if (messages[0] && messages[0].id[0] !== '-' && chat && Number(messages[0].id || 0) > Number(chat.conversation.last_read)) {
      setLastReadMsg(chatId, messages[0].id).catch(console.warn)
    }
  }, [messages[0]?.id])

  // Get messages that are coming in but not showing up, might be unnecessary
  useEffect(() => {
    if (atEnd && chat?.unreads && chat.unreads > 0) {
      getMessagesOnScroll({ prepend: true })()
    }
  }, [atEnd, chat])

  useEffect(() => {
    if (focused) {
      const message = messages.find(({ id }) => id === focused)
      if (message) {
        listRef.current?.scrollToItem({ item: message, animated: true, viewPosition: 0.3 })
        setFocused(undefined)
      }
    }
  }, [focused, messages])

  const setUnreadIndicator = useCallback((data: { unreads: number; lastRead: string }, message?: Message) => {
    setUnreadInfo(data)
    message && setTimeout(() => listRef.current?.scrollToItem({ item: message, animated: true, viewPosition: 0.5 }), ONE_SECOND)
    setTimeout(() => setUnreadInfo(undefined), ONE_SECOND * 15)
  }, [])

  const send = useCallback(async () => {
    if (text.trim().length > 0) {
      try {
        if (edit) {
          editMessage(chatId, edit.id, text)
          setEdit(chatId, undefined)
        } else {
          sendMessage({ self: ship, convo: chatId, kind: 'text', content: text, ref: reply?.id })
          setReply(chatId, undefined)
        }
        setDraft(chatId, '')
        setShowMentions(false)
      } catch {}
    }
  }, [ship, reply, edit, chatId, text])

  const onTapMessage = useCallback((msg: Message) => (offsetY: number, height: number) => {
    if (!isAdminMsg(msg)) {
      setSelected({ msg, offsetY, height })
    }
  }, [])

  const focusReply = useCallback(async (msgId: string | null) => {
    if (msgId) {
      setFocused(msgId)
      const message = messages.find(({ id }) => id === msgId)

      if (message) {
        setHighlighted(msgId)
        setTimeout(() => setHighlighted(null), 2 * ONE_SECOND)
      } else {
        await getMessages({ chatId, msgId, numBefore: RETRIEVAL_NUM, numAfter: RETRIEVAL_NUM })
        setHighlighted(msgId)
        setTimeout(() => setHighlighted(null), 3 * ONE_SECOND)
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
        sendMessage({ self: ship, convo: chatId, kind: 'text', content: text, ref: reply?.id, resend: selected.msg })
      } else {

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
  
  const clearSelected = useCallback(() => {
    setSelected(undefined)
  }, [])

  const scrollToEnd = useCallback(async () => {
    lastFetch.current = Date.now()
    setTimeout(() => setAtEnd(true), 100)
    listRef.current?.scrollToOffset({ offset: 0, animated: false })
    
    setGettingMessages(true)
    if (!(chat.last_message?.id === messages[0]?.id || !chat.last_message?.id)) {
      await getMessages({ chatId, msgId: chat.last_message.id, numBefore: 60, numAfter: 2 })
    }
    setTimeout(() => setGettingMessages(false), ONE_SECOND / 2)
    scrollYRef.current = 0
    setChatPosition(chatId, 0, 0)
  }, [listRef, chatId, chat, messages])

  const getMessagesOnScroll = useCallback(({ append, prepend }: { append?: boolean; prepend?: boolean }) => async () => {
    const msgId = append ? messages[messages.length - 1].id : messages.find(({ id }) => id && id[0] !== '-')?.id
    const fetchedRecently = (Date.now() - lastFetch.current) < ONE_SECOND

    if (!msgId || fetchedRecently || msgId === '0' || msgId === chat.last_message?.id) {
      return
    }

    setGettingMessages(true)
    lastFetch.current = Date.now()

    const msgs = await getMessages({ chatId, msgId, numBefore: append ? RETRIEVAL_NUM : 0, numAfter: prepend ? RETRIEVAL_NUM : 0, append, prepend })
    if (msgs[0]?.id && prepend) {
      setLastReadMsg(chatId, msgs[0].id).catch(console.warn)
    }
    setTimeout(() => setGettingMessages(false), ONE_SECOND / 2)
  }, [chatId, chat, messages, getMessages])

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { nativeEvent: { contentOffset: { y } } } = event
    const atTheEnd = y <= 40
    setAtEnd(atTheEnd)
    const fetchedRecently = (Date.now() - lastFetch.current) < ONE_SECOND / 2

    if (!fetchedRecently && !atTheEnd && y <= (height * 2) && y <= scrollYRef.current) {
      getMessagesOnScroll({ prepend: true })()
    }
    scrollYRef.current = y
  }, [getMessagesOnScroll])

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    indexRef.current = viewableItems[viewableItems.length - 1]?.index || 0
  }, [])

  const onChangeTextInput = useCallback((text: string) => {
    setDraft(chatId, text)

    if (isDm) {
      return
    }

    const mentionMatch = text.match(MENTION_REGEX)
    if (mentionMatch) {
      const mentionName = mentionMatch[0].replace(/\s?@/, '')
      if (mentionName.length) {
        setPotentialMentions(chat.conversation.members.filter(m => m.includes(mentionName)))
      } else {
        setPotentialMentions(chat.conversation.members)
      }
      setShowMentions(true)
    } else {
      setShowMentions(false)
    }

  }, [chatId, chat, isDm, setDraft, setShowMentions])

  const selectMention = useCallback((ship: string) => () => {
    setDraft(chatId, text.replace(MENTION_REGEX, (match: string) => `${match[0] === ' ' ? ' ' : ''}~${ship} `))
    setShowMentions(false)
  }, [text])

  const onScrollToIndexFailed = useCallback(({ index }: any) => {
    try {
      setTimeout(() => listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true }), ONE_SECOND)
    } catch {}
  }, [])

  const isOwnMsg = useMemo(() => selected?.msg.author.includes(ship), [selected, ship])
  const canDelete = isOwnMsg
  const canEdit = useMemo(
    () => isOwnMsg && selected?.msg.kind === 'text' && (selected?.msg.status === 'delivered' || selected?.msg.status === 'sent'),
    [selected, isOwnMsg]
  )
  const canResend = useMemo(() => isOwnMsg && selected?.msg.kind === 'text' && selected?.msg.status === 'failed', [selected, isOwnMsg])
  const initialNumToRender = useMemo(() => Math.max((chatPositions[chatId]?.index || 0) + 1, 25), [chatPositions, chatId])
  const goToEndButtonBottom = useMemo(() => isIos ? (isKeyboardVisible ? 60 + keyboardHeight : 100) :  60, [isKeyboardVisible, keyboardHeight])
  const showDownButton = gettingMessages || !atEnd
    // || (messages.length > 0 && Number(messages[0]?.id) < Number(chat.last_message?.id) && messages[0]?.id.slice(0, 1) !== '-')

  const styles = useMemo(() => StyleSheet.create({
    textInput: {
      backgroundColor: 'white',
      padding: 12,
      paddingRight: 8,
      borderRadius: 4,
      width: width - 48,
      borderWidth: 0,
      fontSize: 16,
    },
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
  }), [])

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    return <>
      <MessageEntry
        onPress={onTapMessage(item)} messages={messages}
        focusReply={focusReply}
        index={index} message={item} self={ship}
        highlighted={highlighted === item.id}
        addReaction={addReaction(item.id)}
        isDm={chat.conversation.members.length <= 2}
        onSwipe={swipeToReply}
        chatId={chatId}
      />
      {unreadInfo && unreadInfo?.unreads > 0 && Number(unreadInfo?.lastRead) === Number(item.id) - 1 && (
        <View style={{ maxWidth: '84%', alignSelf: 'center', marginHorizontal: '8%', marginVertical: 4, backgroundColor: blue_overlay, borderRadius: 8, padding: 4, paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 16, color: 'white' }}>{unreadInfo?.unreads} Unread{unreadInfo?.unreads && unreadInfo?.unreads > 1 ? 's' : ''}</Text>
        </View>
      )}
    </>
  }, [highlighted, messages, unreadInfo])

  const keyExtractor = useCallback((item: Message) => {
    return `${item?.id || 'missing'}-${item?.timestamp}`
  }, [])

  const onKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Enter' && isLargeDevice) {
      setDraft(chatId, '')
      setShowMentions(false)
      send()
    }
  }, [send, chatId])
  
  if (!chats || !chats[chatId]) {
    return null
  }
  
  return (
    <KeyboardAvoidingView
      style={{ height: '100%', width: '100%', flex: 1 }}
      behavior={keyboardAvoidBehavior}
      keyboardVerticalOffset={keyboardOffset}
    >
      <DefaultView style={{ flex: 1 }}>
        <Image resizeMode="cover"
          source={require('../../../assets/images/uqbar-retro-background.jpg')}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3, width: '100%', height: '100%' }}
        />
        <BidirectionalFlatList
          ref={listRef}
          data={messages}
          contentContainerStyle={{ paddingVertical: 4 }}
          style={{ paddingBottom: 4, backgroundColor: chatBackground, borderBottomWidth: 0 }}
          inverted
          scrollEventThrottle={50}
          onScroll={onScroll}
          windowSize={15}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          onEndReached={getMessagesOnScroll({ append: true })}
          onEndReachedThreshold={2}
          initialNumToRender={initialNumToRender}
          onViewableItemsChanged={onViewableItemsChanged}
          onScrollToIndexFailed={onScrollToIndexFailed}
          refreshControl={<RefreshControl refreshing={false} onRefresh={getMessagesOnScroll({ prepend: true })} />}
          enableAutoscrollToTop={atEnd && !initialLoading}
          autoscrollToTopThreshold={40}
          activityIndicatorColor={color}
        />
        {showMentions && (
          <SwipeList style={{ position: 'absolute', bottom: 0, backgroundColor }} minHeight={potentialMentions.length > 1 ? 100 : 50}>
            {potentialMentions.map(mem => (
              <TouchableHighlight onPress={selectMention(mem)}>
                <Row key={`mention-${mem}`} style={{ padding: 4 }}>
                  <Avatar size='large' ship={addSig(mem)} />
                  <ShipName name={addSig(mem)} style={{ marginLeft: 8, fontSize: 18, color }} />
                </Row>
              </TouchableHighlight>
            ))}
          </SwipeList>
        )}
        {!messages?.length && (
          initialLoading ? (
            <ActivityIndicator size="large" style={{ width: '100%', padding: 40, position: 'absolute' }} />
          ) : (
            <Text style={{ fontSize: 18, padding: 40, width: '100%', position: 'absolute', top: 0, textAlign: 'center', fontWeight: '600' }}>No messages yet</Text>
          )
        )}
      </DefaultView>

      {showDownButton && (
        gettingMessages ? (
          <View style={[styles.goToEndButton, { padding: 4, borderRadius: 20, bottom: goToEndButtonBottom }]}>
            <ActivityIndicator color={color} />
          </View>
        ) : (
          <TouchableOpacity onPress={scrollToEnd} style={[styles.goToEndButton, { bottom: goToEndButtonBottom }]}>
            <Col style={{ width: 48, height: 48, borderRadius: 36, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name='chevron-down' size={36} color={uq_purple} style={{ marginTop: 4 }} />
              {!!chat?.unreads && chat.unreads > 0 && <View style={styles.unreadIndicator}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{chat.unreads}</Text>
              </View>}
            </Col>
          </TouchableOpacity>
        )
      )}
      
      <Col>
        {Boolean(reply || edit) && (
          <Row style={{ padding: 8, paddingHorizontal: 12 }}>
            <TouchableOpacity onPress={removeEditReply} style={{ marginRight: 8 }}>
              <Ionicons name='close-circle-outline' color={color} size={20} />
            </TouchableOpacity>
            <Text style={{ marginRight: 8, fontSize: 16 }}>{edit ? 'Editing' : 'Reply to'}:</Text>
            <Text numberOfLines={1} style={{ fontSize: 14, marginTop: 2, maxWidth: width - 140 }}>"{(edit || reply).content}"</Text>
          </Row>
        )}
        <Row style={{ marginBottom: isIos ? 40 : 0, borderBottomWidth: 1, borderBottomColor: light_gray, backgroundColor: 'white' }}>
          <TextInput ref={inputRef} placeholder='Message' value={text} onKeyPress={onKeyPress}
            onChangeText={onChangeTextInput} maxLength={1024} style={styles.textInput} multiline
          />
          <Pressable onPress={send}>
            <MaterialIcons name='send' size={32} style={{ padding: 8 }} color={uq_purple} />
          </Pressable>
        </Row>
      </Col>

      {Boolean(selected) && (
        <TouchableOpacity onPress={clearSelected} style={{ width: '100%', height: '100%', position: 'absolute' }}>
          <MessageMenu {...{ interactWithSelected, react, selected, color, isOwnMsg, canEdit, canResend, canDelete }} />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  )
}
