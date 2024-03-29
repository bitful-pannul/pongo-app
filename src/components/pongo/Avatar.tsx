import { isValidPatp } from 'urbit-ob'
import React from 'react'
import { Image, View } from 'react-native'
import _ from 'lodash'
import { deSig, Contact, cite } from '@urbit/api'
import { darken, lighten, parseToHsla } from 'color2k'

import { addSig, isValidUrl } from '../../util/string'
import { normalizeUrbitColor } from '../../util/color'
import useColorScheme from '../../hooks/useColorScheme'
import Sigil from '../Sigil'
import useColors from '../../hooks/useColors'
import useDimensions from '../../hooks/useDimensions'
import useNimiState from '../../state/useNimiState'

export type AvatarSizes = 'xs' | 'small' | 'default' | 'large' | 'group-chat' | 'huge' | 'quarter-screen' | 'half-screen'

interface AvatarProps {
  ship: string
  size?: AvatarSizes
  className?: string
  style?: any
  icon?: boolean
  previewData?: {
    previewColor?: string
    previewAvatar?: string
  }
  loadImage?: boolean
  color: string
}

interface AvatarMeta {
  style: any
  size: number
}

const sizeMap: Record<AvatarSizes, AvatarMeta> = {
  xs: { style: { borderRadius: 2 }, size: 12 },
  small: { style: { borderRadius: 4 }, size: 16 },
  default: { style: { borderRadius: 4 }, size: 24 },
  large: { style: { borderRadius: 6 }, size: 32 },
  'group-chat': { style: { borderRadius: 6 }, size: 40 },
  huge: { style: { borderRadius: 8 }, size: 48 },
  'quarter-screen': { style: { borderRadius: 12 }, size: 120 },
  'half-screen': { style: { borderRadius: 20 }, size: 240 },
}

export const foregroundFromBackground = (
  background: string
): 'black' | 'white' => {
  const rgb = {
    r: parseInt(background.slice(1, 3), 16),
    g: parseInt(background.slice(3, 5), 16),
    b: parseInt(background.slice(5, 7), 16),
  }
  const brightness = (299 * rgb.r + 587 * rgb.g + 114 * rgb.b) / 1000
  const whiteBrightness = 255

  return whiteBrightness - brightness < 70 ? 'black' : 'white'
}

const emptyContact: Contact = {
  nickname: '',
  bio: '',
  status: '',
  color: '#000000',
  avatar: null,
  cover: null,
  groups: [],
  'last-updated': 0,
}

function themeAdjustColor(color: string, theme: 'light' | 'dark'): string {
  const hsla = parseToHsla(color)
  const lightness = hsla[2]

  if (lightness <= 0.2 && theme === 'dark') {
    return lighten(color, 0.2 - lightness)
  }

  if (lightness >= 0.8 && theme === 'light') {
    return darken(color, lightness - 0.8)
  }

  return color
}

interface SigilArgs {
  patp: string
  size: number
  icon: boolean
  bg: string
  fg: string
}


function getSigilElement(
  ship: string,
  sigilSize: number,
  icon: boolean,
  bg: string,
) {
  const citedShip = cite(ship)
  const { color } = useColors()

  if (
    !ship ||
    ship === 'undefined' ||
    !isValidPatp(addSig(ship)) ||
    citedShip.match(/[_]/)
  ) {
    return null
  }

  if (ship.length > 14) {
    return <View>
      <Sigil size={Math.min(sigilSize, 200)} ship={deSig(ship)?.slice(-13) || ''} color={bg} icon />
      <View style={{
        backgroundColor: 'white',
        height: sigilSize / 6,
        width: sigilSize / 6,
        position: 'absolute',
        alignSelf: 'center',
        borderRadius: sigilSize / 6,
        top: sigilSize / 2 - sigilSize / 12,
      }} />
      {/* <Text style={{
        color: 'white',
        fontSize: sigilSize / 3,
        fontWeight: '600',
        position: 'absolute',
        bottom: sigilSize / 3 - 1,
        left: sigilSize / 16
      }}>
        moon
      </Text> */}
    </View>
  }

  return <Sigil size={Math.min(sigilSize, 200)} ship={deSig(citedShip) || ''} color={bg} icon />
}

export default function Avatar({
  ship,
  size = 'default',
  className,
  style,
  icon = true,
  loadImage = true,
  color,
}: AvatarProps) {
  const profiles = useNimiState(state => state.profiles)
  const profile = profiles[addSig(ship)]
  const showAvatar = Boolean(loadImage && profile && isValidUrl(profile.uri))
  const { cWidth } = useDimensions()

  const iconStyle = sizeMap[size].style
  let sigilSize = sizeMap[size].size
  if (size === 'quarter-screen') {
    sigilSize = cWidth / 4
  } else if (size == 'half-screen') {
    sigilSize = cWidth / 2
  }
  const sigilElement = getSigilElement(ship, Math.min(sigilSize, 200), icon, color)

  // !calm.disableRemoteContent &&
  // !calm.disableAvatars &&
  if (showAvatar) {
    return <Image source={{ uri: profile.uri }} style={[iconStyle, { height: sigilSize, width: sigilSize }, style]} />
  }

  return sigilElement
}

export function useProfileColor(
  ship: string,
  previewData?: {
    previewColor?: string
    previewAvatar?: string
  }
) {
  const currentTheme = useColorScheme()
  const { previewColor } = previewData ?? {}
  const { color } = emptyContact
  const adjustedColor = themeAdjustColor(
    normalizeUrbitColor(previewColor || color),
    currentTheme
  )
  return adjustedColor
}
