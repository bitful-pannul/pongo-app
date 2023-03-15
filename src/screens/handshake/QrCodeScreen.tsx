import React, { useEffect, useState } from 'react'
import QRCode from 'react-native-qrcode-svg'
import { Ionicons } from "@expo/vector-icons"

import useScanStore from '../../state/useHandshakeState'
import { Text, View } from '../../components/Themed'
import UqbarExperience from '../../components/handshake/UqbarExperience'
import { TouchableOpacity } from 'react-native'
import useStore from '../../state/useStore'
import Col from '../../components/spacing/Col'
import { window } from '../../constants/Layout'
import Row from '../../components/spacing/Row'
import useColors from '../../hooks/useColors'
import { ONE_SECOND } from '../../util/time'

const padSeconds = (s: number) => `${s < 10 ? '0' : ''}${s}`
const calcDiff = (expiresAt: Date | null) => Math.round(((expiresAt?.getTime() || new Date().getTime()) - new Date().getTime()) / ONE_SECOND)

const QrCodeScreen = () => {
  const { createCode, code, expiresAt, loading } = useScanStore()
  const [diff, setDiff] = useState(calcDiff(expiresAt))
  const { ship } = useStore()
  const { color } = useColors()

  useEffect(() => {
    setTimeout(createCode, ONE_SECOND)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setDiff(calcDiff(expiresAt))
    }, 990)

    return () => clearInterval(interval)
  }, [expiresAt])

  const textColor = (!loading && code && diff < 60) ? 'red' : color

  const expiration = (code: string, diff: number, loading: boolean) => {
    if (loading) {
      return <Text style={{ color: textColor, fontSize: 16 }}>Loading...</Text>
    } else if (!code) {
      return <Text style={{ color: textColor, fontSize: 16 }}>Please generate a code.</Text>
    } else if (diff <= 0) {
      return <Text style={{ color: textColor, fontSize: 16 }}>Expired. Please refresh below.</Text>
    }
    return <Text style={{ color: textColor, fontSize: 16 }}>
      Expires in <Text style={{ fontSize: 16 }} mono>{Math.floor(diff / 60)}:{padSeconds(diff % 60)}</Text>
    </Text>
  }

  const width = window.width - 120

  return (
    <View style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16 }}>
      <Text style={{ lineHeight: 24, marginBottom: 24, textAlign: 'center' }}>
        This code matches your Urbit ID and can be scanned {'\n'} by another handshake app using the Scan tab.
      </Text>
      {code ? (
        <Col style={{ padding: 4, backgroundColor: 'white', marginBottom: 12, alignItems: 'center' }}>
          <QRCode size={width} value={code} />
        </Col>
      ) : (
        <Col style={{ height: 320, marginBottom: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Loading...</Text>
        </Col>
      )}
      <Row style={{ marginTop: 12 }}>
        {Boolean(code) && expiration(code || '', diff, loading)}
        <TouchableOpacity onPress={createCode} style={{ marginLeft: 16 }}>
          <Ionicons size={32} name='refresh-circle' color={color} />
        </TouchableOpacity>
      </Row>
      <UqbarExperience />
    </View>
  )
}

export default QrCodeScreen
