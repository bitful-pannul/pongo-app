import { create, SetState } from "zustand"
import { Audio, AVPlaybackStatus, AVPlaybackStatusError, AVPlaybackStatusSuccess } from "expo-av";

interface AudioState {
  audio: Audio.Sound | undefined;
  audioUri: string | undefined;
  author: string | undefined;
  playing: boolean;
  playNextAudio: boolean;
  status: AVPlaybackStatusSuccess | undefined;
  error: AVPlaybackStatusError | undefined;
  speed: number;

  togglePlay: () => void;
  playPauseAudio: (audioObject: Audio.Sound, uri: string, authorShip: string, nextAudioUri?: string) => void;
  handlePositionSlide: (value: number) => void;
  handleSpeedSlide: (value: number) => void;
  set: SetState<AudioState>;
}

const useAudioState = create<AudioState>((set, get) => ({
  audio: undefined,
  audioUri: undefined,
  author: undefined,
  playing: false,
  playNextAudio: false,
  status: undefined,
  error: undefined,
  speed: 1,
  togglePlay: () => {
    const { audio, playing } = get()
    if (audio) {
      if (!playing) {
        audio.playAsync().catch((err) => console.warn('play:', err))
      } else {
        audio.pauseAsync().catch((err) => console.warn('pause:', err))
      }
      set({ playing: !playing })
    }
  },
  playPauseAudio: (audioObject: Audio.Sound, uri: string, authorShip: string, nextAudioUri?: string) => {
    const { audio, playing, speed, audioUri } = get()

    if (audio && audioObject._key === audio?._key) {
      if (!playing) {
        audio?.playAsync().catch((err) => console.warn('play:', err))
      } else {
        audio?.pauseAsync().catch((err) => console.warn('pause:', err))
      }
      set({ playing: !playing })
    } else {
      audio?.pauseAsync().catch((err) => console.warn('pause:', err))

      set({
        playNextAudio: false,
        audio: audioObject,
        audioUri: uri,
        author: authorShip,
        playing: true,
      })
      audioObject.playAsync().catch((err) => console.log('play:', err))
    }
  },

  handlePositionSlide: (value: number) => {
    get().audio?.setPositionAsync(value).catch()
  },

  handleSpeedSlide: (value: number) => {
    const rounded = Math.round(value * 10) / 10
    set({ speed: rounded })
    get().audio?.setRateAsync(rounded, true).catch()
  },
  set
}))

export default useAudioState
