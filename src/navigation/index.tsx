import React from 'react';
import { ColorSchemeName, StyleSheet } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef, NavigationProp } from "@react-navigation/native";
import { createDrawerNavigator } from '@react-navigation/drawer';

import ShipSelector from "../components/header/ShipSelector";
import ShipTitle from '../components/header/ShipTitle';
import DrawerContent from './DrawerContent';
import HandshakeTabNavigator from './HandshakeTabNavigator';
import PongoStackNavigator from './PongoStackNavigator';
import { PongoStackParamList, RootDrawerParamList } from '../types/Navigation';
import WalletTabNavigator from './WalletTabNavigator';
import useColors from '../hooks/useColors';
import Grid from '../screens/Grid';
import GridRefresh from './GridRefresh';

const Drawer = createDrawerNavigator<RootDrawerParamList>();

export const navigationRef = createNavigationContainerRef<NavigationProp<RootDrawerParamList | PongoStackParamList>>()

export function navTo(route: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(route)
  }
}

export function navReset(params: any) {
  if (navigationRef.isReady()) {
    navigationRef.reset(params)
  }
}

// The Drawer contains each app. Usually a single webview is necessary for an embedded app.
export default function Navigation({
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
}) {
  const { color } = useColors()

  return (
    <NavigationContainer theme={colorScheme === "dark" ? DarkTheme : DefaultTheme} ref={navigationRef}>
      <Drawer.Navigator backBehavior='history' id='drawer' initialRouteName="Pongo" drawerContent={DrawerContent} screenOptions={{ swipeEnabled: false }} useLegacyImplementation={false}>
        <Drawer.Screen name="Pongo" component={PongoStackNavigator} options={() => ({
          headerShown: false,
        })} />
        <Drawer.Screen name="Grid" component={Grid}
          options={({ navigation }) => ({
            headerLeft: () => <ShipSelector navigation={navigation} />,
            headerTitle: () => <ShipTitle navigation={navigation} color={color} />,
            headerRight: () => <GridRefresh />,
          })}
        />
        <Drawer.Screen name="Handshake" component={HandshakeTabNavigator}
          options={({ navigation }) => ({
            headerLeft: () => <ShipSelector navigation={navigation} />,
            headerTitle: () => <ShipTitle navigation={navigation} color={color} />,
            headerRight: () => null,
          })}
        />
        <Drawer.Screen name="UqbarWallet" component={WalletTabNavigator}
          options={({ navigation }) => ({
            headerLeft: () => <ShipSelector navigation={navigation} />,
            headerTitle: () => <ShipTitle navigation={navigation} color={color} />,
            headerRight: () => null,
          })}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */

const styles = StyleSheet.create({
  drawerContainer: {
    width: '100%',
    padding: 24,
    paddingTop: 48
  },
  drawerScroll: {
    width: '100%',
  },
  shipEntry: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
    
  },
  changeShip: {
    padding: 8
  },
});
