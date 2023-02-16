import { isValidPatp } from 'urbit-ob'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus, Pressable, RefreshControl } from 'react-native'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { getPresentedNotificationsAsync, dismissNotificationAsync, setBadgeCountAsync, Notification } from 'expo-notifications'

import useStore from '../../state/useStore'
import usePongoStore from '../../state/usePongoState'
import ChatsEntry from '../../components/pongo/ChatsEntry'
import Col from '../../components/spacing/Col'
import { Text, ScrollView, TextInput } from '../../components/Themed'
import H2 from '../../components/text/H2'
import { PongoStackParamList } from '../../types/Navigation'
import { MaterialIcons } from '@expo/vector-icons'
import { light_gray, uq_pink } from '../../constants/Colors'
import Button from '../../components/form/Button'
import Modal from '../../components/popup/Modal'
import { isLargeDevice, window } from '../../constants/Layout'

interface ChatsScreenProps {
}

export default function ChatsScreen({  }: ChatsScreenProps) {
  const { chats, init, set, makeInviteRequest, refresh, sortedChats, showJoinChatModal } = usePongoStore()
  const { api, shipUrl } = useStore()
  const navigation = useNavigation<NavigationProp<PongoStackParamList>>()
  const appState = useRef(AppState.currentState)

  const [joinId, setJoinId] = useState('')
  const [joinShip, setJoinShip] = useState('~')
  const [joinIdError, setJoinIdError] = useState('')
  const [joinShipError, setJoinShipError] = useState('')

  const onRefresh = useCallback(async () => {
    try {
      if (api) {
        await init(api, false)
      }
    } catch {}
  }, [api])

  const inputJoinId = useCallback((text: string) => {
    setJoinId(text)
    setJoinIdError('')
  }, [])

  const inputJoinShip = useCallback((text: string) => {
    setJoinShip(text)
    setJoinShipError('')
  }, [])

  const joinChat = useCallback(async () => {
    if (!joinId) {
      setJoinIdError('Please enter a hex num ID')
    } else if (!isValidPatp(joinShip)) {
      setJoinShipError('Please enter a valid @p (username)')
    } else {
      try {
        const success = await makeInviteRequest(joinId, joinShip)
        if (success) {
          navigation.navigate('Chat', { id: joinId })
        }
        setJoinId('')
        setJoinShip('~')
        set({ showJoinChatModal: false })
      } catch (err) {
        setJoinShipError('Error joining the chat, please try again')
      }
    }
  }, [joinId, joinShip, makeInviteRequest])

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        refresh(shipUrl)
      }
      appState.current = nextAppState
    }
    const appStateListener = AppState.addEventListener("change", handleAppStateChange)
    return appStateListener.remove
  }, [shipUrl])

  useEffect(() => {
    const totalUnreads = Object.values(chats).reduce((total, { unreads }) => total + unreads, 0)
    setBadgeCountAsync(totalUnreads).catch(console.warn)
    getPresentedNotificationsAsync()
      .then((notifications: Notification[]) => {
        notifications.forEach(n => {
          const convo = n.request?.content?.data?.conversation_id as any
          const msgId = n.request?.content?.data?.message_id as any
          if (convo && msgId && chats[convo] && Number(chats[convo].conversation.last_read || 0) > Number(msgId)) {
            dismissNotificationAsync(n.request.identifier)
          }
        })
      })
  }, [chats])

  const { width } = window

  return (
    <Col style={{ height: '100%', width: isLargeDevice ? width / 4 : '100%', borderRightWidth: 1, borderColor: light_gray }}>
      {!sortedChats.length ? (
        <Col style={{ alignSelf: 'center', marginTop: 32 }}>
          <H2 text='No Chats' />
        </Col>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />} keyboardShouldPersistTaps='handled'>
          {sortedChats.map(chat => <ChatsEntry key={chat.conversation.id} chat={chat} navigation={navigation} />)}
        </ScrollView>
      )}

      <Pressable
        onPress={() => navigation.navigate('NewChat')}
        style={{ width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: uq_pink,
        position: 'absolute',
        padding: 14,
        bottom: 40,                            
        right: 24, }}
      >
        <MaterialIcons name='edit' color='white' size={32} />
      </Pressable>

      <Modal show={showJoinChatModal} hide={() => set({ showJoinChatModal: false })}>
        <Col style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18 }}>
            Enter the chat ID and any {'\n'} ship (user) in the chat
          </Text>
          <TextInput
            placeholder="Chat ID"
            value={joinId}
            onChangeText={inputJoinId}
            autoFocus
            style={{ marginTop: 8, width: '80%' }}
          />
          {Boolean(joinIdError) && <Text style={{ fontSize: 16, color: 'red', margin: 4 }}>{joinIdError}</Text>}
          <TextInput
            placeholder="Any ship (user) in the chat"
            value={joinShip}
            onChangeText={inputJoinShip}
            style={{ marginTop: 8, width: '80%' }}
          />
          {Boolean(joinShipError) && <Text style={{ fontSize: 16, color: 'red', margin: 4 }}>{joinShipError}</Text>}
          <Button title='Join' small onPress={joinChat} style={{ marginTop: 16 }} />
          <Button title='Cancel' small onPress={() => set({ showJoinChatModal: false })} style={{ marginTop: 16, marginBottom: 24 }} />
        </Col>
      </Modal>
    </Col>
  )
}
