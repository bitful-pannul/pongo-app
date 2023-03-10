import 'react-native-gesture-handler'
import 'setimmediate'
import { StatusBar } from "expo-status-bar"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, Alert, AppState, AppStateStatus, Button, StyleSheet, Text, View } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import * as Notifications from 'expo-notifications'
import * as TaskManager from 'expo-task-manager'
import * as Network from 'expo-network'
import { Ionicons } from "@expo/vector-icons"
import { MenuProvider } from 'react-native-popup-menu'

import useCachedResources from "./hooks/useCachedResources"
import useStore from "./state/useStore"
import Navigation, { navReset } from "./navigation"
import LoginScreen from "./screens/Login"
import storage from "./util/storage"
import { URBIT_HOME_REGEX } from "./util/regex"
import { getNotificationData, showNotification } from './util/notification'
import useColors from './hooks/useColors'
import useColorScheme from './hooks/useColorScheme'
import usePongoStore from './state/usePongoState'
import { NotifPayload } from './types/Pongo'
import { isWeb } from './constants/Layout'

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
  const { currentChat, set } = usePongoStore()
  const { color, backgroundColor } = useColors()
  const colorScheme = useColorScheme()
  const [connected, setConnected] = useState(true)
  const appState = useRef(AppState.currentState)
  const notificationListener = useRef<any>()
  const responseListener = useRef<any>()

  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const { ship, conversation_id, message_id } = getNotificationData(response?.notification)
    if (ship && self && shipUrl && conversation_id) {
      if (ship !== self) {
        setShip(ship)
        // Navigating from another app doesn't work great
        // setTimeout(() => navTo('Pongo'), 1000)
        setTimeout(() => navReset({
          index: 0, routes: [{ name: 'Chats' }, { name: 'Chat', params: { id: conversation_id, msgId: message_id } } ]
        }), 1000)
      } else {
        navReset({ index: 0, routes: [{ name: 'Chats' }, { name: 'Chat', params: { id: conversation_id } } ] })
      }
    }
    Notifications.setBadgeCountAsync(0)
  }, [self, shipUrl, setShip])

  const lastNotificationResponse = Notifications.useLastNotificationResponse()
  React.useEffect(() => {
    if (lastNotificationResponse) {
      handleNotificationResponse(lastNotificationResponse)
    }
  }, [lastNotificationResponse])

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

        if (currentChat !== payload.conversation_id) {
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

      if (isWeb) {

      }

      const res = await storage.load({ key: 'store' }).catch(console.error)

      if (res?.shipUrl) {
        if (isWeb) {
          loadStore(res)
        } else {
          const response = await fetch(res.shipUrl).catch(console.error)
          const html = await response?.text()
  
          if (html && URBIT_HOME_REGEX.test(html)) {
            loadStore(res)
          }
        }
        setNeedLogin(false)
      } else if (isWeb) {
        console.log(window.ship)
        addShip({ ship: window.ship, shipUrl: '/' })
        setNeedLogin(false)
        console.log('WEB')
      }
      
      setTimeout(() => setLoading(false), 200)
    }
    loadStorage()
    checkNetwork()

    return () => {
      if (notificationListener.current)
        Notifications.removeNotificationSubscription(notificationListener.current)
      if (responseListener.current)
        Notifications.removeNotificationSubscription(responseListener.current)
    }
  }, [])

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active")
        checkNetwork()
      appState.current = nextAppState
    }

    const appStateListener = AppState.addEventListener("change", handleAppStateChange)
    return appStateListener.remove
  }, [])

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
    <MenuProvider>
      <SafeAreaProvider style={{ backgroundColor, height: '100%', width: '100%' }}>
        <StatusBar translucent style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {(needLogin && (!shipUrl || !self || !authCookie)) ? (
          <LoginScreen />
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
