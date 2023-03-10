import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, Text, Keyboard } from "react-native";
import { Audio, AVPlaybackStatus, AVPlaybackStatusError, AVPlaybackStatusSuccess } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Slider from '@react-native-community/slider'

import { uq_pink } from "../../../constants/Colors";
import { formatRecordTime, ONE_SECOND } from "../../../util/time";
import { isIos, window } from "../../../constants/Layout";

const thumbImage = require('../../../../assets/images/slider_thumb.png')

type AudioPlayerProps = View['props'] & { uri: string, color: string }

export default function AudioPlayer({ uri, color, ...props }: AudioPlayerProps) {
  const [audio, setAudio] = useState<Audio.Sound | undefined>()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<AVPlaybackStatusSuccess | undefined>()
  const [error, setError] = useState<AVPlaybackStatusError | undefined>()
  const [playing, setPlaying] = useState(false)

  const { width, height } = window

  useEffect(() => {
    getAudio()
  }, [])

  const getAudio = useCallback(async () => {
    setLoading(true)
    try {
      const { sound: playbackObject } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }
      )
  
      playbackObject.setProgressUpdateIntervalAsync(ONE_SECOND * 0.2)
      playbackObject.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if ('isPlaying' in status) {
          setStatus(status)
          if (status.positionMillis === status.durationMillis && !status.isPlaying && !status.shouldPlay) {
            playbackObject.setPositionAsync(0).catch((err) => console.log('set position 0:', err))
            setPlaying(false)
          }
        } else {
          setError(status)
        }
      })
      setAudio(playbackObject)
    } catch {
      setError({ isLoaded: false, error: 'Failed to load' })
    }
    setLoading(false)
  }, [uri, setAudio, setLoading])

  const togglePlay = useCallback(() => {
    if (audio) {
      if (!playing) {
        audio?.playAsync().catch((err) => console.log('play:', err))
      } else {
        audio?.pauseAsync().catch((err) => console.log('pause:', err))
      }
      setPlaying(!playing)
    } else if (!loading) {
      getAudio()
    }
  }, [playing, audio, loading, setLoading, getAudio])

  const handleSlidingComplete = useCallback((value: number) => {
    audio?.setPositionAsync(value).catch()
  }, [audio])

  const styles = useMemo(() => StyleSheet.create({
    container: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 4,
    },
    button: {
      padding: 8,
      height: 44,
      width: 44,
      borderRadius: 22,
      backgroundColor: uq_pink,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressInfo: {
      display: 'flex',
      flexDirection: 'column',
      marginLeft: 12,
    },
    text: { color },
    slider: {
      width: width * 0.7 - 80,
      height: 20,
      marginVertical: 4,
    }
  }), [color, playing, width])

  const duration = (status && 'durationMillis' in status && formatRecordTime(status.durationMillis || 0)) || '0:00'
  const position = (status && 'positionMillis' in status && formatRecordTime(status.positionMillis || 0)) || '0:00'

  return (
    <View {...props} style={[styles.container, props.style]}>
      <Pressable style={styles.button} onPress={togglePlay} disabled={loading}>
        {!audio && !loading ? (
          <Ionicons name='download' color='white' size={24} style={{ marginLeft: 1 }} />
        ) : loading ? (
          <ActivityIndicator color='white' />
        ) : (
          <Ionicons name={playing ? 'pause' : 'play'} color='white' size={28} style={{ marginLeft: playing ? 1 : 2 }} />
        )}
      </Pressable>
      <View style={styles.progressInfo}>
        <Slider
          style={styles.slider}
          value={status?.positionMillis || 0}
          minimumValue={0}
          maximumValue={status?.durationMillis || 1}
          minimumTrackTintColor={uq_pink}
          maximumTrackTintColor={color}
          thumbTintColor={uq_pink}
          onSlidingComplete={handleSlidingComplete}
          tapToSeek
        />
        {status?.positionMillis && status.positionMillis > 0 ? (
          <Text style={[styles.text]}>{position}</Text>
        ) : (
          Boolean(status) && <Text style={[styles.text]}>{duration}</Text>
        )}
      </View>
      <Ionicons />
    </View>
  )
}
