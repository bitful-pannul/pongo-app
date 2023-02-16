import Urbit from "@uqbar/react-native-api"

export interface DefaultStore {
  api: Urbit | null
  subscriptions: number[]
  init: (api: Urbit, clearState?: boolean) => Promise<void>
  clearSubscriptions: () => Promise<void>
}
