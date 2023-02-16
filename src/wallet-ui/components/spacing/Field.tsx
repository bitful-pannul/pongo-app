import React from 'react'
import { View as DefaultView } from 'react-native';
import { Text } from '../../../components/Themed';
import Col from './Col';
import Row from './Row'

interface FieldProps {
  name: string
  column?: boolean
  mono?: boolean
}

const Field : React.FC<FieldProps & DefaultView['props']> = ({ children, name, column = false }) => {
  return (
    <Row style={{ flexDirection: column ? 'column' : 'row' }}>
      <Text style={{ minWidth: 80, alignSelf: 'baseline', marginRight: 8, fontSize: 18 }}>{name}</Text>
      <Row>
        {children}
      </Row>
    </Row>
  )
}

export default Field