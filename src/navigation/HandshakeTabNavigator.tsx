import { useEffect } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import { HandshakeTabParamList } from '../types/Navigation'
import QrCodeScreen from '../screens/handshake/QrCodeScreen'
import ScanCodeScreen from '../screens/handshake/ScanCodeScreen'
import useHandshakeStore from '../state/useHandshakeState'
import usePosseStore from '../state/usePosseState'
import useStore from '../state/useStore'
import { uq_purple } from '../constants/Colors'
import useColors from '../hooks/useColors'
import { TabBarIcon } from './components'

const BottomTab = createBottomTabNavigator<HandshakeTabParamList>()

export default function HandshakeTabNavigator() {
  const { color } = useColors()
  const { init: initHandshake, clearSubscriptions: clearHandshake } = useHandshakeStore()
  const { init: initPosse, clearSubscriptions: clearPosse } = usePosseStore()
  const { api, ship } = useStore()

  useEffect(() => {
    if (api) {
      initHandshake(api)
      initPosse(api)
    }

    return () => {
      if (api) {
        clearHandshake()
        clearPosse()
      }
    }
  }, [ship, api])

  return (
    <BottomTab.Navigator
      initialRouteName="QrCode"
      screenOptions={{
        tabBarInactiveTintColor: color,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: uq_purple,
      }}
    >
      <BottomTab.Screen
        name="QrCode"
        component={QrCodeScreen}
        options={({ navigation }) => ({
          tabBarIcon: ({ color }) => <TabBarIcon name='qr-code' color={color} />,
          headerBackVisible: false,
          tabBarShowLabel: false,
          headerShown: false,
        })}
      />
      <BottomTab.Screen
        name="ScanCode"
        component={ScanCodeScreen}
        options={({ navigation }) => ({
          tabBarIcon: ({ color }) => <TabBarIcon name='scan' color={color} />,
          headerBackVisible: false,
          tabBarShowLabel: false,
          headerShown: false,
        })}
      />
    </BottomTab.Navigator>
  )
}
