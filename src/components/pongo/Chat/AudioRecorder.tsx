import { useCallback, useEffect, useMemo, useState } from "react"
import { PermissionsAndroid, Platform, Pressable, StyleSheet, Text, View, Animated, Easing, EasingFunction, Keyboard } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Audio } from 'expo-av'
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from "react-native-gesture-handler"
import AnimatedNode, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated"
import * as Haptics from 'expo-haptics'

import { uq_pink, uq_purple } from "../../../constants/Colors"
import { formatRecordTime } from "../../../util/time"
import useKeyboard from "../../../hooks/useKeyboard"
import useDimensions from "../../../hooks/useDimensions"

interface AudioRecorderProps {
  setIsRecording: (value: boolean) => void
  storeAudio: (uri: string) => void
}

const createPulse = (value: Animated.Value, max: number, min: number, easing: EasingFunction) => Animated.loop(
  Animated.sequence([
    Animated.timing(value, {
        toValue: max,
        duration: 500,
        useNativeDriver: true,
        easing,
    }),
    Animated.timing(value, {
        toValue: min,
        duration: 500,
        useNativeDriver: true,
        easing,
    }),
  ]),
  {
    iterations: -1
  }
)

const AudioRecorder: React.FC<AudioRecorderProps> = ({ storeAudio, setIsRecording }: AudioRecorderProps) => {
  const [androidGranted, setAndroidGranted] = useState(false)
  const [micTransform] = useState(new Animated.Value(1))
  const [cancelTranslate] = useState(new Animated.Value(-24))
  const [recordOpacity] = useState(new Animated.Value(1))
  const [micAnimation, setMicAnimation] = useState(createPulse(micTransform, 1.4, 1, Easing.linear))
  const [cancelAnimation, setCancelAnimation] = useState(createPulse(cancelTranslate, 0, -24, Easing.linear))
  const [recordAnimation, setRecordAnimation] = useState(createPulse(recordOpacity, 1, 0, Easing.linear))
  const lastTranslationX = useSharedValue(0)
  const isRecordingStuff = useSharedValue(false)
  const { cWidth } = useDimensions()

  const { isKeyboardVisible, keyboardHeight } = useKeyboard()

  const [recording, setRecording] = useState<Audio.Recording | undefined>()
  const [recordingStatus, setRecordingStatus] = useState<Audio.RecordingStatus | undefined>()

  const onRecordingStatusUpdate = useCallback((status: Audio.RecordingStatus) => {
    setRecordingStatus(status)
  }, [])

  const startRecording = useCallback(async function(cancel: boolean) {
    if (cancel) {
      Keyboard.dismiss()
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
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
    
    try {
      console.log('Requesting permissions..')
      await Audio.requestPermissionsAsync()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      console.log('Starting recording..')
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        onRecordingStatusUpdate
      )
      setRecording(recording)
      console.log('Recording started')
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
    console.log('Stopping recording...', cancel)
    if (recording) {
      try {
        const newStatus = await recording.stopAndUnloadAsync()
        setRecordingStatus(newStatus)
        if (!cancel) {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
          })
          const uri = recording.getURI()
          console.log('Recording stopped and stored at', uri)
          if (uri) {
            storeAudio(uri)
          }
        }
      } catch {
        setRecordingStatus(undefined)
      } finally {
        setRecording(undefined)
      }
    }
    setRecording(undefined)
  }, [recording, micAnimation, cancelAnimation, recordAnimation, setIsRecording])

  const recordTime = (recordingStatus?.durationMillis || 0)
  const formattedRecordTime = formatRecordTime(recordTime)

  // Effects
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
    },
    buttonContainer: {
      
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
  }), [recordingStatus])

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(600)
    .shouldCancelWhenOutside(true)
    .onBegin((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      runOnJS(startRecording)(isKeyboardVisible)
    })
    .onUpdate((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      lastTranslationX.value = e.translationX
    })
    .onEnd((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      console.log('X', e.translationX)
      runOnJS(stopRecording)(Math.abs(e.translationX) > (cWidth / 3.5))
    })
    .onTouchesUp(() => {
      runOnJS(stopRecording)(lastTranslationX.value < -(cWidth / 3.5))
    })

  const animatedStyle = useAnimatedStyle(() => ({
    flex: isRecordingStuff.value ? 1 : undefined,
  }))

  // Renders
  return (
    <GestureDetector gesture={panGesture}>
      <AnimatedNode.View style={[animatedStyle, styles.container]}>
        {isRecordingStuff.value && (
          <>
            {lastTranslationX.value < -(cWidth / 3.5) ? (
              <View style={styles.recordingInfo}>
                <Ionicons name='trash' size={24} style={{ marginLeft: 16 }} color='red' />
              </View>
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

        <View style={styles.buttonContainer}>
          <Ionicons name='mic-outline' size={32} style={{ marginRight: 8, padding: 8 }} color={uq_purple} />
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
 

