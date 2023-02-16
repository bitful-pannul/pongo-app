import { NavigationProp, RouteProp } from "@react-navigation/native";
import React, { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus, BackHandler, Platform, SafeAreaView, StyleSheet, useColorScheme } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import useStore from "../state/useStore";
import { RootDrawerParamList } from "../types/Navigation";

interface GridProps {
  onMessage?: (event: WebViewMessageEvent) => void;
  navigation: NavigationProp<RootDrawerParamList>
  route: RouteProp<RootDrawerParamList, 'Grid'>
}

const Grid = ({
  navigation,
  route,
  onMessage,
}: GridProps) => {
  const webView = useRef<any>(null);
  const colorScheme = useColorScheme();
  const appState = useRef(AppState.currentState);
  const { shipUrl } = useStore()

  const url = `${shipUrl.replace(/\/$/, '')}${route?.params?.path || ''}`

  const HandleBackPressed = useCallback(() => {
    if (webView?.current) {
      webView.current?.goBack();
      return true; // PREVENT DEFAULT BEHAVIOUR (EXITING THE APP)
    }
    return false;
  }, [webView.current]);

  useEffect(() => {
    if (Platform.OS === "android") {
      BackHandler.addEventListener("hardwareBackPress", HandleBackPressed);
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        webView?.current?.injectJavaScript('window.bootstrapApi(true)');
      }

      appState.current = nextAppState;
    }

    const listener = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", HandleBackPressed);
      listener.remove()
    };
  }, []); // INITIALIZE ONLY ONCE

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webView}
        source={{ uri: url }}
        startInLoadingState
        allowsBackForwardNavigationGestures
        scalesPageToFit
        sharedCookiesEnabled
        forceDarkOn={colorScheme === 'dark'}
        setSupportMultipleWindows={false}
        onMessage={onMessage}
        injectedJavaScript='window.isMobileApp = true'
        pullToRefreshEnabled
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  webview: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
});

export default Grid;
