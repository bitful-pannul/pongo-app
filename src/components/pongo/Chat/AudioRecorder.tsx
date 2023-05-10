import { useCallback, useEffect, useMemo, useState } from "react"
import { PermissionsAndroid, Platform, StyleSheet, Text, View, Animated, Easing } from "react-native"
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from "react-native-gesture-handler"
import AnimatedNode, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated"
import { Audio } from 'expo-av'
import * as Haptics from 'expo-haptics'
import { Ionicons } from "@expo/vector-icons"

import { medium_gray, uq_pink, uq_purple } from "../../../constants/Colors"
import { formatRecordTime, formatTime } from "../../../util/time"
import useKeyboard from "../../../hooks/useKeyboard"
import useDimensions from "../../../hooks/useDimensions"
import { createPulse } from "../../../util/animation"



let recording: Audio.Recording | undefined;

interface AudioRecorderProps {
  disabled: boolean
  isRecording: boolean
  setIsRecording: (value: boolean) => void
  storeAudio: (uri: string, length: number) => Promise<void>
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ disabled, isRecording, storeAudio, setIsRecording }: AudioRecorderProps) => {
  const [androidGranted, setAndroidGranted] = useState(false)
  const [micTransform] = useState(new Animated.Value(1))
  const [cancelTranslate] = useState(new Animated.Value(-24))
  const [recordOpacity] = useState(new Animated.Value(1))
  const [micAnimation, setMicAnimation] = useState(createPulse(micTransform, 1.4, 1, Easing.linear))
  const [cancelAnimation, setCancelAnimation] = useState(createPulse(cancelTranslate, 0, -24, Easing.linear))
  const [recordAnimation, setRecordAnimation] = useState(createPulse(recordOpacity, 1, 0, Easing.linear))
  const lastTranslationX = useSharedValue(0)
  const isRecordingStuff = useSharedValue(false)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timer | undefined>()
  const [time, setTime] = useState(0)
  const { cWidth } = useDimensions()

  const { isKeyboardVisible } = useKeyboard()

  const [recordingStatus, setRecordingStatus] = useState<Audio.RecordingStatus | undefined>()

  const onRecordingStatusUpdate = useCallback((status: Audio.RecordingStatus) => {
    setRecordingStatus(status)
  }, [])

  const startRecording = useCallback(async function(cancel: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    try {
      console.log('Requesting permissions..')
      await Audio.requestPermissionsAsync()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })

      console.log('Starting recording..')

      if (recording) {
        try {
          await recording.stopAndUnloadAsync()
        } catch {}
      }
      recording = undefined

      recording = new Audio.Recording()
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await recording.setOnRecordingStatusUpdate(onRecordingStatusUpdate)
      await recording.startAsync()
      console.log('Recording started')
      setTime(0)
      setTimerInterval(
        setInterval(() => {
          setTime((prevTime) => prevTime + 1)
        }, 9)
      )

      setIsRecording(true)
      isRecordingStuff.value = true
      const newMicAnimation = createPulse(micTransform, 1.4, 1, Easing.linear)
      const newCancelAnimation = createPulse(cancelTranslate, 0, -24, Easing.linear)
      const newRecordAnimation = createPulse(recordOpacity, 1, 0, Easing.linear)
      setMicAnimation(newMicAnimation)
      setCancelAnimation(newCancelAnimation)
      setRecordAnimation(newRecordAnimation)
      newMicAnimation.start()
      newCancelAnimation.start()
      newRecordAnimation.start()
    } catch (err) {
      console.error('Failed to start recording', err)
    }
  }, [micAnimation, cancelAnimation, recordAnimation, setIsRecording, isKeyboardVisible])

  const stopRecording = useCallback(async function(cancel?: boolean) {
    setIsRecording(false)
    isRecordingStuff.value = false
    lastTranslationX.value = 0
    micAnimation.stop()
    cancelAnimation.stop()
    recordAnimation.stop()
    clearInterval(timerInterval)
    setTimerInterval(undefined)
    console.log('Stopping recording...', cancel)
    try {
      if (recording) {
        const finalStatus = await recording.getStatusAsync()
        const endedStatus = await recording.stopAndUnloadAsync()
        setRecordingStatus(endedStatus)
        if (!cancel) {
          const uri = recording.getURI()
          console.log('Recording stopped and stored at', uri)
          if (uri) {
            storeAudio(uri, finalStatus.durationMillis)
          }
        }
      }
    } catch {
      setRecordingStatus(undefined)
    }

    setTimeout(() => {
      Audio.setAudioModeAsync({ allowsRecordingIOS: false })
    }, 100)
  }, [micAnimation, cancelAnimation, recordAnimation, timerInterval, setIsRecording])

  // const recordTime = (recordingStatus?.durationMillis || 0)
  // const formattedRecordTime = formatRecordTime(recordTime, true)

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        const hasPermissionWrite = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE)
        const hasPermissionRecord = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
 
        if (hasPermissionRecord && hasPermissionWrite) {
          setAndroidGranted(true)
        } else {
          setAndroidGranted(false)
        }
      } else {
        setAndroidGranted(true)
      }
    })()
  }, [])
 
  const styles = useMemo(() => StyleSheet.create({
    container: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      position: 'absolute',
      width: recordingStatus?.isRecording ? cWidth : undefined,
      right: 0,
      backgroundColor: 'white',
      minHeight: 48,
      height: '100%'
    },
    recordingButton: {
      backgroundColor: uq_pink,
      width: 80,
      height: 80,
      position: 'absolute',
      right: -12,
      bottom: -12,
      borderRadius: 40,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    recordingInfo: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      width: 120,
    },
    recordingIndicator: {
      width: 10,
      height: 10,
      borderRadius: 8,
      backgroundColor: 'red',
      marginLeft: 16,
      marginRight: 8,
    },
    prompt: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: -50,
    }
  }), [recordingStatus, cWidth])

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .shouldCancelWhenOutside(true)
    .onStart((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      if (!disabled) runOnJS(startRecording)(isKeyboardVisible)
    })
    .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      lastTranslationX.value = e.translationX
    })
    .onEnd((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      runOnJS(stopRecording)(Math.abs(e.translationX) > (cWidth / 4))
    })
    .onTouchesUp(() => {
      runOnJS(stopRecording)(lastTranslationX.value < -(cWidth / 4))
    })

  const animatedStyle = useAnimatedStyle(() => ({
    flex: isRecordingStuff.value ? 1 : undefined,
  }))

  const formattedRecordTime = formatTime(time)

  // Renders
  return (
    <GestureDetector gesture={panGesture}>
      <AnimatedNode.View style={[animatedStyle, styles.container]}>
        {isRecordingStuff.value && (
          <>
            {lastTranslationX.value < -(cWidth / 4) ? (
              <Animated.View style={[styles.recordingInfo, { marginLeft: 16 }, { transform: [{ scale: micTransform }, {perspective: 1000}] }]}>
                <Ionicons name='trash' size={24} style={{ marginLeft: 16 }} color='red' />
              </Animated.View>
            ) : (
              <View style={styles.recordingInfo}>
                <Animated.View style={[styles.recordingIndicator, { opacity: recordOpacity }]} />
                <Text>{formattedRecordTime}</Text>
              </View>
            )}
            <Animated.View style={[styles.prompt, { transform: [{ translateX: cancelTranslate }, {perspective: 1000}] }]}>
              <Ionicons name='chevron-back' size={16} color='black' />
              <Text style={{ marginLeft: 8 }}>Slide to cancel</Text>
            </Animated.View>
          </>
        )}

        <View>
          <Ionicons name='mic-outline' size={32} style={{ marginRight: 8, marginTop: 2, padding: 4 }} color={disabled ? medium_gray : uq_purple} />
          {isRecordingStuff.value && (
            <Animated.View style={[styles.recordingButton, { transform: [{ scale: micTransform }, {perspective: 1000}] }]}>
              <Ionicons name='mic' color='white' size={32} />
            </Animated.View>
          )}
        </View>
      </AnimatedNode.View>
    </GestureDetector>
  )
}
 
export default AudioRecorder
 

