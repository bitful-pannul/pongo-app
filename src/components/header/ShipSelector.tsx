import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import useColors from "../../hooks/useColors";

const ShipSelector = ({ navigation }: any) => {
  const { color } = useColors()

  return (
    <Pressable style={{ padding: 12 }} onPress={() => navigation.toggleDrawer()}>
      <View style={{ display: 'flex', flexDirection: 'row' }}>
        <Ionicons name="menu" size={20} color={color} />
      </View>
    </Pressable>
  );
};

export default ShipSelector;
