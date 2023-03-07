import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { TextInput, NativeSyntheticEvent, Pressable, TextInputKeyPressEventData, ActivityIndicator, Text } from "react-native"
import { light_gray, medium_gray, uq_purple } from "../../../constants/Colors"
import { isIos, isLargeDevice } from "../../../constants/Layout"
import { MENTION_REGEX } from "../../../constants/Regex"
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
}

export default function ChatInput({ chatId, inputRef, showMentions, setShowMentions, setPotentialMentions, setShowSendTokensModal }: ChatInputProps) {
  const { ship: self } = useStore()
  const { chats, drafts, edits, replies, setDraft, sendMessage, setReply, setEdit, editMessage } = usePongoStore()

  const chat = chats[chatId]
  const edit = useMemo(() => edits[chatId], [edits, chatId])
  const reply = useMemo(() => replies[chatId], [replies, chatId])
  const isDm = useMemo(() => checkIsDm(chat), [chat])

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

  const send = useCallback(async () => {
    if (text.trim().length > 0) {
      setSending(true)
      try {
        if (edit) {
          editMessage(chatId, edit.id, text)
          setEdit(chatId, undefined)
        } else {
          sendMessage({ self, convo: chatId, kind: 'text', content: text, ref: reply?.id })
          setReply(chatId, undefined)
        }
        setText('')
        if (showMentions) {
          setShowMentions(false)
        }
      } catch {}
      setSending(false)
    }
  }, [self, reply, edit, chatId, text, showMentions, setSending])

  const onKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Enter' && isLargeDevice) {
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

    if (isDm) {
      return
    }

    const mentionMatch = text.match(MENTION_REGEX)
    if (mentionMatch && !showMentions) {
      const mentionName = mentionMatch[0].replace(/\s?@/, '')
      if (mentionName.length) {
        setPotentialMentions(chat.conversation.members.filter(m => m.includes(mentionName)))
      } else {
        setPotentialMentions(chat.conversation.members)
      }
      setShowMentions(true)
    } else if (showMentions) {
      setShowMentions(false)
    }
  }, [chatId, chat, isDm, setText, setShowMentions, showMentions])

  return (
    <Row style={{ marginBottom: isIos ? 40 : 0, borderBottomWidth: 1, borderBottomColor: light_gray, backgroundColor: 'white' }}>
      {uploading ? (
        <>
          <ActivityIndicator size='large' style={{ margin: 8, marginLeft: 16 }} color='black' />
          <Text style={{ color: 'black', margin: 8 }}>Uploading...</Text>
        </>
      ) : (
        <>
          {!isRecording && (
            <TextInput ref={inputRef} placeholder='Message' value={text} onKeyPress={onKeyPress}
              onChangeText={onChangeTextInput} maxLength={1024} style={{
                backgroundColor: 'white',
                padding: 12,
                paddingRight: 8,
                borderRadius: 4,
                borderWidth: 0,
                fontSize: 16,
                flex: 6,
              }} multiline
            />
          )}
          
          {Boolean(text) ? (
            <Pressable onPress={send} disabled={sending}>
              <MaterialIcons name='send' size={32} style={{ padding: 8 }} color={sending ? medium_gray : uq_purple} />
            </Pressable>
          ) : (
            <>
              {!isRecording && <Pressable onPress={() => setShowSendTokensModal(true)} style={{ marginRight: 4 }}>
                <MaterialIcons name='attach-money' size={32} style={{ padding: 8 }} color={uq_purple} />
              </Pressable>}
              {!isRecording && <Pressable onPress={pickImage} style={{ marginRight: 6 }}>
                <Ionicons name='attach' size={32} style={{ padding: 8 }} color={uq_purple} />
              </Pressable>}
              <AudioRecorder {...{ storeAudio, setIsRecording }} />
            </>
          )}
        </>
      )}
    </Row>
  )
}
