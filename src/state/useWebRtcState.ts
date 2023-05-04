import { create, SetState } from "zustand"
import { Consumer } from "mediasoup-client/lib/Consumer";

import { Consumers, Streams } from "../types/WebRTC";

export interface WebRtcTags {
  [ship: string]: string[]
}

export interface WebRtcStore {
  consumers: Consumers
  streams: Streams

  setConsumers: (consumers: Consumers) => void;
  addConsumer: (ship: string, kind: 'audio' | 'video', consumer: Consumer) => void;
  removeConsumer: (ship: string) => void;
  clearState: () => void;
  set: SetState<WebRtcStore>;
}

const useWebRtcState = create<WebRtcStore>((set, get) => ({
  consumers: {},
  streams: {},
  setConsumers: (consumers: Consumers) => {
    const streams = {} as Streams
    Object.keys(consumers).forEach((ship) => {
      streams[ship] = { stream: new MediaStream(), audioOn: true, videoOn: true }
      if (consumers[ship].video) {
        streams[ship].stream.addTrack(consumers[ship].video!.track)
      }
      if (consumers[ship].audio) {
        streams[ship].stream.addTrack(consumers[ship].audio!.track)
      }
    })
    set({ consumers, streams })
  },
  addConsumer: (ship: string, kind: 'audio' | 'video', consumer: Consumer) => {
    const { consumers, streams } = get()
    const shipConsumers = consumers[ship] || {}
    shipConsumers[kind] = consumer
    const newConsumers = { ...consumers }
    newConsumers[ship] = shipConsumers
    const newStreams = { ...streams }

    if (!newStreams[ship]?.stream) newStreams[ship] = { stream: new MediaStream(), audioOn: true, videoOn: true }
    newStreams[ship].stream.addTrack(consumer.track)
    set({ consumers: newConsumers, streams: newStreams })
  },
  removeConsumer: (ship: string) => {
    const { consumers, streams } = get()
    const newConsumers = { ...consumers }
    delete newConsumers[ship]
    const newStreams = { ...streams }
    delete newConsumers[ship]
    set({ consumers: newConsumers, streams: newStreams })
  },
  clearState: () => {
    Object.values(get().streams).forEach((stream) => {
      stream.stream.getTracks().forEach((track) => track.stop())
    })
    set({ consumers: {}, streams: {} })
  },
  set,
}));

export default useWebRtcState;
