import { Consumer } from "mediasoup-client/lib/Consumer";

export interface Consumers {
  [ship: string]: {
    audio?: Consumer;
    video?: Consumer;
  }
}

export interface Streams {
  [ship: string]: {
    stream: MediaStream;
    audioOn: boolean;
    videoOn: boolean;
  }
}
