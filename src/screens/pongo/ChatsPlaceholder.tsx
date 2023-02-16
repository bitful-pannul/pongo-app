import React from 'react'
import { Image } from 'react-native'

import Col from '../../components/spacing/Col'
import Row from '../../components/spacing/Row'
import H3 from '../../components/text/H3'
import { Text, ScrollView, TextInput } from '../../components/Themed'
import { window } from '../../constants/Layout'
import ChatsScreen from './Chats'

interface ChatsPlaceholderScreenProps {
}

export default function ChatsPlaceholderScreen({  }: ChatsPlaceholderScreenProps) {
  const { width } = window

  return (
    <Row style={{ width: '100%', height: '100%' }}>
      <ChatsScreen />
      <Col style={{ height: '100%', width: width - 300, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Image style={{ marginBottom: 16, width: 64, height: 64 }} source={require('../../../assets/images/pongo-logo.png')} />
        <H3 text='Pongo' style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 20 }}> Select or create a chat</Text>
      </Col>
    </Row>
  )
}
