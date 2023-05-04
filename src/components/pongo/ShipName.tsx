import React from 'react'
import { Text, TextStyle} from 'react-native'
import { cite } from '@urbit/api'

import { useContact } from '../../state/useContactState'
import useNimiState from '../../state/useNimiState'
import { preSig } from '../../util/string'

type ShipNameProps = {
  ship: string
  hideNick?: boolean
  showBoth?: boolean
  style?: TextStyle
} & Text['props']

export default function ShipName({
  ship,
  hideNick = false,
  showBoth = false,
  ...props
}: ShipNameProps) {
  const profile = useNimiState(s => s.profiles[preSig(ship)])
  const separator = /([_^-])/
  const citedName = cite(ship)

  if (!citedName) {
    return null
  }

  const parts = citedName.replace('~', '').split(separator)
  const first = parts.shift()

  // Moons
  if (ship.length > 25 && ship.length < 30) {
    const patp = ship.replace('~', '')

    return (
      <Text {...props}>
        <Text style={{ textAlignVertical: 'top', fontSize: 14, color: props.style?.color }}>
          <Text aria-hidden style={{ color: props.style?.color }}>~</Text>
          {patp.slice(0, 6)}
          <Text aria-hidden>-</Text>
          {patp.slice(7, 13)}
        </Text>
        <Text aria-hidden style={{ color: props.style?.color }}>^</Text>
        <Text style={{ color: props.style?.color }}>{patp.slice(14, 20)}</Text>
        <Text aria-hidden style={{ color: props.style?.color }}>-</Text>
        <Text style={{ color: props.style?.color }}>{patp.slice(21, 27)}</Text>
      </Text>
    )
  }

  return (
    <Text {...props}>
      {profile?.name && !hideNick && /* && !calm.disableNicknames */<Text>{profile.name}</Text>}
      {(!profile?.name || showBoth) && (
        <>
          {showBoth && profile?.name && <Text> (</Text>}
          <Text aria-hidden>~</Text>
          <Text>{first}</Text>
          {parts.length > 1 && (
            <>
              {parts.map((piece, index) => (
                <Text
                  key={`${piece}-${index}`}
                  aria-hidden={separator.test(piece)}
                >
                  {piece}
                </Text>
              ))}
            </>
          )}
          {showBoth && profile?.name && <Text>)</Text>}
        </>
      )}
    </Text>
  )
}
