import { NavigationProp } from '@react-navigation/native'
import React, { useCallback, useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { PongoStackParamList } from '../../types/Navigation'
import Button from '../../components/form/Button'
import Loader from '../../components/Loader'
import Avatar from '../../components/pongo/Avatar'
import ShipName from '../../components/pongo/ShipName'
import ShipRow from '../../components/pongo/ShipRow'
import Sigil from '../../components/Sigil'
import Col from '../../components/spacing/Col'
import Row from '../../components/spacing/Row'
import H3 from '../../components/text/H3'

import { Text, View, ScrollView, TextInput } from '../../components/Themed'
import useColors from '../../hooks/useColors'
import useSearch from '../../hooks/useSearch'
import useContactState from '../../state/useContactState'
import usePongoStore from '../../state/usePongoState'

interface NewGroupScreenProps {
  navigation: NavigationProp<PongoStackParamList>
}

export default function NewGroupScreen({ navigation }: NewGroupScreenProps) {
  const { set, isSearching, searchResults, loading, createConversation, searchTerm } = usePongoStore()
  const { color, shadedBackground, backgroundColor } = useColors()
  const { contacts } = useContactState()
  const { search } = useSearch()

  const [chatName, setChatName] = useState('')
  const [error, setError] = useState('')
  const [ships, setShips] = useState<string[]>([])

  const selectShip = useCallback((ship: string) => () => {
    setError('')
    search('ship', '~')
    setShips([...ships.filter(s => s !== ship), ship])
  }, [ships])

  const removeShip = useCallback((ship: string) => () => {
    setShips(ships.filter(s => s !== ship))
  }, [ships])

  const createChat = useCallback(async () => {
    if (chatName.trim().length < 3) {
      setError('Chat name must be at least 3 chars')
    } else if (ships.length < 2) {
      setError('Groups must have at least 2 other users')
    } else {
      set({ loading: 'Creating Chat...' })
      const newChat =  await createConversation(chatName, ships, false)
      // Figure out how to get the chat ID back and navigate there
      setShips([])
      setChatName('')
      set({ loading: null })
      navigation.goBack()
      navigation.goBack()
      if (newChat) {
        navigation.navigate('Chat', { id: newChat.conversation.id })
      }
    }
  }, [chatName, ships, createConversation])

  const hasError = Boolean(error)

  return (
    <View style={{ height: '100%', width: '100%' }}>
      {loading ? (
        <Col style={{ justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', paddingBottom: '40%' }}>
          <Loader text={loading} />
        </Col>
      ) : (
        <>
          <Row style={{ width: '100%', marginTop: 12, marginBottom: hasError ? 4 : 12 }}>
            <TextInput
              style={{
                width: '80%',
                marginHorizontal: '10%',
                height: 40,
              }}
              value={chatName}
              onChangeText={text => { setChatName(text); setError('') }}
              placeholder='Choose a name for the chat'
            />
          </Row>
          {hasError && <Text style={{ color: 'red', marginBottom: 8, marginLeft: '10%' }}>{error}</Text>}
          <Col style={{ width: '100%' }}>
            {ships.length > 0 && (
              <Row style={{ width: '80%', marginHorizontal: '10%', marginBottom: 12, flexWrap: 'wrap' }}>
                <H3 text='Members:' style={{ marginRight: 4 }} />
                {ships.map(ship => (
                  <Pressable onPress={removeShip(ship)} style={{ margin: 4 }} key={ship}>
                    <Row style={{ padding: 4 }}>
                      <Avatar ship={ship} />
                      <ShipName name={ship} style={{ marginLeft: 4, fontSize: 16, fontWeight: '600' }} />
                    </Row>
                  </Pressable>
                ))}
              </Row>
            )}
          </Col>
          <Button onPress={createChat} title='Create Group Chat' />

          <ScrollView style={{ marginTop: 16 }} keyboardShouldPersistTaps='handled'>
            {isSearching ? (
              searchResults.length ?
                searchResults.map(ship => <ShipRow key={ship as string} ship={ship as string} onPress={selectShip} />) :
                Boolean(searchTerm) && <Text style={{ fontSize: 18, marginTop: 16, alignSelf: 'center' }}>No results</Text>
            ) : (
              null
            )}
          </ScrollView>
        </>
      )}

    </View>
  )
}
