import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, RouteProp } from '@react-navigation/native'
import { add } from 'lodash'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { KeyboardAvoidingView } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'

import { PongoStackParamList } from '../../types/Navigation'
import Button from '../../components/form/Button'
import Loader from '../../components/Loader'
import Avatar from '../../components/pongo/Avatar'
import ShipName from '../../components/pongo/ShipName'
import TagEntry from '../../components/pongo/TagEntry'
import Col from '../../components/spacing/Col'
import Row from '../../components/spacing/Row'
import H3 from '../../components/text/H3'
import { Text, View, TextInput } from '../../components/Themed'
import { uq_darkpink } from '../../constants/Colors'
import { keyboardAvoidBehavior, keyboardOffset, window } from '../../constants/Layout'
import { DM_DIVIDER } from '../../constants/Pongo'
import useColors from '../../hooks/useColors'
import usePongoStore from '../../state/usePongoState'
import usePosseState from '../../state/usePosseState'
import useStore from '../../state/useStore'
import { deSig } from '../../util/string'

interface ProfileScreenProps {
  navigation: NavigationProp<PongoStackParamList>
  route: RouteProp<PongoStackParamList, 'Profile'>
}

export default function ProfileScreen({ navigation, route }: ProfileScreenProps) {
  const { ship: self } = useStore()
  const { set, block, unblock, createConversation, sortedChats, loading, blocklist } = usePongoStore()
  const { tags, getTags, addTag, deleteTag } = usePosseState()
  const { color, backgroundColor, shadedBackground } = useColors()
  const { ship } = route.params
  const shipTags = tags[ship] || []
  const isBlocked = useMemo(() => Boolean(blocklist.find(s => deSig(s) === deSig(ship))), [blocklist, ship])
  const headerHeight = useHeaderHeight()

  const [tag, setTag] = useState('')
  const [error, setError] = useState('')
  const isSelf = deSig(self) === deSig(ship)

  const { width } = window

  useEffect(() => {
    getTags(ship)
  }, [ship])

  const startDm = useCallback(async () => {
    const existingChat = sortedChats.find(sc => sc.conversation.members.length === 2 && sc.conversation.members.includes(deSig(ship)))

    if (existingChat) {
      navigation.goBack()
      navigation.navigate('Chat', { id: existingChat.conversation.id })
    } else {
      set({ loading: 'Creating Chat...' })
      try {
        const newChat = await createConversation(`${self}${DM_DIVIDER}${ship}`, [ship], true)
        navigation.reset({ index: 0, routes: [ { name: 'Chats' } ] })
        if (newChat) {
          navigation.navigate('Chat', { id: newChat.conversation.id })
        }
      } catch {}
      set({ loading: null })
    }
  }, [ship, self])

  const removeTag = useCallback((tagToDelete: string) => () => {
    deleteTag(ship, tagToDelete)
  }, [ship])

  const saveTag = useCallback(() => {
    setError('')
    addTag(ship, tag)
      .then(() => setTag(''))
      .catch((err) => console.log(err))
  }, [tag, setTag, setError, addTag])

  const changeTag = useCallback((text: string) => {
    setTag(text.toLocaleLowerCase())
    setError('')
  }, [setError, setTag])

  const blockUser = useCallback(() => {
    block(ship)
  }, [ship])

  const unblockUser = useCallback(() => {
    unblock(ship)
  }, [ship])

  if (!ship) {
    return null
  }

  return (
    <KeyboardAvoidingView
      style={{ height: '100%', width: '100%', backgroundColor }}
      behavior={keyboardAvoidBehavior}
      keyboardVerticalOffset={keyboardOffset + headerHeight}
    >
      <Col style={{ width: '100%', alignItems: 'center', padding: 12, marginTop: 12 }}>
        <Avatar ship={ship} size='quarter-screen' />
        <View style={{ height: 12 }} />
        <Row>
          <ShipName name={ship} style={{ fontSize: 24, fontWeight: '600', color }} />
          {isSelf && <Text style={{ fontSize: 18, marginLeft: 8 }}>(you)</Text>}
        </Row>
      </Col>

      {loading ? (
        <Col style={{ justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', paddingBottom: '40%' }}>
          <Loader text={loading} />
        </Col>
      ) : (
        <Col style={{ width: '100%', alignItems: 'center', paddingHorizontal: 32, marginTop: 4 }}>

          <Button title='Send Message' onPress={startDm} style={{ marginBottom: 16 }} />
          <Button title={`${isBlocked ? 'Unb' : 'B'}lock ${ship}`} onPress={isBlocked ? unblockUser : blockUser} />

          <View style={{ marginTop: 16, padding: 2, borderBottomColor: uq_darkpink, borderBottomWidth: 2 }}>
            <H3 text='Posse Tags' />
          </View>
          <Row style={{ marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {!shipTags.length ? (
              <Text style={{ fontSize: 18 }}>No tags for {ship}</Text>
            ) : (
              shipTags.map(t => (
                <TagEntry onPress={removeTag(t)} tag={t} key={t} style={{ margin: 6 }}>
                  <Ionicons color='white' name='close-circle-outline' size={20} style={{ marginRight: 4 }} />
                </TagEntry>
              ))
            )}
          </Row>
          <Col style={{ marginTop: 16 }}>
            <Row>
              <TextInput
                value={tag}
                placeholder='Tag'
                onChangeText={changeTag}
                style={{ height: 40, width: 200 }}
              />
              <Button title='Add Tag' onPress={saveTag} style={{ width: undefined, marginLeft: 8, marginRight: 0 }} />
            </Row>
            {Boolean(error) && <Text style={{ fontSize: 16, color: 'red', margin: 4 }}>{error}</Text>}
          </Col>
        </Col>
      )}

    </KeyboardAvoidingView>
  )
}
