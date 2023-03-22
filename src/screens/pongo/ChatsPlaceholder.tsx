import { NavigationProp, useNavigation } from '@react-navigation/native'
import React from 'react'
import { Image } from 'react-native'
import Button from '../../components/form/Button'

import Col from '../../components/spacing/Col'
import Row from '../../components/spacing/Row'
import H3 from '../../components/text/H3'
import { PongoStackParamList } from '../../types/Navigation'

interface ChatsPlaceholderScreenProps {
}

export default function ChatsPlaceholderScreen({  }: ChatsPlaceholderScreenProps) {
  const navigation = useNavigation<NavigationProp<PongoStackParamList>>()

  return (
    <Row style={{ flex: 1 }}>
      <Col style={{ height: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Image style={{ marginBottom: 16, width: 64, height: 64 }} source={require('../../../assets/images/pongo-logo.png')} />
        <H3 text='Pongo' style={{ marginBottom: 16 }} />
        
        <Button style={{ marginBottom: 16, width: 200 }} onPress={() => navigation.navigate('NewChat')} title='Start Chat' />
        <Button style={{ marginBottom: 16, width: 200 }} onPress={() => navigation.navigate('Contacts')} title='Search Contacts' />
        
      </Col>
    </Row>
  )
}
