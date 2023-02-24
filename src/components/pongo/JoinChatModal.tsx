import { NavigationProp, useNavigation } from "@react-navigation/native"
import { useCallback, useState } from "react"
import { isValidPatp } from 'urbit-ob'

import usePongoStore from "../../state/usePongoState"
import { PongoStackParamList } from "../../types/Navigation"
import Button from "../form/Button"
import Modal from "../popup/Modal"
import Col from "../spacing/Col"
import { Text, TextInput } from "../Themed"

interface JoinChatModalProps {
  show: boolean
  hide: () => void
}

export default function JoinChatModal({ show, hide }: JoinChatModalProps) {
  const { set, makeInviteRequest } = usePongoStore()
  const navigation = useNavigation<NavigationProp<PongoStackParamList>>()

  const [joinId, setJoinId] = useState('')
  const [joinShip, setJoinShip] = useState('~')
  const [joinIdError, setJoinIdError] = useState('')
  const [joinShipError, setJoinShipError] = useState('')

  const inputJoinId = useCallback((text: string) => {
    setJoinId(text)
    setJoinIdError('')
  }, [])

  const inputJoinShip = useCallback((text: string) => {
    setJoinShip(text)
    setJoinShipError('')
  }, [])

  const joinChat = useCallback(async () => {
    if (!joinId) {
      setJoinIdError('Please enter a hex num ID')
    } else if (!isValidPatp(joinShip)) {
      setJoinShipError('Please enter a valid @p (username)')
    } else {
      try {
        const success = await makeInviteRequest(joinId, joinShip)
        if (success) {
          navigation.navigate('Chat', { id: joinId })
        }
        setJoinId('')
        setJoinShip('~')
        set({ showJoinChatModal: false })
      } catch (err) {
        setJoinShipError('Error joining the chat, please try again')
      }
    }
  }, [joinId, joinShip, makeInviteRequest])

  return (
    <Modal show={show} hide={hide}>
      <Col style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 18 }}>
          Enter the chat ID and any {'\n'} ship (user) in the chat
        </Text>
        <TextInput
          placeholder="Chat ID"
          value={joinId}
          onChangeText={inputJoinId}
          autoFocus
          style={{ marginTop: 8, width: '80%' }}
        />
        {Boolean(joinIdError) && <Text style={{ fontSize: 16, color: 'red', margin: 4 }}>{joinIdError}</Text>}
        <TextInput
          placeholder="Any ship (user) in the chat"
          value={joinShip}
          onChangeText={inputJoinShip}
          style={{ marginTop: 8, width: '80%' }}
        />
        {Boolean(joinShipError) && <Text style={{ fontSize: 16, color: 'red', margin: 4 }}>{joinShipError}</Text>}
        <Button title='Join' small onPress={joinChat} style={{ marginTop: 16 }} />
        <Button title='Cancel' small onPress={() => set({ showJoinChatModal: false })} style={{ marginTop: 16, marginBottom: 24 }} />
      </Col>
    </Modal>
  )
}
