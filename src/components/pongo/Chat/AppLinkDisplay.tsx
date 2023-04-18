import { Text } from "react-native"
import { TextStyle } from "react-native"
import { StyleProp } from "react-native"

interface AppLinkDisplayProps {
  content: string
  style: StyleProp<TextStyle>
}

export default function AppLinkDisplay({ content, style }: AppLinkDisplayProps) {
  if (content.includes('/apps/pokur?')) {
    return <Text style={style}>Join my Pokur table: </Text>
  } else if (content.includes('/apps/radio?')) {
    return <Text style={style}>Tune in to my %radio station: </Text>
  }

  return null
}
