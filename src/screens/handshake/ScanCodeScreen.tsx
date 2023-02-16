import React, { useEffect, useState } from 'react'

import useScanStore from '../../state/useHandshakeState'
import QrCodeScanner from '../../components/handshake/QRCodeScanner'
import UqbarExperience from '../../components/handshake/UqbarExperience'
import { Text, View } from '../../components/Themed'
import H2 from '../../components/text/H2'
import { PossePopup } from '../../components/handshake/PossePopup'

const ScanCodeScreen = () => {
  const { guestSuccess, verifyCode, setGuestSuccess } = useScanStore()
  const [data, setData] = useState('')

  useEffect(() => {
    if (guestSuccess) {
      setData('')
      setTimeout(() => setGuestSuccess(undefined), 3000)
    }
  }, [guestSuccess, setGuestSuccess])

  return (
    <View style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <H2 text='Scan QR Code' style={{ marginTop: 24 }} />
      <QrCodeScanner
        onScan={(text) => {
          setData('Confirming...')
          verifyCode(text)
        }}
      />
      <Text style={{ marginVertical: 12 }}>{data}</Text>
      {guestSuccess && <Text>{guestSuccess}</Text>}
      <View style={{ height: 16 }} />
      <UqbarExperience />
      <PossePopup />
    </View>
  )
}

export default ScanCodeScreen
