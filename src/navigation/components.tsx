import { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
export function TabBarIcon(props: {
  name: ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return <Ionicons size={24} style={{ marginBottom: -4 }} {...props} />;
}
