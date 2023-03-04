import { Ionicons } from '@expo/vector-icons'
import { NavigationProp, RouteProp } from '@react-navigation/native'
import React, { useCallback, useMemo, useState } from 'react'
import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu'
import { isValidPatp } from 'urbit-ob'
import * as Clipboard from 'expo-clipboard'

import { PongoStackParamList } from '../../types/Navigation'
import Button from '../../components/form/Button'
import Avatar from '../../components/pongo/Avatar'
import ShipName from '../../components/pongo/ShipName'
import Col from '../../components/spacing/Col'
import Row from '../../components/spacing/Row'
import H2 from '../../components/text/H2'
import H3 from '../../components/text/H3'
import { Text, View, TextInput } from '../../components/Themed'
import { uq_darkpink } from '../../constants/Colors'
import useColors from '../../hooks/useColors'
import usePongoStore from '../../state/usePongoState'
import useStore from '../../state/useStore'
import { MessageKind } from '../../types/Pongo'
import { addSig, deSig } from '../../util/string'
import { window } from '../../constants/Layout'

interface GroupScreenProps {
  navigation: NavigationProp<PongoStackParamList>
  route: RouteProp<PongoStackParamList, 'Group'>
}

export default function GroupScreen({ navigation, route }: GroupScreenProps) {
  const { ship: self } = useStore()
  const { set, chats, sendMessage, makeInvite, toggleMute } = usePongoStore()
  const { color, backgroundColor } = useColors()
  const [display, setDisplay] = useState<'members' | 'settings'>('members')
  const [newMember, setNewMember] = useState('~')
  const [newGroupName, setNewGroupName] = useState('')
  const [newMemberError, setNewMemberError] = useState('')
  const [groupNameError, setGroupNameError] = useState('')

  const convo = route.params.id
  const chat = chats[route.params.id || '']

  const updateShip = useCallback((ship: string, kind: MessageKind) => () => {
    sendMessage({ self, convo, kind, content: ship })
  }, [convo, self, sendMessage])

  const changeNewMember = useCallback((text: string) => {
    setNewMember(text)
    setNewMemberError('')
  }, [])

  const changeNewGroupName = useCallback((text: string) => {
    setNewGroupName(text)
    setGroupNameError('')
  }, [])

  const changeMute = useCallback(() => toggleMute(convo), [convo])

  const addNewMember = useCallback(async () => {
    if (isValidPatp(newMember)) {
      try {
        setNewMember('~')
        await makeInvite(convo, newMember)
      } catch {
        setNewMember(newMember)
        setNewMemberError('Error adding member')
      }
    } else {
      setNewMemberError('Not a valid @p (username)')
    }
  }, [convo, newMember])

  const changeGroupName = useCallback(async () => {
    if (newGroupName.trim().length > 2) {
      try {
        setNewGroupName('')
        await sendMessage({ self, convo, kind: 'change-name', content: newGroupName })
      } catch {
        setNewGroupName(newGroupName)
        setGroupNameError('Error updating group name')
      }
    } else {
      setGroupNameError('Must be at least 3 characters')
    }
  }, [convo, newGroupName])

  if (!chat) {
    return null
  }

  const styles = StyleSheet.create({
    headerStyle: {
      padding: 2,
      margin: 12,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    member: {
      marginTop: 4,
      padding: 4,
    },
    shipName: {
      fontSize: 20,
      fontWeight: '600',
      marginLeft: 8,
      color,
    },
  })

  const { conversation: { members, leaders } } = chat
  const { width, height } = window
  const selfIsAdmin = useMemo(() => chat.conversation.leaders.includes(deSig(self)), [chat])

  return (
    <View style={{ height: '100%', width: '100%' }}>
      <Col style={{ flex: 1, alignItems: 'center', paddingVertical: 24 }}>
        <H2 text={chat.conversation.name} />
        <TouchableOpacity onPress={() => Clipboard.setStringAsync(convo)} style={{ marginTop: 4 }}>
          <Row style={{ width: 200 }}>
            <Text style={{ fontSize: 18, marginLeft: -4 }} numberOfLines={1}>ID: {convo}</Text>
            <Ionicons style={{ marginLeft: 8 }} size={26} name='copy-outline' />
          </Row>
        </TouchableOpacity>
        <Row style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
          <TouchableOpacity onPress={() => setDisplay('members')} style={[styles.headerStyle, display === 'members' && { borderBottomColor: uq_darkpink }]}>
            <H3 text={`Members (${chat.conversation.members.length})`} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDisplay('settings')} style={[styles.headerStyle, display === 'settings' && { borderBottomColor: uq_darkpink }]}>
            <H3 text='Settings' />
          </TouchableOpacity>
        </Row>

        {display === 'members' && (
          <>
            <Col style={{ marginBottom: 4, marginHorizontal: width * 0.1 }}>
              <Row>
                <TextInput
                  value={newMember}
                  placeholder='New Member'
                  onChangeText={changeNewMember}
                  style={{ height: 40, width: 220 }}
                  autoCorrect={false}
                  autoCapitalize='none'
                  autoComplete='off'
                />
                <Button title='Add' onPress={addNewMember} style={{ width: undefined, marginLeft: 8, marginRight: 0 }} />
              </Row>
              {Boolean(newMemberError) && <Text style={{ fontSize: 16, color: 'red', margin: 4 }}>{newMemberError}</Text>}
            </Col>

            <ScrollView style={{ width, paddingHorizontal: width / 10, flex: 1}} keyboardShouldPersistTaps='handled'>
              {members.map(mem => {
                const isAdmin = leaders?.includes(deSig(mem))

                return (
                  <TouchableOpacity key={mem} onPress={() => navigation.navigate('Profile', { ship: addSig(mem) })} style={styles.member}>
                    <Row style={{ justifyContent: 'space-between', width: width * 0.75 }}>
                      <Row>
                        <Avatar ship={addSig(mem)} size={'large'} />
                        <ShipName style={styles.shipName} name={addSig(mem)} />
                        {isAdmin && <Text style={{ fontSize: 18, marginLeft: 8 }}>(admin)</Text>}
                      </Row>
                      {selfIsAdmin && deSig(self) !== deSig(mem) && <Menu>
                        <MenuTrigger>
                          <Ionicons name='menu' size={24} color={color} style={{ padding: 4 }} />
                        </MenuTrigger>
                        <MenuOptions style={{ backgroundColor }}>
                          <MenuOption onSelect={updateShip(addSig(mem), 'member-remove')}>
                            <Row style={{ justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, paddingVertical: 4 }}>
                              <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 8 }}>Remove</Text>
                              <Ionicons name='person-remove' size={24} color={color} style={{ padding: 4 }} />
                            </Row>
                          </MenuOption>
                          {isAdmin ? (
                            <MenuOption onSelect={updateShip(addSig(mem), 'leader-remove')}>
                              <Row style={{ justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, paddingVertical: 4 }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 8 }}>Remove Admin</Text>
                                <Ionicons name='arrow-down-circle-outline' size={24} color={color} style={{ padding: 4 }} />
                              </Row>
                            </MenuOption>
                          ) : (
                            <MenuOption onSelect={updateShip(addSig(mem), 'leader-add')}>
                              <Row style={{ justifyContent: 'flex-end', alignItems: 'center', paddingRight: 12, paddingVertical: 4 }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', marginRight: 8 }}>Add Admin</Text>
                                <Ionicons name='arrow-up-circle-outline' size={24} color={color} style={{ padding: 4 }} />
                              </Row>
                            </MenuOption>
                          )}
                        </MenuOptions>
                      </Menu>}
                    </Row>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </>
        )}

        {display === 'settings' && (
          <Col style={{ marginTop: 8 }}>
            {/* TODO: change group name, other permissions that we think of */}
            <Button onPress={changeMute} style={{ width: width * 0.6 }} title={`${chat.conversation.muted ? 'Unmute' : 'Mute'} Chat`} />
            {selfIsAdmin && (
              <Col style={{ marginTop: 8 }}>
                <Text style={{ marginBottom: 9, fontSize: 18 }}>Update Group Name</Text>
                <Row>
                  <TextInput
                    value={newGroupName}
                    placeholder='New Group Name'
                    onChangeText={changeNewGroupName}
                    style={{ height: 40, width: 200 }}
                  />
                  <Button title='Update' onPress={changeGroupName} style={{ width: undefined, marginLeft: 8, marginRight: 0 }} />
                </Row>
                {Boolean(groupNameError) && <Text style={{ fontSize: 16, color: 'red', margin: 4 }}>{groupNameError}</Text>}
              </Col>
            )}
            {/* kind === 'change-router' */}
          </Col>
        )}
        
      </Col>
    </View>
  )
}
