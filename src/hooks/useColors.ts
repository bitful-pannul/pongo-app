import Colors from "../constants/Colors";
import useColorScheme from "./useColorScheme";

export default function useColors() {
  const scheme = useColorScheme()
  return Colors[scheme]
}
