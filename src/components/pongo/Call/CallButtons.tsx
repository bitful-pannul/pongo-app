import React, { useMemo } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"

import { dark_gray_solid } from "../../../constants/Colors"

interface CallButtonsProps {
  callEnded: boolean
  micEnabled: boolean
  toggleMic: () => void
  cameraEnabled: boolean
  toggleCamera: () => void
  showChangeCamera: boolean
  changeCamera: () => void
  endCall: () => void
}

export default function CallButtons({ callEnded, micEnabled, toggleMic, cameraEnabled, toggleCamera, showChangeCamera, changeCamera, endCall }: CallButtonsProps) {
  const styles = useMemo(() => StyleSheet.create({
    buttonContainer: { display: 'flex', flexDirection: 'row', marginBottom: 8 },
    button: { margin: 8, padding: 12, borderRadius: 24, height: 48, width: 48, backgroundColor: dark_gray_solid },
    buttonIcon: { textAlign: 'center' },
    mic: { backgroundColor: micEnabled ? dark_gray_solid : 'white' },
    camera: { backgroundColor: cameraEnabled ? dark_gray_solid : 'white' },
    endCall: { backgroundColor: 'red', width: 60 },
  }), [micEnabled, cameraEnabled])

  if (callEnded) return null

  return (
    <View style={styles.buttonContainer}>
      <Pressable onPress={toggleMic} style={[styles.button, styles.mic]}>
        <Ionicons style={styles.buttonIcon} name={micEnabled ? 'mic' : 'mic-off'} size={24} color={micEnabled ? 'white' : 'black'} />
      </Pressable>
      <Pressable onPress={toggleCamera} style={[styles.button, styles.camera]}>
        <MaterialIcons style={styles.buttonIcon} name={cameraEnabled ? 'videocam' : 'videocam-off'} size={24} color={cameraEnabled ? 'white' : 'black'} />
      </Pressable>
      {showChangeCamera && <Pressable onPress={changeCamera} style={styles.button}>
        <MaterialIcons style={styles.buttonIcon} name={'flip-camera-ios'} size={24} color={'white'} />
      </Pressable>}
      <Pressable onPress={endCall} style={[styles.button, styles.endCall]}>
        <MaterialIcons style={styles.buttonIcon} name='call-end' size={28} color="white" />
      </Pressable>
    </View>
  )
}
