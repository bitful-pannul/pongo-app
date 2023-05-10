import { StyleSheet, TouchableOpacity } from "react-native"
import { NavigationProp } from "@react-navigation/native"

import { PongoStackParamList } from "../../../types/Navigation"
import useStore from "../../../state/useStore"
import { Chat } from "../../../types/Pongo"
import Col from "../../spacing/Col"
import Row from "../../spacing/Row"
import { Text } from "../../Themed"
import { medium_gray, uq_lightpurple, uq_purple } from "../../../constants/Colors"
import { checkIsDm, getMsgText, getChatName, isCallRequest, getDmCounterparty } from '../../../util/ping'
import Avatar from "../Avatar"
import { isWeb } from "../../../constants/Layout"
import { getRelativeTime, ONE_SECOND } from "../../../util/time"
import { addSig, deSig } from "../../../util/string"
import { useCallback, useEffect, useMemo, useState } from "react"
import useDimensions from "../../../hooks/useDimensions"
import usePongoStore from "../../../state/usePongoState"
import { getShipColor } from "../../../util/number"
import useColors from "../../../hooks/useColors"
import useNimiState from "../../../state/useNimiState"

interface ChatProps {
  chat: Chat
  navigation: NavigationProp<PongoStackParamList>
}

export default function ChatsEntry({ chat, navigation }: ChatProps) {
  const { ship: self } = useStore()
  const { currentChat } = usePongoStore()
  const profiles = useNimiState(state => state.profiles)
  const { isLargeDevice } = useDimensions()
  const { unreads, last_message, conversation: { id, members, last_active, name, leaders, muted } } = chat
  const chatName = getChatName(self, chat, profiles)
  const isDm = checkIsDm(chat)
  const { theme, backgroundColor } = useColors()

  const hasUnreads = unreads > 0
  const groupDisplayShip = isDm ? getDmCounterparty(self, chat) : addSig(last_message?.author || (leaders && leaders[0]) || self)

  const styles = useMemo(() => StyleSheet.create({
    chatsEntry: { width: '100%', padding: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: uq_lightpurple, backgroundColor: currentChat === id && isLargeDevice ? uq_lightpurple : backgroundColor },
    unread: { padding: 4, backgroundColor: muted ? medium_gray : uq_purple, borderRadius: 14, minWidth: 28, justifyContent: 'center' },
    unreadText: { fontSize: 14, color: 'white', fontWeight: '600' },
  }), [muted, currentChat, id, backgroundColor, isLargeDevice])

  const goToChat = useCallback(() => {
    if (isWeb && currentChat !== id) {
      navigation.reset({ index: 0, routes: [ { name: 'Chats' } ] })
    }
    setTimeout(() => navigation.navigate('Chat', { id }), 10)
  }, [isLargeDevice, id, currentChat])

  const lastAuthor = chat?.last_message?.author

  const messageDisplay = (
    <Col style={{ maxWidth: '100%', backgroundColor: 'transparent' }}>
      {last_message?.author && !isDm && (
        <Text style={{ fontWeight: '600' }}>
          {deSig(last_message?.author || '') === deSig(self) ? 'You' : lastAuthor ? profiles[lastAuthor]?.name || lastAuthor : 'unknown'}
        </Text>
      )}
      <Text style={{ fontSize: 14, marginRight: hasUnreads ? 8 : 0 }} numberOfLines={1}>
        {!lastAuthor ? (
          'No messages yet'
        ) : (
          <>
            {getMsgText(last_message?.kind || 'text', last_message?.content|| '', last_message?.author || '', self)}
          </>
        )}
      </Text>
    </Col>
  )

  return (
    <TouchableOpacity onPress={goToChat}>
      <Row style={styles.chatsEntry}>
        <Avatar size='huge' ship={groupDisplayShip} color={getShipColor(groupDisplayShip, theme)} />
        <Col style={{ marginLeft: 12, flex: 1, backgroundColor: 'transparent' }}>
          <Row style={{ flex: 1, justifyContent: 'space-between', backgroundColor: 'transparent' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginRight: 4 }} numberOfLines={1}>{chatName}</Text>
            {/* FORMAT TIME: time if today, day of the week if last week, mmm DD if last year, DD.MM.YY otherwise */}
            <Text style={{ fontSize: 14, overflow: 'visible' }}>{getRelativeTime(last_active * ONE_SECOND)}</Text>
          </Row>
          <Row style={{ flex: 1, justifyContent: 'space-between', marginTop: 4, backgroundColor: 'transparent' }}>
            <Row style={{ flex: 1, backgroundColor: 'transparent' }}>
              {messageDisplay}
            </Row>
            {hasUnreads && (
              <Row style={styles.unread}>
                <Text style={styles.unreadText}>
                  {unreads}
                </Text>
              </Row>
            )}
          </Row>
        </Col>
      </Row>
    </TouchableOpacity>
  )
}
