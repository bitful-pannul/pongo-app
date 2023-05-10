import { NavigationProp, RouteProp } from '@react-navigation/native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { KeyboardAvoidingView, Pressable, StyleSheet, TouchableOpacity } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'

import { PongoStackParamList } from '../../types/Navigation'
import Col from '../../components/spacing/Col'
import H3 from '../../components/text/H3'
import { Text, View, TextInput } from '../../components/Themed'
import { light_gray, uq_darkpink } from '../../constants/Colors'
import { keyboardAvoidBehavior, keyboardOffset } from '../../constants/Layout'
import useColors from '../../hooks/useColors'
import usePongoStore from '../../state/usePongoState'
import useStore from '../../state/useStore'
import Row from '../../components/spacing/Row'
import Button from '../../components/form/Button'
import useOrgsState from '../../state/useOrgsState'

interface OrgsScreenProps {
  navigation: NavigationProp<PongoStackParamList>
  route: RouteProp<PongoStackParamList, 'Orgs'>
}

export default function OrgsScreen({ navigation, route }: OrgsScreenProps) {
  const { orgs } = useOrgsState()
  const { backgroundColor, shadedBackground } = useColors()
  const headerHeight = useHeaderHeight()

  const styles = useMemo(() => StyleSheet.create({
    avoidingView: { flex: 1, backgroundColor },
    container: { flex: 1, alignItems: 'center', padding: 16 },
    mt16: { marginTop: 16 },
    org: { padding: 4, paddingVertical: 8, borderRadius: 4, backgroundColor: shadedBackground, marginTop: 8, width: '100%' },
    orgName: {},
  }), [backgroundColor])

  // TODO: display all orgs

  return (
    <KeyboardAvoidingView style={styles.avoidingView} behavior={keyboardAvoidBehavior} keyboardVerticalOffset={keyboardOffset + headerHeight}>
      <Col style={styles.container}>
        {Object.keys(orgs).map((orgId) => (
          <TouchableOpacity style={styles.org} key={orgId} onPress={() => navigation.navigate('Org', { orgId })}>
            <Row>
              <Text style={styles.orgName}>{orgs[orgId].name}</Text>
            </Row>
          </TouchableOpacity>
        ))}
        <Button title='Create New Org' style={styles.mt16} onPress={() => navigation.navigate('NewOrg')} />
      </Col>
    </KeyboardAvoidingView>
  )
}
