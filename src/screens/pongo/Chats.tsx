import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppState, AppStateStatus, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'
import { NavigationProp, useNavigation } from '@react-navigation/native'
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu'

import useStore from '../../state/useStore'
import usePongoStore from '../../state/usePongoState'
import ChatsEntry from '../../components/pongo/Chats/ChatsEntry'
import Col from '../../components/spacing/Col'
import { Text } from '../../components/Themed'
import H2 from '../../components/text/H2'
import { PongoStackParamList } from '../../types/Navigation'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { light_gray, uq_darkpink, uq_pink, uq_purple } from '../../constants/Colors'
import Button from '../../components/form/Button'
import JoinChatModal from '../../components/pongo/Chats/JoinChatModal'
import MessageSearchResults from './MessageSearch'
import H3 from '../../components/text/H3'
import Row from '../../components/spacing/Row'
import useDimensions from '../../hooks/useDimensions'
import { Chat } from '../../types/Pongo'
import { ONE_SECOND } from '../../util/time'
import { isWeb } from '../../constants/Layout'
import useColors from '../../hooks/useColors'

const ChatsScreen = () => {
  const { showJoinChatModal, sortedChats, isSearching, set, init, refresh, getChats } = usePongoStore()
  const { api, shipUrl } = useStore()
  const appState = useRef(AppState.currentState)
  const navigation = useNavigation<NavigationProp<PongoStackParamList>>()
  const { isLargeDevice, width } = useDimensions()
  const { color, backgroundColor } = useColors()
  const [org, setOrg] = useState('All Chats')
  const [showOrgSelector, setShowOrgSelector] = useState(false)

  const drawerNavigator: any = navigation?.getParent('drawer' as any)

  const orgName = org === 'All Chats' ? 'All Chats' : 'org'
  const orgs = ['Org 1', 'Org 2']

  const onRefresh = useCallback(async () => {
    set({ currentChat: undefined })
    try {
      if (api) {
        await init(api, false)
      }
    } catch {}
  }, [api])

  useEffect(() => {
    if (api) {
      const getChatsInterval = setInterval(() => getChats(api), ONE_SECOND * 10)
      return () => clearInterval(getChatsInterval)
    }
  }, [api])

  useEffect(() => {
    if (!isWeb) {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === "active") {
          refresh(shipUrl)
        }
        appState.current = nextAppState
      }
      const appStateListener = AppState.addEventListener("change", handleAppStateChange)
      return appStateListener?.remove
    }
  }, [shipUrl])

  const startNew = useCallback(() => {
    navigation.navigate('NewChat')
  }, [navigation])

  const openDrawer = useCallback(() => {
    drawerNavigator?.openDrawer()
  }, [])

  const styles = useMemo(() => StyleSheet.create({
    container: { height: '100%', width: isLargeDevice ? Math.min(width / 3, 400) : '100%', borderRightWidth: 1, borderColor: light_gray },
    floatButton: {
      width: 54,
      height: 54,
      borderRadius: 30,
      backgroundColor: uq_pink,
      position: 'absolute',
      padding: 11,
      right: 24,
      elevation: 1,
      shadowColor: uq_darkpink,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.7,
      shadowRadius: 1,
    },
    chatsHeader: {
      backgroundColor: uq_purple,
      width: width / 3,
      maxWidth: 400,
      height: 64,
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomColor: 'rgb(216,216,216)',
      borderBottomWidth: 1
    },
    orgsHeader: { height: 40, alignItems: 'center', justifyContent: 'space-between', borderBottomColor: light_gray, borderBottomWidth: 1, paddingHorizontal: 16 },
    orgsHeaderText: { fontSize: 16, fontWeight: '600' },
  }), [width, isLargeDevice])

  const renderChat = useCallback(({ item }: { item: Chat }) => <ChatsEntry key={item.conversation.id} chat={item} navigation={navigation} />, [navigation])

  return (
    <Col style={styles.container}>
      {isLargeDevice && (
        <Row style={styles.chatsHeader}>
          <Ionicons name='menu' size={24} color='white' style={{ padding: 4, paddingLeft: 16 }} onPress={openDrawer} />
          <H3 text='Chats' style={{ color: 'white' }} />
          <View style={{ width: 44 }} />
        </Row>
      )}
      {/* <Row style={styles.orgsHeader}>
        <View style={{ width: 32 }} />
        <Text style={styles.orgsHeaderText}>{orgName}</Text>
        <Menu>
          <MenuTrigger>
            <Ionicons name='menu' size={20} color={color} style={{ padding: 4 }} />
          </MenuTrigger>
          <MenuOptions {...{ style: { backgroundColor, borderWidth: 1, borderColor: light_gray } }}>
            {org !== 'All Chats' && <MenuOption onSelect={() => setOrg('All Chats')}>
              <Row style={{ justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, paddingVertical: 2, paddingTop: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 8 }}>All Chats</Text>
              </Row>
            </MenuOption>}
            {Boolean(orgs.length) && <MenuOption onSelect={() => setShowOrgSelector(true)}>
              <Row style={{ justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, paddingVertical: 2, paddingTop: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 8 }}>Select Org</Text>
              </Row>
            </MenuOption>}
            <MenuOption onSelect={() => navigation.navigate('Orgs')}>
              <Row style={{ justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, paddingVertical: 2, paddingTop: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 8 }}>Manage Orgs</Text>
              </Row>
            </MenuOption>
            <MenuOption onSelect={() => navigation.navigate('NewOrg')}>
              <Row style={{ justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, paddingVertical: 2, paddingTop: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 8 }}>Create Org</Text>
              </Row>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </Row> */}
      {isSearching ? (
        <MessageSearchResults />
      ) : !sortedChats.length ? (
        <Col style={{ alignSelf: 'center', alignItems: 'center', marginTop: 32 }}>
          <H2 text='No Chats' />
          <Text style={{ margin: 16, fontSize: 18, textAlign: 'center' }}>Start a chat here or with the button in the bottom right:</Text>
          <Button title='New Chat' onPress={startNew} />
        </Col>
      ) : (
        <FlatList
          data={sortedChats} keyboardShouldPersistTaps='handled' renderItem={renderChat}
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
          windowSize={15}
        />
      )}

      {!isLargeDevice && <>
        <Pressable onPress={() => navigation.navigate('Contacts')} style={[styles.floatButton, { bottom: 120 }]}>
          <MaterialIcons name='group' color='white' size={32} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('NewChat')} style={[styles.floatButton, { bottom: 40 }]}>
          <MaterialIcons name='edit' color='white' size={32} />
        </Pressable>
      </>}

      <JoinChatModal show={showJoinChatModal} hide={() => set({ showJoinChatModal: false })} />
    </Col>
  )
}

export default ChatsScreen
