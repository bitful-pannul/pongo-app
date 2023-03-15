import create, { SetState } from "zustand"
import Urbit from "@uqbar/react-native-api"

import { DefaultStore } from "./types/types"
import { resetSubscriptions } from "./util"

export interface S3Creds {
  credentials: {
    accessKeyId: string
    endpoint: string
    secretAccessKey: string
  }
}

export interface S3Config {
  configuration: {
    buckets: string[]
    currentBucket: string
    region: string
  }
}

interface S3Update {
  's3-update': S3Creds | S3Config
}

export interface SettingsState extends DefaultStore {
  loading: boolean;
  s3Creds?: S3Creds;
  s3Config?: S3Config;
  api: Urbit | null;
  subscriptions: number[];
  init: (api: Urbit) => Promise<void>;
  set: SetState<SettingsState>;
}

export function createSubscription(app: string, path: string, e: (data: any) => void): any {
  const request = {
    app,
    path,
    event: e,
    err: () => console.warn('SUBSCRIPTION ERROR'),
    quit: () => {
      throw new Error('subscription clogged');
    }
  };
  // TODO: err, quit handling (resubscribe?)
  return request;
}

const useSettingsState = create<SettingsState>((set, get) => ({
  loading: true,
  api: null,
  subscriptions: [],
  setLoading: (loading: boolean) => set({ loading }),
  init: async (api: Urbit) => {
    const handleS3Update = (data: S3Update) => {
      if ('credentials' in data["s3-update"]) {
        set({ s3Creds: data["s3-update"] })
      } else if ('configuration' in data["s3-update"]) {
        set({ s3Config: data["s3-update"] })
      }
    }

    resetSubscriptions(set, api, get().subscriptions, [
      api.subscribe(createSubscription('s3-store', '/all', handleS3Update)),
    ])

    set({ loading: false })
  },
  clearSubscriptions: async () => {
    const { api, subscriptions } = get()
    if (api && subscriptions.length) {
      resetSubscriptions(set, api, subscriptions, [])
    }
  },
  set,
}));

export default useSettingsState;
