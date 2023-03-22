import { StatusBar } from "expo-status-bar"
import React, { useCallback, useEffect, useState } from "react"
import { Alert, Image, Linking, Platform, Pressable, StyleSheet, TouchableOpacity } from "react-native"

import { Text, View } from "../components/Themed"
import useStore from "../state/useStore"
import { DrawerContentComponentProps } from "@react-navigation/drawer/lib/typescript/src/types"
import Sigil from "../components/Sigil";
import { Ionicons } from "@expo/vector-icons";
import Button from "../components/form/Button"
import { uq_darkpurple, uq_purple } from "../constants/Colors"
import useColors from "../hooks/useColors"
import { ESCAPE_APP_LINK } from "../constants/Escape"
import usePongoStore from "../state/usePongoState"
import { useApi } from "../hooks/useApi"
import { configureApi } from "@uqbar/react-native-api/configureApi"
import { isWeb } from "../constants/Layout"

export default function DrawerContent({
  navigation,
}: DrawerContentComponentProps) {
  const { ships, ship, setShip, removeShip, removeAllShips, setNeedLogin } = useStore()
  const { api } = useApi()
  const { set, showUqbarWallet } = usePongoStore()
  const backgroundShips = ships.filter((s) => s.ship !== ship)
  const [showManageShips, setShowManageShips] = useState(false)

  useEffect(() => {
    if (api) {
      api.scry({ app: 'wallet', path: '/accounts' })
        .then(() => set({ showUqbarWallet: true }))
        .catch(() => set({ showUqbarWallet: false }))
    }
  }, [ship, api])

  const handleAdd = useCallback(() => {
    setShip('none')
    setNeedLogin(true)
  }, [])

  const handleClear = useCallback(() => {
    removeAllShips()
    setNeedLogin(true)
    navigation.closeDrawer()
  }, [])

  const showClearAlert = useCallback(() => Alert.alert(
    "Clear All Ships",
    "Are you sure you want to clear all ship info?",
    [
      {
        text: "No",
        onPress: () => null,
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: handleClear,
        style: "default",
      },
    ],
    {
      cancelable: true,
      onDismiss: () => null,
    }
  ), [handleClear])

  const selectShip = useCallback((ship: string) => () => {
    setShip(ship)
    navigation.goBack()
  }, [setShip, navigation])

  const joinChat = useCallback(() => {
    set({ showJoinChatModal: true })
    navigation.closeDrawer()
  }, [])

  const logoutShip = useCallback((targetShip: string) => () => {
    const shipInfo = ships.find(sc => sc.ship === targetShip)
    if (shipInfo) {
      const tempApi = configureApi(shipInfo.ship, shipInfo.shipUrl)
      // [%set-notif-token (ot ~[[%expo-token so] [%ship-url so]])]
      tempApi.poke({ app: 'pongo', mark: 'pongo-action', json: { 'set-notif-token': { 'expo-token': '', 'ship-url': '' } } }).catch(console.log)
      removeShip(targetShip)
    }
  }, [ships])

  const goToGrid = useCallback(() => {
    if (isWeb) {
      window.location.assign('/apps/grid')
    } else {
      navigation.navigate('Grid')
    }
  }, [])

  const goToEScape = useCallback(() => {
    if (isWeb) {
      window.location.assign('/apps/escape')
    } else {
      navigation.navigate('Grid', { path: '/apps/escape' })
    }
  }, [])

  const goToPokur = useCallback(() => {
    if (isWeb) {
      window.location.assign('/apps/pokur')
    } else {
      navigation.navigate('Grid', { path: '/apps/pokur' })
    }
  }, [])

  const { color, backgroundColor } = useColors()
  const styles = getStyles(color)

  return (
    <View style={styles.container}>
      <View style={styles.drawerScroll}>
        <View style={{ ...styles.shipEntry, marginTop: 16 }}>
          <Sigil icon ship={ship} color={color} foreground={backgroundColor} />
          <Text style={styles.primaryShip}>{ship}</Text>
        </View>
        {backgroundShips.map(({ ship }) => <View style={[styles.row, { marginTop: 12 }]} key={ship}>
          <Pressable key={ship} onPress={selectShip(ship)}>
            <View style={styles.shipEntry}>
              <Sigil icon ship={ship} color={color} />
              <Text style={styles.secondaryShip}>{ship}</Text>
            </View>
          </Pressable>
          <TouchableOpacity onPress={logoutShip(ship)}>
            <Ionicons name="trash" size={20} color={color} />
          </TouchableOpacity>
        </View>)}
      </View>
      {!isWeb && (
        <Button small unstyled
          style={{ marginTop: 12, marginLeft: 0 }}
          viewStyle={{ justifyContent: 'flex-start', paddingLeft: 4 }}
          background={showManageShips ? uq_purple : uq_darkpurple}
          title="Manage Ships"
          iconName={showManageShips ? 'chevron-up' : 'chevron-down'}
          onPress={() => setShowManageShips(!showManageShips)}
        />
      )}
      {showManageShips && (
        <>
          <Button small style={{ marginTop: 12, marginLeft: 4 }} title="Add ship" onPress={handleAdd} />
          <Button small style={{ marginTop: 12, marginLeft: 4 }} title="Clear all ships" onPress={showClearAlert} />
        </>
      )}
      <TouchableOpacity onPress={joinChat} style={{ marginTop: 16 }}>
        <View style={{ ...styles.row, ...styles.rowStart }}>
          <Ionicons name="add" size={24} color={color} />
          <Text style={styles.app}>Join Chat</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ marginTop: 16 }}>
        <View style={{ ...styles.row, ...styles.rowStart }}>
          <Ionicons name="settings-outline" size={24} color={color} />
          <Text style={styles.app}>Settings</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.2)" />
      <View>
        <View style={[styles.row, styles.rowStart, { marginTop: 12, marginBottom: 4 }]}>
          <Text style={styles.appHeader}>Apps</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Pongo')} style={{ marginTop: 16 }}>
          <View style={{ ...styles.row, ...styles.rowStart }}>
            <Image style={{ width: 24, height: 24 }} source={require('../../assets/images/pongo-logo.png')} />
            <Text style={styles.app}>Pongo</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToGrid} style={{ marginTop: 16 }}>
          <View style={{ ...styles.row, ...styles.rowStart }}>
            <Ionicons name="grid" size={24} color={color} />
            <Text style={styles.app}>Apps</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToPokur} style={{ marginTop: 16 }}>
          <View style={{ ...styles.row, ...styles.rowStart }}>
            <Text style={{ fontSize: 24, color }}>♠</Text>
            <Text style={styles.app}>Pokur</Text>
          </View>
        </TouchableOpacity>
        {showUqbarWallet && <TouchableOpacity onPress={() => navigation.navigate('UqbarWallet')} style={{ marginTop: 16 }}>
          <View style={{ ...styles.row, ...styles.rowStart }}>
            <Ionicons name="wallet-outline" size={24} color={color} />
            <Text style={styles.app}>Uqbar Wallet</Text>
          </View>
        </TouchableOpacity>}
        <TouchableOpacity onPress={() => navigation.navigate('Handshake')} style={{ marginTop: 16 }}>
          <View style={{ ...styles.row, ...styles.rowStart }}>
            <Ionicons name="qr-code" size={24} color={color} />
            <Text style={styles.app}>Handshake</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToEScape} style={{ marginTop: 16 }}>
          <View style={{ ...styles.row, ...styles.rowStart }}>
            <Image style={{ width: 24, height: 24 }} source={require('../../assets/images/escape-icon.png')} />
            <Text style={styles.app}>EScape</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function getStyles(color: string) {
  return StyleSheet.create({
    container: {
      width: '100%',
      height: '100%',
      padding: 12,
      paddingTop: 48
    },
    drawerScroll: {
      width: '100%',
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowStart: {
      justifyContent: 'flex-start',
    },
    separator: {
      marginVertical: 16,
      height: 1,
      width: "100%",
    },
    shipEntry: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    primaryShip: {
      fontSize: 16,
      fontWeight: '600',
      color,
      borderBottomColor: color,
      borderBottomWidth: 1,
      marginLeft: 8,
      maxWidth: 130,
    },
    secondaryShip: {
      fontSize: 16,
      color,
      marginLeft: 8,
      maxWidth: 130,
    },
    app: {
      fontSize: 16,
      fontWeight: '600',
      color,
      marginLeft: 12,
      maxWidth: 130,
    },
    appHeader: {
      fontSize: 18,
      fontWeight: '600',
      color,
    }
  })
}
