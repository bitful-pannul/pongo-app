import Urbit from "@uqbar/react-native-api"

export interface DefaultStore {
  api: Urbit | null
  subscriptions: number[]
  init: (api: Urbit, clearState?: boolean, other?: any) => Promise<any>
  clearSubscriptions: () => Promise<void>
}
