import { NavigationProp, useNavigation } from "@react-navigation/native"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View, Animated, ActivityIndicator, Keyboard, TouchableOpacity, Linking } from "react-native"
import * as Haptics from 'expo-haptics'

import { PongoStackParamList } from "../../../types/Navigation"
import { blue_overlay, blue_overlay_transparent, medium_gray, uq_pink } from "../../../constants/Colors"
import { window } from "../../../constants/Layout"
import useColors from "../../../hooks/useColors"
import { Message } from "../../../types/Pongo"
import { getAdminMsgText, getAppLinkText, isAdminMsg } from "../../../util/ping"
import { addSig, deSig } from "../../../util/string"
import { ONE_SECOND } from "../../../util/time"
import Col from "../../spacing/Col"
import Avatar from "../Avatar"
import ShipName from "../ShipName"
import Content from "./Content"
import MessageWrapper from "./MessageWrapper"
import Swipeable from 'react-native-gesture-handler/Swipeable'
import { getShipColor } from "../../../util/number"
import usePongoStore from "../../../state/usePongoState"

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

export default function MessageEntry({
  index, message, chatId, self, messages, highlighted, isDm = false, selected,
  onPress, focusReply, addReaction, onSwipe,
}: MessageEntryProps) {
  const msgRef = useRef<View | null>(null)
  const swipeRef = useRef<Swipeable | null>(null)
  const { color: defaultColor, backgroundColor, ownChatBackground } = useColors()
  const navigation = useNavigation<NavigationProp<any>>()
  const { api } = usePongoStore()
  const [quotedMsg, setQuotedMsg] = useState<Message | undefined>()
  const [quotedMsgNotFound, setQuotedMsgNotFound] = useState(false)

  const onSwipeLeft = useCallback(() => {
  }, [])

  const { id, author, content, kind, reference } = message
  const isSelf = useMemo(() => deSig(author) === deSig(self), [author, self])
  const color = useMemo(() => isSelf ? 'white' : defaultColor, [isSelf, defaultColor]) 
  const differentAuthor = useMemo(() => !messages[index + 1] || isAdminMsg(messages[index + 1]) || messages[index + 1]?.author !== author, [messages, author])
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

  const { width } = window

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginBottom: index === 0 ? 8 : 0,
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
      maxWidth: isDm || isSelf ? width * 0.86 : width * 0.86 - 48,
      minWidth: 140,
      alignSelf: isSelf ? 'flex-end' : 'flex-start',
      marginRight: isSelf ? width * 0.02 : 0,
      marginLeft: isSelf ? 0 : width * 0.02,
      backgroundColor: isSelf ? ownChatBackground : backgroundColor,
      borderTopLeftRadius: isSelf ? 15 : 0,
      borderTopRightRadius: isSelf ? 6 : 15,
      borderBottomLeftRadius: isSelf ? 15 : 6,
      borderBottomRightRadius: isSelf ? 0 : 15,
      padding: 3,
      paddingHorizontal: 12,
      opacity: 0.85
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
  }), [differentAuthor, isSelected, isSelf, ownChatBackground, backgroundColor, width])

  const pressReply = useCallback(() => {
    focusReply(reference)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  }, [reference])

  const goToAppLink = useCallback((path: string) => () => {
    navigation.navigate('Grid', { path })
  }, [])

  const measure = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    msgRef.current?.measure((fx, fy, width, height, px, py) => { onPress(py, height) })
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 60, useNativeDriver: true })
    ]).start();
  }, [msgRef])

  const dismissKeyboard = useCallback(() => Keyboard.dismiss(), [])

  const renderContent = () => {
    if (kind === 'text' || kind === 'code') {
      return (
        <View style={styles.authorWrapper}>
          {!isDm && !isSelf && (
            <View style={{ marginLeft: '2%', marginTop: 2, width: 40 }}>
              {showAvatar && (
                <Pressable onPress={() => navigation.navigate('Profile', { ship: author })}>
                  <Avatar ship={author} size="group-chat" />
                </Pressable>
              )}
            </View>
          )}

          <Pressable ref={msgRef} onLongPress={measure} onPress={dismissKeyboard}>
            <Animated.View style={[styles.message, { transform: [{translateX: shakeAnimation}] }]}>
                {/* <Swipeable ref={swipeRef} rightThreshold={100} onSwipeableWillOpen={swipeReply}
                  renderRightActions={() => <Ionicons name="chatbubble" color={backgroundColor} size={20} style={{ marginRight: 16 }} />}
                  overshootFriction={8}
                > */}
                  {showAvatar && <ShipName name={author} style={{ fontSize: 16, fontWeight: '600', color: getShipColor(author) }} />}
                  {Boolean(reference) && (quotedMsg ? (
                    <TouchableOpacity onPress={pressReply}>
                      <Col style={styles.reply}>
                        <Text style={styles.replyAuthor}>{quotedMsg?.author}</Text>
                        <Text numberOfLines={1} style={[styles.text, { fontSize: 14 }]}>{quotedMsg?.content}</Text>
                      </Col>
                    </TouchableOpacity>
                  ) : quotedMsgNotFound ? (
                    <Col style={[styles.reply, { height: 20 }]}>
                      <Text style={[styles.text, { fontSize: 14, marginTop: 2 }]}>Message not found</Text>
                    </Col>
                  ) : (
                    <ActivityIndicator color={color} style={{ alignSelf: 'flex-start', marginLeft: 2, marginBottom: 14, marginTop: 13 }} />
                  ))}
                  <MessageWrapper {...{ message, color, showStatus, addReaction }}>
                    <Content content={content} color={color} />
                  </MessageWrapper>
                {/* </Swipeable> */}
            </Animated.View>
          </Pressable>
        </View>
      )
    } else if (kind === 'app-link') {
      return (
        <View style={styles.authorWrapper}>
          {!isDm && !isSelf && (
            <View style={{ marginLeft: '2%', marginTop: 2, width: 40 }}>
              {showAvatar && (
                <Pressable onPress={() => navigation.navigate('Profile', { ship: author })}>
                  <Avatar ship={author} size="group-chat" />
                </Pressable>
              )}
            </View>
          )}

          <Pressable ref={msgRef} onLongPress={measure} onPress={dismissKeyboard}>
            <Animated.View style={[styles.message, { transform: [{translateX: shakeAnimation}] }]}>
              {/* <Swipeable ref={swipeRef} rightThreshold={100} onSwipeableWillOpen={swipeReply}
                renderRightActions={() => <Ionicons name="chatbubble" color={backgroundColor} size={20} style={{ marginRight: 16 }} />}
                overshootFriction={8}
              > */}
                {showAvatar && <ShipName name={author} style={{ fontSize: 16, fontWeight: '600', color: getShipColor(author) }} />}
                <MessageWrapper {...{ message, color, showStatus, addReaction }}>
                  {content.includes('/apps/pokur') && <Text style={styles.text}>Join my Pokur table: </Text>}
                  <Text onPress={goToAppLink(content)} style={[styles.text, { textDecorationLine: 'underline' }]}>{getAppLinkText(content)}</Text>
                </MessageWrapper>
              {/* </Swipeable> */}
            </Animated.View>
          </Pressable>
        </View>
      )
    } else if (kind === 'member-add' ||
      kind === 'member-remove' ||
      kind === 'change-name' ||
      kind === 'leader-add' ||
      kind === 'leader-remove' ||
      kind === 'change-router'
    ) {
      return <MessageWrapper style={styles.adminMessage} {...{ message }} color='white'>
        <Text style={[styles.text, { color: 'white' }]}>{getAdminMsgText(kind, content)}</Text>
      </MessageWrapper>
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
}
