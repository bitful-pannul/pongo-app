import { cite } from '@urbit/api'
import React, { HTMLAttributes } from 'react'
import { Text, TextStyle} from 'react-native'

import { useContact } from '../../state/useContactState'

type ShipNameProps = {
  name: string
  showAlias?: boolean
  style?: TextStyle
} & Text['props']

export default function ShipName({
  name,
  showAlias = false,
  ...props
}: ShipNameProps) {
  const contact = useContact(name)
  const separator = /([_^-])/
  const citedName = cite(name)

  if (!citedName) {
    return null
  }

  const parts = citedName.replace('~', '').split(separator)
  const first = parts.shift()

  // Moons
  if (name.length > 25 && name.length < 30) {
    const patp = name.replace('~', '')

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
      {contact?.nickname && /* !calm.disableNicknames && */ showAlias ? (
        <Text>{contact.nickname}</Text>
      ) : (
        <>
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
        </>
      )}
    </Text>
  )
}
