import { Ionicons } from '@expo/vector-icons'
import { NavigationProp } from '@react-navigation/native'
import React, { useCallback, useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { PongoStackParamList } from '../../types/Navigation'
import Button from '../../components/form/Button'
import Loader from '../../components/Loader'
import ShipRow from '../../components/pongo/ShipRow'
import Col from '../../components/spacing/Col'

import { Text, View, ScrollView, TextInput } from '../../components/Themed'
import { DM_DIVIDER } from '../../constants/Pongo'
import useColors from '../../hooks/useColors'
import usePongoStore from '../../state/usePongoState'
import usePosseState from '../../state/usePosseState'
import useStore from '../../state/useStore'
import { addSig, deSig } from '../../util/string'
import { ONE_SECOND } from '../../util/time'

interface NewChatScreenProps {
  navigation: NavigationProp<PongoStackParamList>
}

export default function NewChatScreen({ navigation }: NewChatScreenProps) {
  const { set, isSearching, searchResults, createConversation, sortedChats, loading, searchTerm } = usePongoStore()
  const { tags } = usePosseState()
  const { color, shadedBackground } = useColors()
  const { ship: self } = useStore()

  useEffect(() => {
    setTimeout(() => set({ isSearching: true }), ONE_SECOND / 3)
  }, [])

  const selectShip = useCallback((selected: string) => async () => {
    if (selected.includes(self)) {
      navigation.navigate('Profile', { ship: addSig(self) })
    } else {
      const existingChat = sortedChats.find(sc => sc.conversation.members.length === 2 && sc.conversation.members.includes(deSig(selected)))
  
      if (existingChat) {
        navigation.goBack()
        navigation.navigate('Chat', { id: existingChat.conversation.id })
      } else {
        set({ loading: 'Creating Chat...' })
        try {
          const newChat = await createConversation(`${self}${DM_DIVIDER}${selected}`, [selected], true)
          navigation.goBack()
          if (newChat) {
            navigation.navigate('Chat', { id: newChat.conversation.id })
          }
        } catch {}
        set({ loading: null })
      }
    }

  }, [self, sortedChats, navigation, createConversation])

  return (
    <View style={{ height: '100%', width: '100%' }}>
      {loading ? (
        <Col style={{ justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', paddingBottom: '40%' }}>
          <Loader text={loading} />
        </Col>
      ) : (
        <>
          <Button style={{ marginTop: 16 }} onPress={() => navigation.navigate('NewGroup')} iconName='people' title='New Group' />
          {Object.keys(tags).length > 0 && (
            <Button style={{ marginTop: 16 }} onPress={() => navigation.navigate('NewPosseGroup')} title='New Group From Posse' />
          )}
          <ScrollView style={{ marginTop: 16 }} keyboardShouldPersistTaps='handled'>
            {isSearching ? (
              searchResults.length ?
                searchResults.map(ship => <ShipRow key={ship as string} ship={ship as string} onPress={selectShip} />) :
                Boolean(searchTerm) && <Text style={{ fontSize: 18, marginTop: 16, alignSelf: 'center' }}>No results</Text>
            ) : (
              null
              // TODO: get a list of recent chats
            )}
          </ScrollView>
        </>
      )}
    </View>
  )
}
