import { NavigationProp, RouteProp } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { KeyboardAvoidingView, Pressable } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import Toast from 'react-native-root-toast'
import { Ionicons } from '@expo/vector-icons'
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
import { keyboardAvoidBehavior, keyboardOffset } from '../../constants/Layout'
import { DM_DIVIDER } from '../../constants/Pongo'
import useColors from '../../hooks/useColors'
import usePongoStore from '../../state/usePongoState'
import usePosseState from '../../state/usePosseState'
import useStore from '../../state/useStore'
import { deSig } from '../../util/string'
import { defaultOptions } from '../../util/toast'
import { getShipColor } from '../../util/number'

interface ProfileScreenProps {
  navigation: NavigationProp<PongoStackParamList>
  route: RouteProp<PongoStackParamList, 'Profile'>
}

export default function ProfileScreen({ navigation, route }: ProfileScreenProps) {
  const { ship: self } = useStore()
  const { set, createConversation, sortedChats, loading, blocklist, chats } = usePongoStore()
  const { tags, getTags, addTag, deleteTag } = usePosseState()
  const { color, backgroundColor, shadedBackground, theme } = useColors()
  const { ship } = route.params
  const shipTags = tags[ship] || []
  const isBlocked = useMemo(() => Boolean(blocklist.find(s => deSig(s) === deSig(ship))), [blocklist, ship])
  const headerHeight = useHeaderHeight()

  const [tag, setTag] = useState('')
  const [error, setError] = useState('')
  const isSelf = deSig(self) === deSig(ship)

  const dmChatId = useMemo(() => {
    const existingChat = sortedChats.find(sc => sc.conversation.members.length === 2 && sc.conversation.members.includes(deSig(ship)) && sc.conversation.dm)
    return existingChat?.conversation.id
  }, [chats, ship])

  // useEffect(() => {
  //   getTags(ship)
  // }, [ship])

  const startDm = useCallback(async () => {
    if (dmChatId) {
      navigation.goBack()
      navigation.navigate('Chat', { id: dmChatId })
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
  }, [ship, self, dmChatId])

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

  const copyPatp = useCallback(() => {
    Clipboard.setStringAsync(ship)
    Toast.show('Copied!', { ...defaultOptions, duration: Toast.durations.SHORT, position: Toast.positions.CENTER })
  }, [ship])

  const startCall = useCallback(() => {
    if (dmChatId) navigation.navigate('Call', { chatId: dmChatId })
  }, [navigation, dmChatId])

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
        <Avatar ship={ship} size='quarter-screen' color={getShipColor(ship, theme)} />
        <View style={{ height: 12 }} />
        <Pressable onPress={copyPatp}>
          <Row>
            <ShipName ship={ship} showBoth style={{ fontSize: 24, fontWeight: '600', color }} />
            {isSelf && <Text style={{ fontSize: 18, marginLeft: 8 }}>(you)</Text>}
          </Row>
        </Pressable>
      </Col>

      {loading ? (
        <Col style={{ justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', paddingBottom: '40%' }}>
          <Loader text={loading} />
        </Col>
      ) : (
        <Col style={{ width: '100%', alignItems: 'center', paddingHorizontal: 32, marginTop: 4 }}>

          {!isSelf && <>
            <Button title='Send Message' onPress={startDm} style={{ marginBottom: 16 }} />
            {Boolean(dmChatId) && <Button title='Call' onPress={startCall} style={{ marginBottom: 16 }} />}
          </>}

          {/* <View style={{ marginTop: 16, padding: 2, borderBottomColor: uq_darkpink, borderBottomWidth: 2 }}>
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
              <Button title='Add Tag' small onPress={saveTag} style={{ marginLeft: 8, marginRight: 0 }} />
            </Row>
            {Boolean(error) && <Text style={{ fontSize: 16, color: 'red', margin: 4 }}>{error}</Text>}
          </Col> */}
        </Col>
      )}

    </KeyboardAvoidingView>
  )
}
