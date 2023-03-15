import React, { useCallback, useEffect, useState } from 'react'

import useScanStore from '../../state/useHandshakeState'
import QrCodeScanner from '../../components/handshake/QRCodeScanner'
import UqbarExperience from '../../components/handshake/UqbarExperience'
import { Text, View } from '../../components/Themed'
import H2 from '../../components/text/H2'
import { PossePopup } from '../../components/handshake/PossePopup'

const ScanCodeScreen = () => {
  const { guestSuccess, verifyCode, verifyError } = useScanStore()
  const [data, setData] = useState('')

  useEffect(() => {
    if (guestSuccess) {
      setData('')
    }
  }, [guestSuccess])

  const onScan = useCallback(async (text: string) => {
    console.log(0, text)
    try {
      setData('Confirming...')
      verifyCode(text)
    } catch (err) {
      console.log('SCAN ERROR:', err)
    } finally {
      setData('')
    }
  }, [])

  return (
    <View style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <H2 text='Scan QR Code' style={{ marginTop: 24 }} />
      <QrCodeScanner onScan={onScan} />
      <Text style={{ marginVertical: 6 }}>{data}</Text>
      <View style={{ minHeight: 18 }}>
        {verifyError && <Text style={{ color: 'red', fontSize: 18 }}>{verifyError}</Text>}
      </View>
      <UqbarExperience />
      <PossePopup />
    </View>
  )
}

export default ScanCodeScreen
