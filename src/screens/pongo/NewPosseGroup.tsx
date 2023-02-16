import { NavigationProp } from '@react-navigation/native'
import React, { useCallback, useState } from 'react'
import { PongoStackParamList } from '../../types/Navigation'
import Loader from '../../components/Loader'
import TagEntry from '../../components/pongo/TagEntry'
import Col from '../../components/spacing/Col'
import Row from '../../components/spacing/Row'
import H3 from '../../components/text/H3'

import { Text, View, ScrollView, TextInput } from '../../components/Themed'
import usePongoStore from '../../state/usePongoState'
import usePosseState from '../../state/usePosseState'

interface NewPosseGroupScreenProps {
  navigation: NavigationProp<PongoStackParamList>
}

export default function NewPosseGroupScreen({ navigation }: NewPosseGroupScreenProps) {
  const { set, isSearching, searchResults, loading, createConversationFromPosse } = usePongoStore()
  const { tags } = usePosseState()

  const [chatName, setChatName] = useState('')
  const [error, setError] = useState('')

  const createChat = useCallback((tag: string) => async() => {
    if (chatName.trim().length < 3) {
      setError('Chat name must be at least 3 chars')
    } else {
      set({ loading: 'Creating Chat...' })
      const newChat =  await createConversationFromPosse(chatName, tag)
      // Figure out how to get the chat ID back and navigate there
      setChatName('')
      set({ loading: null })
      navigation.goBack()
      navigation.goBack()
      if (newChat) {
        navigation.navigate('Chat', { id: newChat.conversation.id })
      }
    }
  }, [chatName, createConversationFromPosse])

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

          <Col style={{ marginTop: 8, alignItems: 'center', width: '100%' }}>
            <H3 text='Select a Posse' />
          </Col>

          <ScrollView style={{ marginTop: 16 }} keyboardShouldPersistTaps='handled'>
            {searchResults.length ? (
              <Row style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                {searchResults.map(tag => typeof tag === 'string' ? <TagEntry key={tag} onPress={createChat(tag)} tag={tag} /> : null)}
              </Row>
            ) : (
              Object.keys(Object.values(tags).reduce((acc, cur) => {
                cur.forEach(t => {
                  if (!acc[t]) {
                    acc[t] = true
                  }
                })
                return acc
              }, {} as { [tag: string]: boolean }))
                .map(tag => <TagEntry key={tag} onPress={createChat(tag)} tag={tag} />)
            )}
          </ScrollView>
        </>
      )}

    </View>
  )
}
