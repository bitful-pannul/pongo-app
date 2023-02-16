import React from 'react'
import { View as DefaultView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { View } from '../../../components/Themed'
import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from '../../utils/colors'

interface HexIconProps {
  hexNum: string
  size?: number
}

const HexIcon = ({ hexNum, size = 24, ...props }: HexIconProps & DefaultView['props']) => {
  let num = hexNum
  num = num.replace(/(0x|\.)/g,'')
  
  while (num.length < 6)
  {
    num = '0' + num
  }

  const leftHsl = rgbToHsl(hexToRgb(num.slice(0, 6)))
  const rightHsl = rgbToHsl(hexToRgb(num.length > 6 ? num.slice(num.length - 6) : num))
  leftHsl.s = rightHsl.s = 1
  const leftColor = rgbToHex(hslToRgb(leftHsl))
  const rightColor = rgbToHex(hslToRgb(rightHsl))
  const angle = (parseInt(num, 16) % 360) || -45

  return (
    <View style={[{ borderColor: 'black', borderWidth: 1, height: size + 2, width: size + 2, margin: 8, borderRadius: 999 }, props.style]}>
      <LinearGradient {...props} colors={[leftColor, rightColor]} style={[{
        borderTopColor: leftColor,
        borderRightColor: rightColor,
        borderBottomColor: rightColor,
        borderLeftColor: leftColor,
        borderRadius: 999,
        height: size,
        width: size,
      }]} />
    </View>
  )
}

export default HexIcon
