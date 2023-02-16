import React, { useCallback, useEffect, useState } from 'react'

import useHandshakeStore from '../../state/useHandshakeState'
import usePosseState from '../../state/usePosseState'
import Button from '../form/Button'
import Modal from '../popup/Modal'
import Col from '../spacing/Col'
import { Text, TextInput } from '../Themed'

export const PossePopup = () => {
  const { possePopupShip, showPossePopup, setPossePopupShip } = useHandshakeStore()
  const { addTag } = usePosseState()
  const [tag, setTag] = useState('')

  const saveTag = useCallback(async () => {
    try {
      if (possePopupShip) {
        const newTag = tag || 'handshake'
        await addTag(possePopupShip, newTag)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPossePopupShip()
      setTag('')
    }
  }, [possePopupShip, tag, addTag, setPossePopupShip])

  const cancel = useCallback(() => {
    setPossePopupShip()
    setTag('')
  }, [setPossePopupShip])

  return (
    <Modal show={showPossePopup} hide={() => setPossePopupShip()}>
      <Col style={{ alignItems: "center" }}>
        <Text style={{ marginBottom: 16, fontSize: 16 }}>Add a tag to save <Text mono>{possePopupShip}</Text> as a pal</Text>
        <TextInput
          placeholder="handshake"
          value={tag}
          onChangeText={text => setTag(text)}
          autoFocus
          style={{
            width: '80%'
          }}
        />
        <Button title='Add Tag' small onPress={saveTag} style={{ marginTop: 16 }} />
        <Button title='Cancel' small onPress={cancel} style={{ marginTop: 16, marginBottom: 24 }} />
      </Col>
    </Modal>
  )
}
