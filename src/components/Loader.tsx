import { ActivityIndicator } from "react-native"
import useColors from "../hooks/useColors"
import Col from "./spacing/Col"
import { Text } from "./Themed"

export default function Loader({ text }: { text?: string }) {
  const { color } = useColors()

  if (!text) {
    return null
  }

  return (
    <Col style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 16, textAlign: 'center' }}>{text}</Text>
      <ActivityIndicator color={color} size='large' />
    </Col>
  )
}
