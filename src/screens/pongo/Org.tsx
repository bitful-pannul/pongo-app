import { NavigationProp, RouteProp } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, KeyboardAvoidingView, Pressable, StyleSheet } from 'react-native'
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
import { light_gray, uq_darkpink } from '../../constants/Colors'
import { isWeb, keyboardAvoidBehavior, keyboardOffset } from '../../constants/Layout'
import { DM_DIVIDER } from '../../constants/Pongo'
import useColors from '../../hooks/useColors'
import usePongoStore from '../../state/usePongoState'
import usePosseState from '../../state/usePosseState'
import useStore from '../../state/useStore'
import { deSig } from '../../util/string'
import { defaultOptions } from '../../util/toast'
import { getShipColor } from '../../util/number'
import useOrgsState from '../../state/useOrgsState'

interface OrgScreenProps {
  navigation: NavigationProp<PongoStackParamList>
  route: RouteProp<PongoStackParamList, 'Org'>
}

export default function OrgScreen({ navigation, route }: OrgScreenProps) {
  const { ship: self } = useStore()
  const { set, createConversation, sortedChats, loading, blocklist, chats } = usePongoStore()
  const { orgs, deleteOrg } = useOrgsState()
  const { color, backgroundColor, shadedBackground, theme } = useColors()
  const { orgId } = route.params
  const headerHeight = useHeaderHeight()
  
  const org = orgs[orgId]
  
  const [desc, setDesc] = useState(org?.desc || '')
  const [controller, setController] = useState(org?.controller || '')
  
  const createSubOrg = useCallback(() => {
    navigation.navigate('NewOrg', { parent: orgId })
  }, [orgId])

  const deleteOrganization = useCallback(async () => {
    if (isWeb && window.confirm('Are you sure you want to delete this organization?')) {
      await deleteOrg(org.controller, org.name, org.parent_path || '')
      navigation.goBack()
    } else if (!isWeb) {
      Alert.prompt('Delete Org', 'Are you sure you want to delete this organization?', [
        { text: 'Delete', onPress: async () => {
          await deleteOrg(org.controller, org.name, org.parent_path || '')
          navigation.goBack()
        } },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }, [org, navigation])

  const styles = useMemo(() => StyleSheet.create({
    avoidingView: { flex: 1, backgroundColor },
    container: { flex: 1, alignItems: 'center', padding: 16 },
    name: {},
    label: { marginTop: 8, fontWeight: '600', fontSize: 16 },
    value: { fontSize: 18, marginTop: 4 },
    input: {
      height: 40,
      borderColor: light_gray,
      borderWidth: 1,
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    subOrg: {
      borderRadius: 4,
      marginTop: 4, marginRight: 4,
      padding: 4,
      paddingVertical: 2,
      backgroundColor: shadedBackground,
    },
    member: {
      borderRadius: 4,
      marginTop: 4, marginRight: 4,
      padding: 4,
      paddingVertical: 2,
      backgroundColor: shadedBackground,
    },
  }), [backgroundColor])

  // TODO: add a member, remove a member, edit tags, delete the org, add sub org

  return (
    <KeyboardAvoidingView style={styles.avoidingView} behavior={keyboardAvoidBehavior} keyboardVerticalOffset={keyboardOffset + headerHeight}>
      <Col style={styles.container}>
        <H3 style={styles.name} text={org.name} />
        {Boolean(org?.parent_path) && <>
          <Text style={styles.label}>Parent Path</Text>
          <Text style={styles.value}>{org.parent_path}</Text>
        </>}
        <Text style={styles.label}>Controller</Text>
        <TextInput
          style={styles.input}
          value={controller}
          onChangeText={setController}
        />
        <TextInput
          multiline style={styles.input}
          placeholder='None'
          value={desc}
          onChangeText={setDesc}
        />

        <Text style={styles.label}>Sub Orgs</Text>
        <Row>
          {org.sub_orgs.map((subOrg) => (
            <Row style={styles.subOrg}>
              <Avatar key={subOrg} ship={subOrg} color={color} />
              <ShipName ship={subOrg} />
            </Row>
          ))}
        </Row>

        <Text style={styles.label}>Members</Text>
        <Row>
          {org.members.map((member) => (
            <Row style={styles.member}>
              <Avatar key={member} ship={member} color={color} />
              <ShipName ship={member} />
            </Row>
          ))}
        </Row>

        <Button title='Add Sub Org' onPress={createSubOrg} />
        <Button title='Delete Org' onPress={deleteOrganization} />
      </Col>
    </KeyboardAvoidingView>
  )
}
