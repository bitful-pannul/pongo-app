import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Keyboard, ScrollView, StyleSheet } from "react-native"
import { TextInput, NativeSyntheticEvent, Pressable, TextInputKeyPressEventData, ActivityIndicator, Text, View } from "react-native"
import { light_gray, medium_gray, uq_purple } from "../../../constants/Colors"
import { isIos, isWeb } from "../../../constants/Layout"
import { MENTION_REGEX } from "../../../constants/Regex"
import useDimensions from "../../../hooks/useDimensions"
import useMedia from "../../../hooks/useMedia"
import usePongoStore from "../../../state/usePongoState"
import useStore from "../../../state/useStore"
import { checkIsDm } from "../../../util/ping"
import Row from "../../spacing/Row"
import AudioRecorder from "../Chat/AudioRecorder"

interface ChatInputProps {
  chatId: string
  inputRef: React.RefObject<TextInput>
  showMentions: boolean
  setShowMentions: (value: boolean) => void
  setPotentialMentions: (value: string[]) => void
  setShowSendTokensModal: (value: boolean) => void
  setShowPollModal: (value: boolean) => void
}

export default function ChatInput({
  chatId, inputRef, showMentions, setShowMentions, setPotentialMentions, setShowSendTokensModal, setShowPollModal
}: ChatInputProps) {
  const { ship: self } = useStore()
  const { chats, drafts, edits, replies, showUqbarWallet, setDraft, sendMessage, setReply, setEdit, editMessage } = usePongoStore()

  const chat = chats[chatId]
  const edit = useMemo(() => edits[chatId], [edits, chatId])
  const reply = useMemo(() => replies[chatId], [replies, chatId])
  const isDm = useMemo(() => checkIsDm(chat), [chat])
  const { isLargeDevice, cWidth } = useDimensions()

  const [text, setText] = useState(drafts[chatId] || '')
  const [sending, setSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [uploading, setUploading] = useState(false)

  const { pickImage, storeAudio } = useMedia({ ship: self, chatId, reply, setUploading })

  useEffect(() => () => {
    setDraft(chatId, text)
  }, [chatId])

  useEffect(() => {
    setText(drafts[chatId] || '')
  }, [drafts[chatId]])

  const sendTokens = useCallback(() => {
    Keyboard.dismiss()
    setShowSendTokensModal(true)
  }, [])

  const createPoll = useCallback(() => {
    Keyboard.dismiss()
    setShowPollModal(true)
  }, [])

  const send = useCallback(async () => {
    if (text.trim().length > 0) {
      setSending(true)
      try {
        if (edit) {
          editMessage(chatId, edit.id, text)
          setEdit(chatId, undefined)
        } else {
          sendMessage({ self, convo: chatId, kind: 'text', content: text, ref: reply?.id, mentions: reply ? [reply.author] : [] })
          setReply(chatId, undefined)
        }
        setText('')
        setDraft(chatId, '')
        if (showMentions) {
          setShowMentions(false)
        }
      } catch {}
      setSending(false)
    }
  }, [self, reply, edit, chatId, text, showMentions, setSending, setDraft])

  const onKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (isWeb) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.height = 0;
          inputRef.current.style.height = inputRef.current.scrollHeight + "px";
        }
      }, 1)
    }

    if (e.nativeEvent.key === 'Enter' && !(e.nativeEvent as any).shiftKey && isLargeDevice) {
      e.preventDefault()
      e.stopPropagation()
      send()

      setTimeout(() => {
        setText('')
        if (showMentions) {
          setShowMentions(false)
        }
      }, 10)
    }
  }, [send, chatId, showMentions])

  const onChangeTextInput = useCallback((text: string) => {
    setText(text)

    if (!text.length) {
      setDraft(chatId, '')
    }

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
      setDraft(chatId, text)
    } else if (showMentions) {
      setShowMentions(false)
    }
  }, [chatId, chat, isDm, setText, setShowMentions, showMentions])

  const styles = useMemo(() => StyleSheet.create({
    textInput: {
      backgroundColor: 'white',
      paddingRight: 44,
      borderRadius: 4,
      borderWidth: 0,
      fontSize: 16,
      flex: 1,
      width: cWidth,
      minHeight: 48,
      maxHeight: 120,
      paddingLeft: 12,
      paddingTop: 12,
      paddingBottom: 8,
    },
    sendButton: {
      position: 'absolute',
      right: 4,
      top: isWeb ? 4 : 2
    },
    attachButton: {
      position: 'absolute',
      right: isWeb ? 10 : 50,
      top: 3,
    },
    sendTokensButton: {
      position: 'absolute',
      right: isWeb ? 50 : 90,
      top: 4,
    },
    createPollButton: {
      position: 'absolute',
      right: isWeb ? 94 : 134,
      top: 4,
    },
  }), [cWidth, isWeb])

  return (
    <Row style={{ marginBottom: isIos ? 40 : 0, borderBottomWidth: 1, borderBottomColor: light_gray, backgroundColor: 'white', maxHeight: 120 }}>
      {uploading ? (
        <>
          <ActivityIndicator size='large' style={{ margin: 8, marginLeft: 16 }} color='black' />
          <Text style={{ color: 'black', margin: 8 }}>Uploading...</Text>
        </>
      ) : (
        <>
          <TextInput ref={inputRef} placeholder='Message' value={text} onKeyPress={onKeyPress}
            onChangeText={onChangeTextInput} maxLength={1024} style={[styles.textInput, isWeb && { overflow: 'scroll' }]} multiline
            autoFocus={isWeb}
          />
          
          {Boolean(text) ? (
            <Pressable onPress={send} disabled={sending} style={styles.sendButton}>
              <MaterialIcons name='send' size={32} style={{ padding: 4 }} color={sending ? medium_gray : uq_purple} />
            </Pressable>
          ) : (
            <>
              {!isRecording && !isDm && <Pressable onPress={createPoll} style={styles.createPollButton}>
                <MaterialIcons name='poll' size={32} style={{ padding: 4 }} color={uq_purple} />
              </Pressable>}
              {!isRecording && showUqbarWallet && <Pressable onPress={sendTokens} style={styles.sendTokensButton}>
                <MaterialIcons name='attach-money' size={32} style={{ padding: 4 }} color={uq_purple} />
              </Pressable>}
              {!isRecording && <Pressable onPress={pickImage} style={styles.attachButton}>
                <Ionicons name='attach' size={32} style={{ padding: 4 }} color={uq_purple} />
              </Pressable>}
              {!isWeb && <AudioRecorder {...{ storeAudio, setIsRecording }} />}
            </>
          )}
        </>
      )}
    </Row>
  )
}
