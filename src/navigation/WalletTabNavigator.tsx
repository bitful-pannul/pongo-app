import { useEffect } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import { WalletTabParamList } from '../types/Navigation'
import useStore from '../state/useStore'
import { uq_purple } from '../constants/Colors'
import useColors from '../hooks/useColors'
import { TabBarIcon } from './components'
import WalletAssets from '../screens/wallet/Assets'
import WalletAccounts from '../screens/wallet/Accounts'
import WalletTransactions from '../screens/wallet/Transactions'
import { useWalletStore } from '../wallet-ui'
import { MaterialIcons } from '@expo/vector-icons'

const BottomTab = createBottomTabNavigator<WalletTabParamList>()

export default function WalletTabNavigator() {
  const { color } = useColors()
  const { initWallet, clearSubscriptions: clearWallet } = useWalletStore()
  const { api, ship } = useStore()

  useEffect(() => {
    if (api) {
      initWallet(api, {})
    }

    return () => {
      if (api) {
        clearWallet()
      }
    }
  }, [ship])

  return (
    <BottomTab.Navigator
      initialRouteName="Assets"
      screenOptions={{
        tabBarInactiveTintColor: color,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: uq_purple,
        headerShown: false,
      }}
    >
      <BottomTab.Screen
        name="Assets"
        component={WalletAssets}
        options={({ navigation }) => ({
          tabBarIcon: ({ color }) => <TabBarIcon name='cash-outline' color={color} />,
        })}
      />
      <BottomTab.Screen
        name="Accounts"
        component={WalletAccounts}
        options={({ navigation }) => ({
          tabBarIcon: ({ color }) => <TabBarIcon name='wallet-outline' color={color} />,
        })}
      />
      <BottomTab.Screen
        name="Transactions"
        component={WalletTransactions}
        options={({ navigation }) => ({
          tabBarIcon: ({ color }) => <MaterialIcons name='history' size={24} style={{ marginBottom: -4 }} color={color} />,
        })}
      />
    </BottomTab.Navigator>
  )
}
