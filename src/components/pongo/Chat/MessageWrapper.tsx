import React, { useCallback } from 'react'
import { Pressable, Text, View, Animated, ActivityIndicator, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { NavigationProp } from '@react-navigation/native'
import * as Clipboard from 'expo-clipboard'

import ReactionsWrapper from './ReactionsWrapper'
import { AUDIO_URL_REGEX, IMAGE_URL_REGEX } from "../../../util/string"
import Col from "../../spacing/Col"
import Avatar from "../Avatar"
import ShipName from "../ShipName"
import { getShipColor } from "../../../util/number"
import { Message } from "../../../types/Pongo"
import { isWeb } from '../../../constants/Layout'
import Toast from 'react-native-root-toast'
import { defaultOptions } from '../../../util/toast'

interface MessageWrapperProps {
  isDm: boolean;
  showAvatar: boolean;
  isSelf: boolean;
  author: string;
  styles: any;
  navigation: NavigationProp<any>
  msgRef: React.RefObject<View>;
  shakeAnimation: Animated.Value;
  reference: string | null;
  quotedMsg?: Message;
  color: string;
  showStatus: boolean;
  quotedMsgNotFound: boolean;
  children: React.ReactNode;
  message: Message;
  theme: 'light' | 'dark';
  hideReactions?: boolean
  pressReply: () => void;
  addReaction: (emoji: string) => void;
  measure: () => void;
  dismissKeyboard: () => void;
  replyToMessage: () => void;
}

const MessageWrapper = ({
  isDm,
  showAvatar,
  isSelf,
  author,
  styles,
  navigation,
  msgRef,
  shakeAnimation,
  reference,
  quotedMsg,
  color,
  theme,
  showStatus,
  quotedMsgNotFound,
  children,
  message,
  hideReactions = false,
  pressReply,
  replyToMessage,
  addReaction,
  measure,
  dismissKeyboard,
}: MessageWrapperProps) => {
  const copyPatp = useCallback(() => {
    Clipboard.setStringAsync(author)
    Toast.show('Copied!', { ...defaultOptions, duration: Toast.durations.SHORT, position: Toast.positions.CENTER })
  }, [author])

  return (
    <View style={styles.authorWrapper}>
      {!isDm && !isSelf && (
        <View style={{ marginLeft: '2%', marginTop: 2, width: 40 }}>
          {showAvatar && (
            <Pressable onPress={() => navigation.navigate('Profile', { ship: author })}>
              <Avatar ship={author} size="group-chat" color={getShipColor(author, theme)} />
            </Pressable>
          )}
        </View>
      )}

      <Pressable ref={msgRef} onLongPress={measure} onPress={dismissKeyboard} delayLongPress={200}>
        <Animated.View style={[styles.message, { transform: [{translateX: shakeAnimation}] }]}>
            {/* <Swipeable ref={swipeRef} rightThreshold={100} onSwipeableWillOpen={swipeReply}
              renderRightActions={() => <Ionicons name="chatbubble" color={backgroundColor} size={20} style={{ marginRight: 16 }} />}
              overshootFriction={8}
            > */}
              {showAvatar && (
                <Pressable onPress={copyPatp} style={{ flexShrink: 1 }}>
                  <ShipName ship={author} style={{ fontSize: 16, fontWeight: '600', color: getShipColor(author, theme), flexShrink: 1 }} />
                </Pressable>
              )}
              {Boolean(reference) && (quotedMsg ? (
                <TouchableOpacity onPress={pressReply}>
                  <Col style={styles.reply}>
                    <Text style={styles.replyAuthor}>{quotedMsg?.author}</Text>
                    <Text numberOfLines={1} style={[styles.text, { fontSize: 14 }]}>
                      {AUDIO_URL_REGEX.test(quotedMsg?.content) ? 'Voice Message' :
                        IMAGE_URL_REGEX.test(quotedMsg?.content) ? 'Image' :
                        quotedMsg?.content}
                    </Text>
                  </Col>
                </TouchableOpacity>
              ) : quotedMsgNotFound ? (
                <Col style={[styles.reply, { height: 20 }]}>
                  <Text style={[styles.text, { fontSize: 14, marginTop: 2 }]}>Message not found</Text>
                </Col>
              ) : (
                <ActivityIndicator color={color} style={{ alignSelf: 'flex-start', marginLeft: 2, marginBottom: 14, marginTop: 13 }} />
              ))}
              <ReactionsWrapper {...{ message, color, showStatus, addReaction, hideReactions }}>
                {children}
              </ReactionsWrapper>
            {/* </Swipeable> */}
        </Animated.View>
      </Pressable>

      {isWeb && !isSelf && <Ionicons style={{ marginLeft: 8, alignSelf: 'center' }} name='chatbubble' color='white' size={16} onPress={replyToMessage} />}
    </View>
  )
}

export default MessageWrapper
