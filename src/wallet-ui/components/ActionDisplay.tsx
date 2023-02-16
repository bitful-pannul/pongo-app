import Col from "./spacing/Col"
import Row from "./spacing/Row"
import { TransactionArgs } from "../types/Transaction"
import { Text } from "../../components/Themed"
import { ScrollView } from "react-native"

interface ActionDisplayProps {
  action: string | TransactionArgs
}

export const ActionDisplay = ({ action }: ActionDisplayProps) => {
  if (typeof action === 'string') {
    return <Row>Action: {action}</Row>
  }

  const actionTitle = Object.keys(action || {})[0] || 'unknown'

  return (
    <ScrollView style={{ maxHeight: 400 }} keyboardShouldPersistTaps='handled'>
      <Row>
        <Text style={{ fontWeight: '600' }}>Action:</Text>
        <Row style={{ marginLeft: 8 }}>{actionTitle}</Row>
      </Row>
      {Boolean(action && action[actionTitle]) && Object.keys(action[actionTitle]).map(field => (
        <Col style={{ marginLeft: 8 }} key={field}>
          <Text style={{ fontWeight: '600' }}>{field}:</Text>
          <Text style={{ flexWrap: 'wrap' }}>{action[actionTitle][field]}</Text>
        </Col>
      ))}
    </ScrollView>
  )
}
