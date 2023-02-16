import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { window } from "../../constants/Layout";
import useStore from "../../state/useStore";
import { Text } from "../Themed";

const ShipTitle = ({ navigation, color }: any) => {
  const { ship } = useStore();
  const styles = StyleSheet.create({
    changeShip: {
    },
    changeShipText: {
      fontSize: 18,
      fontWeight: '700',
      fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
      color,
    },
  })

  const { width } = window

  return (
    <Pressable style={styles.changeShip} onPress={() => navigation.toggleDrawer()}>
      <View style={{ display: 'flex', flexDirection: 'row', flex: 1, maxWidth: width * 0.70 }}>
        <Text numberOfLines={1} style={styles.changeShipText}>{ship}</Text>
      </View>
    </Pressable>
  );
};

export default ShipTitle;
