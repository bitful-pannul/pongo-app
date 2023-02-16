import React from 'react'
import { StyleSheet, View as DefaultView, View } from 'react-native';
import { Text } from '../../../components/Themed';
import Row from '../spacing/Row'

interface PillProps {
  value: string
  label: string
  color?: string
}

const Pill: React.FC<PillProps & DefaultView['props']> = ({ value, label, color, ...props }) => {
  const styles = StyleSheet.create({
    pill: { margin: 0, marginHorizontal: 4 },
    label: {
      backgroundColor: color === 'pink' ? '#cd3c52' : '#3acfc0',
      padding: 4,
      paddingHorizontal: 8,
      borderTopLeftRadius: 999,
      borderBottomLeftRadius: 999,
    },
    value: {
      padding: 4,
      paddingHorizontal: 8,
      borderTopRightRadius: 999,
      borderBottomRightRadius: 999,
      backgroundColor: 'white',
    },
    labelText: {
      color: 'white',
      fontSize: 14,
    },
    valueText: {
      color: 'black',
      fontSize: 14,
    }
  })

  return (
    <Row {...props} style={styles.pill}>
      <View style={styles.label}>
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <View style={styles.value}>
        <Text style={styles.valueText}>{value}</Text>
      </View>
    </Row>
  )
}

export default Pill
