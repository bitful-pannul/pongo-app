import { useCallback, useEffect, useMemo, useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Slider from '@react-native-community/slider'

import { gray_overlay, uq_pink } from "../../../constants/Colors"
import useDimensions from "../../../hooks/useDimensions"
import useColors from "../../../hooks/useColors"
import useAudioState from "../../../state/useAudioState"
import { isAndroid, isIos, isWeb } from "../../../constants/Layout"
import usePongoStore from "../../../state/usePongoState"
import { AUDIO_URL_REGEX } from "../../../util/string"
import { Text } from "../../Themed"

type AudioHeaderProps = View['props'] & { chatId: string }

export default function AudioHeader({ chatId, ...props }: AudioHeaderProps) {
  const { audio, playing, speed, status, author, audioUri, handlePositionSlide, handleSpeedSlide, togglePlay, set } = useAudioState()
  const chat = usePongoStore(state => state.chats[chatId])
  const messages = chat?.messages || []
  const { color, backgroundColor } = useColors()
  const [showSpeedSlider, setShowSpeedSlider] = useState(false)

  const playPrevious = useCallback(() => {
    if (!messages.find(({ content }) => content === audioUri)) return

    let prevUri: string | undefined
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].content === audioUri) break
      if (AUDIO_URL_REGEX.test(messages[i].content)) prevUri = messages[i].content
    }
    console.log('prevUri', prevUri)
    if (prevUri) set({ playNextAudio: true, audioUri: prevUri })
  }, [audioUri, messages, set])

  const playNext = useCallback(() => {
    if (!messages.find(({ content }) => content === audioUri)) return

    let nextUri: string | undefined
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].content === audioUri) break
      if (AUDIO_URL_REGEX.test(messages[i].content)) nextUri = messages[i].content
    }
    console.log('nextUri', nextUri)
    if (nextUri) set({ playNextAudio: true, audioUri: nextUri })
  }, [audioUri, messages, set])

  const closeHeader = useCallback(() => {
    audio?.pauseAsync().catch(console.warn)
    set({ audio: undefined })
  }, [set, audio])

  const openSpeedSlider = useCallback(() => setShowSpeedSlider(true), [])

  const hideSpeedSelector = useCallback(() => setShowSpeedSlider(false), [])

  const { cWidth } = useDimensions()

  const styles = useMemo(() => StyleSheet.create({
    container: {
      paddingTop: 6,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor,
      width: isWeb ? '100%' : cWidth,
    },
    button: {
      padding: 8,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    author: { fontSize: 18, fontWeight: 'bold' },
    progressInfo: {
      display: 'flex',
      flexDirection: 'column',
      marginLeft: 12,
    },
    text: { color },
    slider: {
      width: '100%',
      height: 2,
      marginTop: !isIos ? 0 : -8,
      marginBottom: !isIos ? 0 : -18,
    },
    speedSlider: {
      marginTop: !isIos ? 0 : -12,
      marginBottom: !isIos ? 12 : -6,
    },
    speedHeader: {
      fontWeight: 'bold',
      fontSize: 18,
      color: uq_pink,
      marginTop: 8,
      marginRight: 16,
    },
    row: { display: 'flex', flexDirection: 'row' },
    volumeButton: {
      borderColor: uq_pink,
      borderTopWidth: 2,
      borderBottomWidth: 2,
      minWidth: 24,
      height: 28,
      marginTop: 12,
    },
    volume: {
      color: uq_pink,
      fontSize: 18,
      fontWeight: 'bold',
    }
  }), [color, playing, cWidth, isWeb])

  if (!audio) return null

  if (showSpeedSlider) return (
    <View {...props} style={[styles.container, { paddingTop: 0, alignItems: 'flex-start' }, props.style]}>
      <View style={[styles.row, { justifyContent: 'space-between', width: '100%' }]}>
        <Pressable style={[styles.button, { marginLeft: 8 }]} onPress={hideSpeedSelector}>
          <Ionicons name='arrow-back-outline' color={uq_pink} size={28} style={{ marginLeft: 1 }} />
        </Pressable>
        <Text style={styles.speedHeader}>Speed: {speed}x</Text>
      </View>
      <Slider
        style={[styles.slider, styles.speedSlider]}
        value={speed}
        step={0.1}
        minimumValue={0.5}
        maximumValue={2.5}
        minimumTrackTintColor={uq_pink}
        maximumTrackTintColor={isAndroid ? color : gray_overlay}
        thumbTintColor={uq_pink}
        onSlidingComplete={handleSpeedSlide}
        tapToSeek
      />
    </View>
  )

  return (
    <View {...props} style={[styles.container, props.style]}>
      <View style={[styles.row, { justifyContent: 'space-between', width: '100%' }]}>
        <View style={[styles.row]}>
          <Pressable style={styles.button} onPress={playPrevious}>
            <Ionicons name='arrow-back' color={uq_pink} size={24} style={{ marginLeft: 1 }} />
          </Pressable>
          <Pressable style={styles.button} onPress={togglePlay}>
            <Ionicons name={playing ? 'pause' : 'play'} color={uq_pink} size={32} style={{ marginLeft: playing ? 1 : 2 }} />
          </Pressable>
          <Pressable style={styles.button} onPress={playNext}>
            <Ionicons name='arrow-forward' color={uq_pink} size={24} style={{ marginLeft: 1 }} />
          </Pressable>

          <View style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
            <Text numberOfLines={1} style={styles.author}>{author}</Text>
            <Text style={{ marginLeft: 8 }}>voice message</Text>
          </View>
        </View>

        <View style={[styles.row]}>
          <Pressable style={styles.volumeButton} onPress={openSpeedSlider}>
            <Text style={styles.volume}>{speed}x</Text>
          </Pressable>

          {/* VOLUME SELECTOR */}
          
          {/* CLOSE HEADER BUTTON */}
          <Pressable style={[styles.button, { marginLeft: 8 }]} onPress={closeHeader}>
            <Ionicons name='close-circle-outline' color={uq_pink} size={28} style={{ marginLeft: 1 }} />
          </Pressable>
        </View>
      </View>

      <Slider
        style={styles.slider}
        value={status?.positionMillis || 0}
        minimumValue={0}
        maximumValue={status?.durationMillis || 1}
        minimumTrackTintColor={uq_pink}
        maximumTrackTintColor={isAndroid ? color : gray_overlay}
        thumbTintColor='transparent'
        onSlidingComplete={handlePositionSlide}
        tapToSeek
      />
    </View>
  )
}
