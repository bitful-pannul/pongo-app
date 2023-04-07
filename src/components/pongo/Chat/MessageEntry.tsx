import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import * as Haptics from 'expo-haptics'
import { StyleSheet, Text, View, Animated, Keyboard } from "react-native"
import { NavigationProp, useNavigation } from "@react-navigation/native"

import { blue_overlay, blue_overlay_transparent, medium_gray, uq_pink } from "../../../constants/Colors"
import { isWeb } from "../../../constants/Layout"
import useColors from "../../../hooks/useColors"
import { Message } from "../../../types/Pongo"
import { formatTokenContent, getAdminMsgText, getAppLinkText, isAdminMsg } from "../../../util/ping"
import { addSig, deSig } from "../../../util/string"
import { ONE_SECOND } from "../../../util/time"
import Content from "./Content"
import MessageWrapper from "./MessageWrapper"
import Swipeable from 'react-native-gesture-handler/Swipeable'
import usePongoStore from "../../../state/usePongoState"
import useDimensions from "../../../hooks/useDimensions"
import ReactionsWrapper from "./ReactionsWrapper"
import PollMessage from "./PollMessage"

const processReference = (msg: { notification: { author: string, content: string } }, id: string): Message => {
  const { notification: { author, content } } = msg
  return {
    id, author: addSig(author),
    timestamp: 0,
    kind: 'text',
    content,
    reactions: {},
    edited: false,
    reference: null,
  }
}

interface MessageEntryProps {
  index: number;
  message: Message;
  self: string;
  messages: Message[];
  highlighted: boolean;
  chatId: string;
  isDm?: boolean;
  selected?: string;
  addReaction: (emoji: string) => void;
  focusReply: (msgId: string | null) => void;
  onPress: (offsetY: number, height: number) => void;
  onSwipe: (msg: Message) => void;
}

const MessageEntry = React.memo(({
  index, message, chatId, self, messages, highlighted, isDm = false, selected,
  onPress, focusReply, addReaction, onSwipe,
}: MessageEntryProps) => {
  const msgRef = useRef<View | null>(null)
  const swipeRef = useRef<Swipeable | null>(null)
  const { color: defaultColor, backgroundColor, ownChatBackground } = useColors()
  const navigation = useNavigation<NavigationProp<any>>()
  const { api } = usePongoStore()
  const [quotedMsg, setQuotedMsg] = useState<Message | undefined>()
  const [quotedMsgNotFound, setQuotedMsgNotFound] = useState(false)
  const { cWidth } = useDimensions()

  const onSwipeLeft = useCallback(() => {}, [])

  const { id, author, content, kind, reference } = message
  const isSelf = useMemo(() => deSig(author) === deSig(self), [author, self])
  const color = useMemo(() => isSelf ? 'white' : defaultColor, [isSelf, defaultColor]) 
  const differentAuthor = useMemo(() => !messages[index + 1] || isAdminMsg(message) || isAdminMsg(messages[index + 1]) || messages[index + 1]?.author !== author, [messages, author])
  const showAvatar = useMemo(() => !isDm && !isSelf && !isAdminMsg(message) && differentAuthor, [isDm, isSelf, differentAuthor])
  const showStatus = useMemo(() => isSelf && message.status !== null && !messages[index - 1]?.status, [isSelf, message, messages])
  const isSelected = useMemo(() => selected === id, [selected, id])

  const [highlight] = useState(new Animated.Value(highlighted ? 1 : 0))
  const [shakeAnimation] = useState(new Animated.Value(0))

  useEffect(() => {
    const getQuotedMsg = async () => {
      if (reference && !quotedMsg && api) {
        try {
          const msg = messages?.find(m => m.id === reference) ||
            processReference(await api.scry({ app: 'pongo', path: `/notification/${chatId}/${reference}` }), reference)
          
          setQuotedMsg(msg)

          if (!msg) {
            setQuotedMsgNotFound(true)
          }
        } catch {
          setQuotedMsgNotFound(true)
        }
      }
    }
    getQuotedMsg()
  }, [])

  useEffect(() => {
    if (highlighted) {
      Animated.timing(highlight, {
        toValue: 1,
        duration: ONE_SECOND / 4,
        useNativeDriver: false,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(highlight, {
            toValue: 0,
            duration: 1 * ONE_SECOND / 4,
            useNativeDriver: false,
          }).start()
        }, ONE_SECOND * 2)
      })
    }
  }, [highlighted])

  const swipeReply = useCallback((direction: 'right' | 'left') => {
    if (direction === 'right') {
      onSwipe(message)
      swipeRef.current?.close()
    }
  }, [message, swipeRef, onSwipe])

  const chatWidth = useMemo(() => cWidth, [cWidth])

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginTop: differentAuthor ? 6 : 0,
      paddingVertical: 1,
      paddingBottom: 1,
      opacity: isSelected ? 0.2 : undefined,
    },
    authorWrapper: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: isSelf ? 'flex-end' : 'flex-start'
    },
    message: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: isDm || isSelf ? chatWidth * 0.86 : chatWidth * 0.86 - 48,
      minWidth: 140,
      alignSelf: isSelf ? 'flex-end' : 'flex-start',
      marginRight: isSelf ? chatWidth * 0.02 : 0,
      marginLeft: isSelf ? 0 : chatWidth * 0.02,
      backgroundColor: message.kind === 'send-tokens' ? 'rgb(150, 200, 150)' : isSelf ? ownChatBackground : backgroundColor,
      borderTopLeftRadius: isSelf ? 15 : 0,
      borderTopRightRadius: isSelf ? 6 : 15,
      borderBottomLeftRadius: isSelf ? 15 : 6,
      borderBottomRightRadius: isSelf ? 0 : 15,
      padding: 3,
      paddingHorizontal: 12,
      opacity: 0.85,
    },
    adminMessage: {
      maxWidth: '84%',
      alignSelf: 'center',
      marginHorizontal: '8%',
      marginBottom: 4,
      backgroundColor: medium_gray,
      borderRadius: 8,
      padding: 4,
      paddingHorizontal: 12,
      color: 'white',
    },
    reply: {
      borderLeftWidth: 3,
      borderLeftColor: uq_pink,
      paddingLeft: 4,
      backgroundColor: 'transparent',
      marginBottom: 6,
      marginTop: 4,
    },
    replyAuthor: {
      color,
      fontSize: 14,
      fontWeight: '600',
    },
    text: {
      fontSize: 16,
      color,
    },
    image: {
      width: '100%',
    },
  }), [differentAuthor, isSelected, isSelf, ownChatBackground, backgroundColor, chatWidth, message])

  const pressReply = useCallback(() => {
    focusReply(reference)
    if (!isWeb) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    }
  }, [reference])

  const replyToMessage = useCallback(() => onSwipe(message), [message])

  const goToAppLink = useCallback((path: string) => () => {
    if (isWeb) {
      window.open(`${window.location.host}${path}`, '_blank')
    } else {
      navigation.navigate('Grid', { path })
    }
  }, [])

  const measure = useCallback(() => {
    if (!isWeb) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    }
    msgRef.current?.measure((fx, fy, width, height, px, py) => { onPress(py, height) })
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 60, useNativeDriver: true })
    ]).start();
  }, [msgRef])

  const dismissKeyboard = useCallback(Keyboard.dismiss, [measure])

  const renderContent = () => {
    const textColor = kind === 'send-tokens' ? 'black' : color
    const messageWrapperProps = {
      isDm, showAvatar, isSelf, author, styles, navigation, msgRef, shakeAnimation, reference, quotedMsg, color: textColor,
      showStatus,quotedMsgNotFound, message, pressReply, replyToMessage, addReaction, measure, dismissKeyboard,
    }

    if (kind === 'text' || kind === 'code' || kind === 'send-tokens') {
      return (
        <MessageWrapper {...messageWrapperProps}>
          <Content
            onLongPress={measure} delayLongPress={200}
            color={textColor} author={message.author}
            nextMessage={messages[index - 1]}
            content={kind !== 'send-tokens' ? content : formatTokenContent(content)}
          />
        </MessageWrapper>
      )
    } else if (kind === 'app-link') {
      return (
        <MessageWrapper {...messageWrapperProps}>
          {content.includes('/apps/pokur') && <Text style={styles.text}>Join my Pokur table: </Text>}
          <Text onPress={goToAppLink(content)} style={[styles.text, { textDecorationLine: 'underline' }]}>{getAppLinkText(content)}</Text>
        </MessageWrapper>
      )
    } else if (kind === 'poll') {
      return (
        <MessageWrapper {...messageWrapperProps} hideReactions>
          <PollMessage {...{ message, self, color, addReaction }} />
        </MessageWrapper>
      )
    } else if (kind === 'member-add' ||
      kind === 'member-remove' ||
      kind === 'change-name' ||
      kind === 'leader-add' ||
      kind === 'leader-remove' ||
      kind === 'change-router'
    ) {
      return <ReactionsWrapper style={styles.adminMessage} {...{ message }} color='white'>
        <Text style={[styles.text, { color: 'white' }]}>{getAdminMsgText(kind, content)}</Text>
      </ReactionsWrapper>
    }

    return null
  }

  if (message.content === '' && message.edited) {
    return null
  }

  return (
    <Animated.View style={[styles.container, {
      backgroundColor: highlight.interpolate({
        inputRange: [0, 1],
        outputRange: [blue_overlay_transparent, blue_overlay],
      })
    }]}>
      {renderContent()}
    </Animated.View>
  )
}, (pP, nP) => {
  return pP.index === nP.index && pP.message.id === nP.message.id && pP.self === nP.self &&
    pP.chatId === nP.chatId && pP.isDm === nP.isDm && pP.selected === nP.selected &&
    pP.messages.length === nP.messages.length && pP.highlighted === nP.highlighted
})

export default MessageEntry
