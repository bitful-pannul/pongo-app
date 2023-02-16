import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import useStore from "../state/useStore";
import useColors from "../hooks/useColors";

const GridRefresh = () => {
  const { set, shipUrl } = useStore();
  const { color } = useColors()

  const handleRefresh = () => {
    const refreshUrl = shipUrl
    set({ shipUrl: '' })
    setTimeout(() => set({ shipUrl: refreshUrl }), 1)
  };

  return (
    <TouchableOpacity style={{ padding: 8, marginRight: 8 }} onPress={handleRefresh}>
      <Ionicons name="refresh" size={20} color={color} />
    </TouchableOpacity>
  );
};

export default GridRefresh;
