import React from 'react'
import { View as DefaultView } from 'react-native';
import { addHexDots } from '../../utils/format'
import CopyIcon from './CopyIcon'
import Row from '../spacing/Row'
import HexIcon from './HexIcon'

import { Text } from '../../../components/Themed';

interface HexNumProps {
  colors?: boolean,
  num: string,
  displayNum?: string,
  mono?: boolean
  bold?: boolean
  copy?: boolean
  copyText?: string
}

const HexNum: React.FC<HexNumProps & DefaultView['props']> = ({
  num,
  displayNum = num,
  bold,
  copy,
  copyText,
  colors = true,
  mono = true,
  ...props
}) => {
  copyText = copyText || displayNum

  return (
    <Row {...props} style={[{ alignItems: 'center' }, props.style]}>
      {colors && <HexIcon hexNum={num} />}
      <Text bold={bold} mono={mono} style={{ fontSize: 16, marginTop: 6, fontWeight: '600', maxWidth: '75%' }}>{displayNum}</Text>
      {copy && <CopyIcon text={addHexDots(copyText)} />}
    </Row>
  )
}

export default HexNum
