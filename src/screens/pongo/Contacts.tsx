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

interface ContactsScreenProps {
  navigation: NavigationProp<PongoStackParamList>
}

export default function ContactsScreen({ navigation }: ContactsScreenProps) {
  const { set, isSearching, searchResults, loading, searchTerm } = usePongoStore()
  const { tags } = usePosseState()

  useEffect(() => {
    setTimeout(() => set({ isSearching: true }), ONE_SECOND / 3)
  }, [])

  const selectShip = useCallback((selected: string) => async () => {
    navigation.navigate('Profile', { ship: selected})
  }, [])

  return (
    <View style={{ height: '100%', width: '100%' }}>
      {loading ? (
        <Col style={{ justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', paddingBottom: '40%' }}>
          <Loader text={loading} />
        </Col>
      ) : (
        <>
          <ScrollView style={{ marginTop: 16 }} keyboardShouldPersistTaps='handled'>
            {isSearching ? (
              searchResults.length ?
                searchResults.map(ship => <ShipRow key={ship as string} ship={ship as string} onPress={selectShip} />) :
                Boolean(searchTerm) ? (
                  <Text style={{ fontSize: 18, marginTop: 16, alignSelf: 'center' }}>No results</Text>
                ) : (
                  <Text style={{ fontSize: 18, marginTop: 16, alignSelf: 'center' }}>Search Contacts</Text>
                )
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
