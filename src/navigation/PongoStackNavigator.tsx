import { useCallback, useEffect, useState } from 'react'
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { NavigationProp, RouteProp, useNavigation } from '@react-navigation/native'
import * as Network from 'expo-network'

import { PongoStackParamList } from "../types/Navigation"
import useStore from '../state/useStore'
import useContactState from '../state/useContactState'
import NewGroupScreen from '../screens/pongo/NewGroup'
import NewChatScreen from '../screens/pongo/NewChat'
import ChatScreen from '../screens/pongo/Chat'
import ChatsPlaceholderScreen from '../screens/pongo/ChatsPlaceholder'
import SearchResultsScreen from '../screens/pongo/SearchResults'
import ChatsScreen from '../screens/pongo/Chats'
import usePongoStore from '../state/usePongoState'
import H3 from '../components/text/H3'
import SearchHeader, { CloseSearch, OpenSearch } from '../components/pongo/Headers/SearchHeader'
import ProfileScreen from '../screens/pongo/Profile'
import NavBackButton from '../components/pongo/BackButton'
import { uq_purple } from '../constants/Colors'
import ChatMenu from '../components/pongo/Chats/ChatMenu'
import ChatHeader from '../components/pongo/Headers/ChatHeader'
import GroupScreen from '../screens/pongo/Group'
import usePosseState from '../state/usePosseState'
import { getPushNotificationToken } from '../util/notification'
import NewPosseGroupScreen from '../screens/pongo/NewPosseGroup'
import { Image, Pressable, View } from 'react-native'
import { ONE_SECOND } from '../util/time'
import { NECTAR_APP, NECTAR_HOST } from '../constants/Nectar'
import { PING_APP, PING_HOST } from '../constants/Pongo'
import Col from '../components/spacing/Col'
import Loader from '../components/Loader'
import { isLargeDevice, isWeb } from '../constants/Layout'
import SettingsScreen from '../screens/pongo/Settings'
import Button from '../components/form/Button'
import { Ionicons } from '@expo/vector-icons'
import ShipTitle from '../components/header/ShipTitle'
import ContactsScreen from '../screens/pongo/Contacts'
import { useWalletStore } from '../wallet-ui'
import Row from '../components/spacing/Row'

let checkAppsInstalledInterval: NodeJS.Timer | undefined

const Stack = createNativeStackNavigator<PongoStackParamList>()
interface NavHeaderProps {
  navigation: NavigationProp<PongoStackParamList>
  route: RouteProp<PongoStackParamList>
}

export default function PongoStackNavigator() {
  const navigation = useNavigation<NavigationProp<PongoStackParamList>>()
  const { init: initPosse, clearSubscriptions: clearPosse } = usePosseState()
  const { init: initContact, clearSubscriptions: clearContact } = useContactState()
  const { init: initPongo, isSearching, clearSubscriptions: clearPongo, notifLevel, setNotifications } = usePongoStore()
  const { initWallet, clearSubscriptions: clearWallet } = useWalletStore()
  const { api, ship: self, shipUrl } = useStore()
  const [loadingText, setLoadingText] = useState<string | undefined>()

  useEffect(() => {
    if (api) {
      getPushNotificationToken()
        .then((token) => {
          if (token) {
            setNotifications({ shipUrl, expoToken: token, level: notifLevel === 'off' ? 'low' : notifLevel })
          }
        }).catch(console.error)

      initContact(api).catch((err: any) => console.log('Contact:', err))
      initPongo(api).catch((err: any) => console.log('Pongo:', err))
      initPosse(api).catch((err: any) => console.log('Posse:', err))
      initWallet(api, {}).catch((err: any) => console.log('INIT WALLET ERROR:', err))
      // navigation.reset({ index: 0, routes: [ { name: 'Chats' } ] })
    }

    return () => {
      if (api) {
        clearContact()
        clearPosse()
        clearPongo()
        clearWallet()
      }
    }
  }, [self, shipUrl])

  useEffect(() => {
    const initInstall = async () => {
      const networkState = await Network.getNetworkStateAsync()

      if (api && Boolean(networkState.isInternetReachable)) {
        Promise.all([
          api.scry({ app: 'pongo', path: '/conversations' }),
          api.scry({ app: 'social-graph', path: '/is-installed' }),
        ])
        .catch(async () => {
          // Only go here if one of the above apps is not installed
          try {
            await api.scry({ app: 'pongo', path: '/conversations' })
          } catch {
            setLoadingText('Installing urbit apps...')
            try {
              await api.poke({ app: 'hood', mark: 'kiln-install', json: { local: PING_APP, desk: PING_APP, ship: PING_HOST } })
              setTimeout(() => initPongo(api), 20 * ONE_SECOND)
            } catch {}
          }
    
          try {
            await api.scry({ app: 'social-graph', path: '/is-installed' })
          } catch {
            setLoadingText('Installing urbit apps...')
            try {
              await api.poke({ app: 'hood', mark: 'kiln-install', json: { local: NECTAR_APP, desk: NECTAR_APP, ship: NECTAR_HOST } })
              setTimeout(() => initPosse(api), 20 * ONE_SECOND)
            } catch {}
          }
  
          // Add a setTimeout here?

          checkAppsInstalledInterval = setInterval(() => {
            Promise.all([
              api.scry({ app: 'pongo', path: '/conversations' }),
              api.scry({ app: 'social-graph', path: '/is-installed' }),
            ]).then(() => {
              clearInterval(checkAppsInstalledInterval)
              setLoadingText(undefined)
            }).catch(console.warn)
          }, 5 * ONE_SECOND)
        })
      }
    }

    if (!isWeb) {
      initInstall()
    }

    return () => clearInterval(checkAppsInstalledInterval)
  }, [api])

  const checkInstallation = useCallback(async () => {
    if (api) {
      setLoadingText('Checking installation...')
      try {
        await Promise.all([
          api.scry({ app: 'pongo', path: '/conversations' }),
          api.scry({ app: 'social-graph', path: '/is-installed' }),
        ])

        clearInterval(checkAppsInstalledInterval)
        setLoadingText(undefined)
      } catch {
        setLoadingText('Still installing, you can track progress in your ship\'s dojo...')
      }
    }
  }, [api])

  const openDrawer = useCallback((navigation: any) => () => {
    navigation.toggleDrawer()
  }, [])

  if (loadingText) {
    return (
      <Col style={{ flex: 1, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Loader text={loadingText} />
        <Button style={{ marginTop: 40 }} title='Check Installation' onPress={checkInstallation} />
      </Col>
    )
  }

  const stack = <Stack.Navigator initialRouteName="Chats" screenOptions={{ gestureEnabled: true, fullScreenGestureEnabled: true }}>
    <Stack.Screen name="Chats" component={isLargeDevice ? ChatsPlaceholderScreen : ChatsScreen}
      options={({ navigation } : NavHeaderProps) => ({
        headerStyle: { backgroundColor: uq_purple },
        headerTitleAlign: 'center',
        headerLeft: () => <Pressable onPress={openDrawer(navigation)}>
          <Ionicons style={{ padding: 2, paddingBottom: 4 }} name='menu' size={24} color='white' />
        </Pressable>,
        headerTitle: () => isSearching ? <SearchHeader searchType='message' /> : <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ marginTop: 2 }}>
            <ShipTitle navigation={navigation} color='white' />
          </View>
          <Image style={{ marginLeft: 8, height: 24, width: 24, marginTop: 1 }} source={require('../../assets/images/pongo-logo.png')} />
        </View>,
        headerRight: () => null
      })}
    />
    <Stack.Screen name="Chat" component={ChatScreen}
      options={({ navigation, route } : NavHeaderProps) => ({
        gestureResponseDistance: 50,
        headerStyle: { backgroundColor: uq_purple },
        headerBackVisible: false,
        headerTitleAlign: 'center',
        headerLeft: NavBackButton,
        headerTitle: () => <ChatHeader chatId={(route as RouteProp<PongoStackParamList, 'Chat'>).params.id} />,
        headerRight: () => isSearching ? <CloseSearch /> : <ChatMenu id={(route as RouteProp<PongoStackParamList, 'Chat'>).params.id} />
      })}
    />
    <Stack.Screen name="Contacts" component={ContactsScreen}
      options={({ navigation } : NavHeaderProps) => ({
        headerStyle: { backgroundColor: uq_purple },
        headerBackVisible: false,
        headerTitleAlign: 'center',
        headerLeft: NavBackButton,
        headerTitle: () => isSearching ? <SearchHeader searchType='ship' /> : <H3 style={{ color: 'white' }} text='Contacts' />,
        headerRight: () => isSearching ? <CloseSearch /> : <OpenSearch />
      })}
    />
    <Stack.Screen name="NewChat" component={NewChatScreen}
      options={({ navigation } : NavHeaderProps) => ({
        headerStyle: { backgroundColor: uq_purple },
        headerBackVisible: false,
        headerTitleAlign: 'center',
        headerLeft: NavBackButton,
        headerTitle: () => isSearching ? <SearchHeader searchType='ship' /> : <H3 style={{ color: 'white' }} text='New Chat' />,
        headerRight: () => isSearching ? <CloseSearch /> : <OpenSearch />
      })}
    />
    <Stack.Screen name="NewGroup" component={NewGroupScreen}
      options={({ navigation } : NavHeaderProps) => ({
        headerStyle: { backgroundColor: uq_purple },
        headerBackVisible: false,
        headerTitleAlign: 'center',
        headerLeft: NavBackButton,
        headerTitle: () => isSearching ? <SearchHeader searchType='ship' /> : <H3 style={{ color: 'white' }} text='New Group' />,
        headerRight: () => isSearching ? <CloseSearch /> : <OpenSearch />
      })}
    />
    <Stack.Screen name="NewPosseGroup" component={NewPosseGroupScreen}
      options={({ navigation } : NavHeaderProps) => ({
        headerStyle: { backgroundColor: uq_purple },
        headerBackVisible: false,
        headerTitleAlign: 'center',
        headerLeft: NavBackButton,
        headerTitle: () => isSearching ? <SearchHeader searchType='tag' /> : <H3 style={{ color: 'white' }} text='New Group' />,
        headerRight: () => isSearching ? <CloseSearch /> : <OpenSearch />
      })}
    />
    <Stack.Screen name="SearchResults" component={SearchResultsScreen}
      options={({ navigation } : NavHeaderProps) => ({
        headerStyle: { backgroundColor: uq_purple },
        headerBackVisible: false,
        headerTitleAlign: 'center',
        headerLeft: NavBackButton,
        headerTitle: () => isSearching ? <SearchHeader searchType='chat' /> : <H3 style={{ color: 'white' }} text='Search Chats' />,
        headerRight: () => isSearching ? <CloseSearch /> : <OpenSearch />
      })}
    />
    <Stack.Screen name="Profile" component={ProfileScreen}
      options={({ navigation } : NavHeaderProps) => ({
        headerStyle: { backgroundColor: uq_purple },
        headerBackVisible: false,
        headerTitleAlign: 'center',
        headerLeft: NavBackButton,
        headerTitle: () => <H3 style={{ color: 'white' }} text='Profile' />,
        headerRight: () => null
      })}
    />
    <Stack.Screen name="Group" component={GroupScreen}
      options={({ navigation, route } : NavHeaderProps) => ({
        headerStyle: { backgroundColor: uq_purple },
        headerBackVisible: false,
        headerTitleAlign: 'center',
        headerLeft: NavBackButton,
        headerTitle: () => <H3 style={{ color: 'white' }} text='Group Info' />,
        headerRight: () => null
      })}
    />
    <Stack.Screen name="Settings" component={SettingsScreen}
      options={({ navigation, route } : NavHeaderProps) => ({
        headerStyle: { backgroundColor: uq_purple },
        headerBackVisible: false,
        headerTitleAlign: 'center',
        headerLeft: NavBackButton,
        headerTitle: () => <H3 style={{ color: 'white' }} text='Settings' />,
        headerRight: () => null
      })}
    />
  </Stack.Navigator>

  if (isLargeDevice) {
    return (
      <Row style={{ flex: 1 }}>
        <ChatsScreen />
        <View style={{ flex: 1, height: '100%' }}>
          {stack}
        </View>
      </Row>
    )
  }

  return stack
}
