import React, { useCallback, useMemo } from "react"
import { StyleSheet } from "react-native"

import Modal from "../../popup/Modal"
import { Text } from "../../Themed"
import ShipName from "../ShipName"
import useColors from "../../../hooks/useColors"
import { getShipColor } from "../../../util/number"
import Avatar from "../Avatar"
import { addSig, deSig } from "../../../util/string"
import Row from "../../spacing/Row"
import { TouchableOpacity } from "react-native"
import { IncomingCall, Message } from "../../../types/Pongo"
import { NavigationProp, useNavigation } from "@react-navigation/native"
import { PongoStackParamList } from "../../../types/Navigation"
import Col from "../../spacing/Col"


interface IncomingCallModalProps {
  incomingCall?: IncomingCall
  rejectCall: () => void
  acceptCall: () => void
}

export default function IncomingCallModal({ incomingCall, rejectCall, acceptCall }: IncomingCallModalProps) {
  const { theme } = useColors()

  const styles = useMemo(() => StyleSheet.create({
    shipName: { fontSize: 16, fontWeight: '600' },
    callButton: { marginVertical: 8, padding: 8, paddingHorizontal: 12, borderRadius: 8 },
    callButtonText: { fontWeight: '600', color: 'white' },
    acceptButton: { backgroundColor: 'green', marginRight: 16 },
    rejectButton: { backgroundColor: 'darkred' },
  }), [])

  if (!incomingCall) {
    return null
  }

  return (
    <Modal show={Boolean(incomingCall)} hide={rejectCall} dismissable={false}>
      <Col style={{ alignItems: 'center', paddingHorizontal: 24 }}>
        <Avatar size="large" ship={addSig(incomingCall.msg.author)} color={getShipColor(incomingCall.msg.author, theme)} />
        <Text style={{ marginVertical: 16, fontSize: 16, textAlign: 'center' }}>
          <ShipName ship={incomingCall.msg.author} style={styles.shipName} />
          {" is calling you."}
        </Text>
        <Row style={{ justifyContent: 'center' }}>
          <TouchableOpacity onPress={acceptCall} style={[styles.callButton, styles.acceptButton]}>
            <Text style={styles.callButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={rejectCall} style={[styles.callButton, styles.rejectButton]}>
            <Text style={styles.callButtonText}>Reject</Text>
          </TouchableOpacity>
        </Row>
      </Col>
    </Modal>
  )
}
