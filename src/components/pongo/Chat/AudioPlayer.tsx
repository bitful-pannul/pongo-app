import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, Text } from "react-native";
import { Audio, AVPlaybackStatus, AVPlaybackStatusError, AVPlaybackStatusSuccess, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Slider from '@react-native-community/slider'

import { gray_overlay, uq_pink } from "../../../constants/Colors";
import { formatRecordTime, ONE_SECOND } from "../../../util/time";
import useDimensions from "../../../hooks/useDimensions";
import useAudioState from "../../../state/useAudioState";
import { isAndroid, isIos } from "../../../constants/Layout";

const thumbImage = require('../../../../assets/images/slider_thumb.png')

type AudioPlayerProps = View['props'] & { uri: string, author: string, color: string, nextAudioUri?: string }

export default function AudioPlayer({ uri, author, color, nextAudioUri, ...props }: AudioPlayerProps) {
  const { audio, status: headerStatus, audioUri, playNextAudio, speed, handlePositionSlide, playPauseAudio, set } = useAudioState()
  const [audioData, setAudioData] = useState<Audio.Sound | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AVPlaybackStatusError | undefined>()
  const [status, setStatus] = useState<AVPlaybackStatusSuccess | undefined>()

  const { cWidth } = useDimensions()

  const getAudio = useCallback(async () => {
    setLoading(true)
    try {
      const { sound: playbackObject } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }
      )
      playbackObject.setProgressUpdateIntervalAsync(ONE_SECOND * 0.2)
      playbackObject.setRateAsync(speed, true).catch()
      playbackObject.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if ('isPlaying' in status) {
          set({ status })
          setStatus(status)
          if (status.positionMillis === status.durationMillis && !status.isPlaying) {
            playbackObject.setPositionAsync(0).catch((err) => console.warn('set position 0:', err))
            playbackObject.pauseAsync().catch((err) => console.warn('pause:', err))
            set({ playing: false })

            // TODO: play the next voice message if it's the next message
            if (nextAudioUri) {
              set({ audioUri: nextAudioUri, playNextAudio: true })
            } else {
              set({ audio: undefined, audioUri: undefined, playing: false, status: undefined })
            }
          }
        } else {
          set({ error: status })
        }
      })
      setAudioData(playbackObject)

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        playsInSilentModeIOS: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      })
    } catch {
      setError({ isLoaded: false, error: 'Failed to load' })
    }
    setLoading(false)
  }, [uri, speed, setAudioData, setLoading, set])

  useEffect(() => {
    getAudio()
  }, [uri, getAudio])

  useEffect(() => {
    if (audioUri === uri && playNextAudio && audioData) {
      playPauseAudio(audioData, uri, author, nextAudioUri)
    }
  }, [playNextAudio, audioUri, author, audioData, uri, playPauseAudio])

  const playPause = useCallback(() => {
    if (audioData) {
      playPauseAudio(audioData, uri, author, nextAudioUri)
    } else if (!loading) {
      getAudio()
    }
  }, [audioData, uri, author, loading, getAudio, playPauseAudio])

  const isCurrentAudio = useMemo(() => audioUri === uri, [audioUri, uri])

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
      width: cWidth * 0.7 - 80,
      height: 20,
      marginVertical: 4,
    }
  }), [color, status?.isPlaying, cWidth])

  const duration = (status && 'durationMillis' in status && formatRecordTime(status.durationMillis || 0)) || '0:00'
  const position = (status && 'positionMillis' in status && formatRecordTime(status.positionMillis || 0)) || '0:00'

  return (
    <View {...props} style={[styles.container, props.style]}>
      <Pressable style={styles.button} onPress={playPause} disabled={loading}>
        {!audioData && !loading ? (
          <Ionicons name='download' color='white' size={24} style={{ marginLeft: 1 }} />
        ) : loading ? (
          <ActivityIndicator color='white' />
        ) : (
          <Ionicons name={isCurrentAudio && status?.isPlaying ? 'pause' : 'play'} color='white' size={28} style={{ marginLeft: status?.isPlaying ? 1 : 2 }} />
        )}
      </Pressable>
      <View style={styles.progressInfo}>
        <Slider
          style={styles.slider}
          value={isCurrentAudio ? status?.positionMillis || 0 : 0}
          minimumValue={0}
          maximumValue={status?.durationMillis || 1}
          minimumTrackTintColor={uq_pink}
          maximumTrackTintColor={isAndroid ? color : gray_overlay}
          thumbTintColor={uq_pink}
          onSlidingComplete={handlePositionSlide}
          tapToSeek
          disabled={!isCurrentAudio}
        />
        {status?.positionMillis && status.positionMillis > 0 ? (
          <Text style={[styles.text]}>{isCurrentAudio ? position : '0:00'}</Text>
        ) : (
          Boolean(status) && <Text style={[styles.text]}>{duration}</Text>
        )}
      </View>
      <Ionicons />
    </View>
  )
}
