import React, { useMemo } from 'react'
import { View as DefaultView, StyleSheet } from 'react-native'
import { RTCView } from 'react-native-webrtc-web-shim'
// import { RTCView } from 'react-native-webrtc'
import { Ionicons } from '@expo/vector-icons'

import { Text, View } from '../../Themed'
import { isWeb } from '../../../constants/Layout'
import { addSig } from '../../../util/string'

interface UserFeedProps {
  ship: string;
  feed: {
    stream: MediaStream;
    audioOn: boolean;
    videoOn: boolean;
  }
}

export default function UserFeed ({ ship, feed }: UserFeedProps) {
  const { stream, audioOn, videoOn } = feed

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    infoText: { fontSize: 18, marginTop: 32 },
    // videoContainer: { height: '80%', width: cWidth, marginTop: 16, marginBottom: 'auto' },
    videoContainer: { flex: 1 },
    // counterpartyVideoDisabled: { height: '80%', width: cWidth, marginTop: 16, marginBottom: 'auto', backgroundColor: 'black' },
    counterpartyVideoDisabled: { flex: 1, backgroundColor: 'black' },
    video: { flex: 1, width: '100%', height: '100%' },
    counterpartyMuted: { position: 'absolute', top: 16, left: 16, backgroundColor: 'white', padding: 12, height: 48, width: 48, borderRadius: 24 },
    shipLabelContainer: { position: 'absolute', top: 0, left: 0, width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center' },
    shipLabel: { padding: 8, paddingHorizontal: 12, borderBottomRightRadius: 8, borderBottomLeftRadius: 8 },
    shipLabelText: { fontSize: 16, fontWeight: '600' },
  }), [])

  return (
    <View style={styles.videoContainer}>
      <DefaultView style={styles.shipLabelContainer}>
        <View style={styles.shipLabel}>
          <Text style={styles.shipLabelText}>{addSig(ship)}</Text>
        </View>
      </DefaultView>
      {!videoOn ? (
        <DefaultView style={styles.counterpartyVideoDisabled} />
      ) : isWeb ? (
        <RTCView objectFit={'contain'} stream={stream} zOrder={0} style={styles.video} />
      ) : (
        <RTCView objectFit={'contain'} streamURL={(stream as any)?.toURL()} zOrder={0} style={styles.video} />
      )}
      {!audioOn && <DefaultView style={styles.counterpartyMuted}>
        <Ionicons name='mic-off' color='black' size={24} />
      </DefaultView>}
    </View>
  )
}
