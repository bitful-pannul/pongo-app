import 'react-native-gesture-handler'
import 'setimmediate'
import { StatusBar } from "expo-status-bar"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, Alert, AppState, AppStateStatus, Button, StyleSheet, Text, View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import { MenuProvider } from 'react-native-popup-menu'
import { RootSiblingParent } from 'react-native-root-siblings'
import Toast from 'react-native-root-toast'
import { enableFreeze } from 'react-native-screens'
import * as Network from 'expo-network'
import { Ionicons } from "@expo/vector-icons"
import dynamicLinks from '@react-native-firebase/dynamic-links'

import useCachedResources from "./hooks/useCachedResources"
import useStore from "./state/useStore"
import Navigation, { navReset, navTo } from "./navigation"
import LoginScreen from "./screens/Login"
import storage from "./util/storage"
import { URBIT_HOME_REGEX } from "./util/regex"
import { getNotificationData, showNotification } from './util/notification'
import useColors from './hooks/useColors'
import useColorScheme from './hooks/useColorScheme'
import usePongoStore from './state/usePongoState'
import { NotifPayload } from './types/Pongo'
import { isWeb } from './constants/Layout'
import { ONE_SECOND } from './util/time'
import { defaultOptions } from './util/toast'
import { fromUd } from './util/number'

if (!isWeb) {
  enableFreeze(true)
}

const HANDLE_NOTIFICATION_BACKGROUND = 'HANDLE_NOTIFICATION_BACKGROUND'

TaskManager.defineTask(HANDLE_NOTIFICATION_BACKGROUND, async ({ data, error, executionInfo }) => {
  const payload = data as NotifPayload
  showNotification(payload)
})

if (!isWeb) {
  Notifications.registerTaskAsync(HANDLE_NOTIFICATION_BACKGROUND)
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  }),
})

export default function App() {
  const isLoadingComplete = useCachedResources()
  const { loading, setLoading, ship: self, shipUrl, authCookie, loadStore, needLogin, setNeedLogin, setShip, addShip } = useStore()
  const { currentChat, chats, connected: shipConnected, set, getMessages } = usePongoStore()
  const { color, backgroundColor } = useColors()
  const colorScheme = useColorScheme()
  const [connected, setConnected] = useState(true)
  const appState = useRef(AppState.currentState)
  const notificationListener = useRef<any>()
  const responseListener = useRef<any>()
  const [inviteUrl, setInviteUrl] = useState<string | undefined>()

  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const { ship, conversation_id, message_id, author, kind } = getNotificationData(response?.notification)
    if (ship && self && shipUrl && conversation_id && message_id) {
      const destination = kind === 'webrtc-call' ?
        { name: 'Call', params: { chatId: conversation_id, ship: author } } :
        { name: 'Chat', params: { id: conversation_id, msgId: message_id } }

      if (ship !== self) {
        setShip(ship)
        // Navigating from another app
        setTimeout(() => navTo('Pongo'), ONE_SECOND * 0.5)
        setTimeout(() => navReset({ index: 0, routes: [{ name: 'Chats' }, destination ] }), ONE_SECOND)
      } else {
        navTo('Pongo')
        navReset({ index: 0, routes: [{ name: 'Chats' }, destination ] })
      }
    }
    Notifications.setBadgeCountAsync(0)
  }, [self, shipUrl, setShip])

  const lastNotificationResponse = Notifications.useLastNotificationResponse()
  useEffect(() => {
    if (lastNotificationResponse) {
      handleNotificationResponse(lastNotificationResponse)
    }
  }, [lastNotificationResponse])

  useEffect(() => {
    if (!isWeb) {
      const totalUnreads = Object.values(chats).reduce((total, { unreads }) => total + unreads, 0)
      Notifications.setBadgeCountAsync(totalUnreads).catch(console.warn)
      Notifications.getPresentedNotificationsAsync()
        .then((notifications: Notifications.Notification[]) => {
          notifications.forEach(n => {
            const convo = n.request?.content?.data?.conversation_id as any
            const msgId = n.request?.content?.data?.message_id as any
            if (convo && msgId && chats[convo] && fromUd(chats[convo].conversation.last_read || '0') >= fromUd(msgId)) {
              Notifications.dismissNotificationAsync(n.request.identifier)
            }
          })
        })
    }
  }, [chats])

  const checkNetwork = useCallback(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync()
      setConnected(Boolean(networkState.isInternetReachable))
      set({ connected: Boolean(networkState.isInternetReachable) })
    } catch {}
  }, [set, setConnected])

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        Notifications.setBadgeCountAsync(0)
        const payload = getNotificationData(notification)

        if (currentChat !== payload.conversation_id && payload.kind !== 'webrtc-call') {
          if (notification.request.content.title?.length) {
            return { shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }
          }

          showNotification(payload)
        }
        
        return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false }
      },
    })
  }, [self, currentChat])

  useEffect(() => {
    set({ currentChat: undefined })
    responseListener.current = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse)
    Notifications.setBadgeCountAsync(0)
    
    const loadStorage = async () => {
      const networkState = await Network.getNetworkStateAsync()
      const isConnected = Boolean(networkState.isInternetReachable)
      setConnected(isConnected)

      if (!isConnected) {
        return Alert.prompt(
          'Network Connection Issue',
          'Do you want to try to reconnect?',
          [
            {
              text: 'Reconnect',
              onPress: loadStorage,
              style: 'default',
            },
            {
              text: 'Cancel',
              onPress: () => null,
              style: 'cancel',
            },
          ],
        )
      }

      const res = await storage.load({ key: 'store' }).catch(console.error)

      if (res?.shipUrl) {
        const response = await fetch(res.shipUrl).catch(console.error)
        const html = await response?.text()

        if (html && URBIT_HOME_REGEX.test(html)) {
          loadStore(res)
        }
        setNeedLogin(false)
      }
      
      setTimeout(() => setLoading(false), 200)
    }

    if (isWeb) {
      addShip({ ship: window.ship, shipUrl: '/' })
      setNeedLogin(false)
      setTimeout(() => setLoading(false), 200)
    } else {
      loadStorage()
      checkNetwork()
    }

    // firebase dynamic link format
    // https://ping.page.link/?link=https%3A%2F%2Fuqbar.network%3Finvite-code%3D067B-CA90-8F0F&apn=network.uqbar.ping&amv=1.0.1&ibi=uqbar.network.ping&isi=1669043343&imv=1.0.1
    if (!isWeb && !__DEV__) {
      dynamicLinks()
        .getInitialLink()
        .then(link => {
          if (link?.url.includes('invite-code')) {
            setInviteUrl(link.url)
          }
        })
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active")
        checkNetwork()
      appState.current = nextAppState
    }

    const appStateListener = AppState.addEventListener("change", handleAppStateChange)

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current)
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current)
      appStateListener.remove()
    }
  }, [])

  useEffect(() => {
    if (shipUrl) {
      const checkShipInterval = setInterval(async () => {
        const networkState = await Network.getNetworkStateAsync()
        if ((!networkState.isInternetReachable && !shipConnected) || (networkState.isInternetReachable && shipConnected)) {
          return
        } else if (!networkState.isInternetReachable && shipConnected) {
          set({ connected: false })
          Toast.show('Ship connection lost', defaultOptions)
          return
        }

        fetch(shipUrl)
          .then(res => {
            const isConnected = res.status < 400
            if (!shipConnected && isConnected) {
              Toast.show('Ship connection restored', defaultOptions)
            }
            set({ connected: isConnected })
          })
          .catch(() => {
            if (shipConnected) {
              set({ connected: false })
              Toast.show('Ship connection lost', defaultOptions)
            }
          })
      }, 10 * ONE_SECOND)

      return () => clearInterval(checkShipInterval)
    }
  }, [shipUrl, shipConnected])

  if (!connected) {
    return (
      <View
        style={{
          backgroundColor,
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="cloud-offline-outline" size={40} color={color} />
        <Text style={{ color, padding: 32, lineHeight: 20, textAlign: 'center' }}>
          You are offline, {'\n'}please check your connection and then refresh.
        </Text>
        <Button title="Retry Connection" onPress={checkNetwork} />
      </View>
    )
  }

  return (
    <RootSiblingParent>
      <MenuProvider>
        <SafeAreaProvider style={{ backgroundColor, height: '100%', width: '100%' }}>
          <StatusBar translucent style={colorScheme === 'dark' ? 'light' : 'dark'} />
          {(needLogin && (!shipUrl || !self || !authCookie)) ? (
            <LoginScreen inviteUrl={inviteUrl} />
          ) : (
            <Navigation colorScheme={colorScheme} />
          )}
          {(!isLoadingComplete || loading) && (
            <View style={{ ...styles.loadingOverlay, backgroundColor }}>
              <ActivityIndicator size="large" color={color} />
            </View>
          )}
        </SafeAreaProvider>
      </MenuProvider>
    </RootSiblingParent>
  )
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  shipInputView: {
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
  },
  welcome: {
    marginTop: 24,
  },
  loadingOverlay: {
    height: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  }
})
