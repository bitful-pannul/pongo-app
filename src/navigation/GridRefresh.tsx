import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationProp, RouteProp } from "@react-navigation/native";

import useStore from "../state/useStore";
import useColors from "../hooks/useColors";
import { RootDrawerParamList } from "../types/Navigation";

interface GridRefreshProps {
}

const GridRefresh = ({  }: GridRefreshProps) => {
  const { set, shipUrl } = useStore();
  const { color } = useColors()

  const handleRefresh = useCallback(() => {
    const refreshUrl = shipUrl
    set({ shipUrl: '' })
    setTimeout(() => set({ shipUrl: refreshUrl }), 1)
  }, [shipUrl, set]);

  return (
    <TouchableOpacity style={{ padding: 8, marginRight: 8 }} onPress={handleRefresh}>
      <Ionicons name="refresh" size={20} color={color} />
    </TouchableOpacity>
  );
};

export default GridRefresh;
