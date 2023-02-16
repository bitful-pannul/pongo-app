import React from 'react'
import { TextInput } from 'react-native'
import { Text } from '../../../components/Themed'
import Col from '../spacing/Col'

interface InputProps {
  label?: string
  error?: string
  containerStyle?: any
}

const Input: React.FC<InputProps & TextInput['props']> = ({
  label,
  error,
  containerStyle,
  ...props
}) => {
  return (
    <Col style={containerStyle}>
      {!!label && <Text style={{ fontSize: 16, marginBottom: 4 }}>{label}</Text>}
      <TextInput {...props} style={[{ padding: 4, paddingHorizontal: 8, fontSize: 16, borderColor: 'gray', borderWidth: 1, borderRadius: 4 }, props.style]} />
      <Text style={{ color: 'red' }}>{error}</Text>
    </Col>
  )
}

export default Input
