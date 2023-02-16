import React, { useCallback, useState } from 'react'
import { Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard'

import Row from '../spacing/Row'
import { Text } from '../../../components/Themed';
import useColors from '../../../hooks/useColors';

interface CopyIconProps {
  style?: any
  text: string
  iconOnly?: boolean
}

const CopyIcon: React.FC<CopyIconProps> = ({ style, text, iconOnly = true }) => {
  const [didCopy, setDidCopy] = useState(false)
  const { color } = useColors()

  const onCopy = useCallback(() => {
    Clipboard.setStringAsync(text)
    setDidCopy(true)
    setTimeout(() => setDidCopy(false), 1000)
  }, [text])

  return (
    <Pressable onPress={onCopy}>
      <Row style={[{ marginLeft: 12, padding: 2, paddingHorizontal: 4 }, style]}>
        {didCopy ? 
          iconOnly ? <Ionicons name='checkmark-circle-outline' size={20} />
          : <Text style={{ fontSize: 14 }}>Copied!</Text>
        : <Ionicons name='copy-outline' size={20} color={color} />}
      </Row>
    </Pressable>
  )
}

export default CopyIcon
