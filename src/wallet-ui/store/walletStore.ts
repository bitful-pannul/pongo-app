import create, { SetState } from "zustand"
import { persist } from "zustand/middleware"
import Urbit from '@uqbar/react-native-api'

import { HotWallet, processAccount, RawAccount, HardwareWallet, HardwareWalletType, Seed } from "@uqbar/wallet-ui/types/Accounts"
import { SendNftPayload, SendCustomTransactionPayload, SendTokenPayload } from "@uqbar/wallet-ui/types/SendTransaction"
import { Transactions, Transaction } from "@uqbar/wallet-ui/types/Transaction"
import { TokenMetadataStore } from "@uqbar/wallet-ui/types/TokenMetadata"
import { Assets } from "@uqbar/wallet-ui/types/Assets"
// import { deriveLedgerAddress, getLedgerAddress } from "../utils/ledger"
// import { deriveTrezorAddress, getTrezorAddress } from "../utils/trezor"
import { handleBookUpdate, handleTxnUpdate, handleMetadataUpdate, createSubscription } from "./subscriptions"
import { addHexDots } from "../utils/format"
import { generateSendTokenPayload } from "../utils/wallet"
import { parseRawTransaction, processTransactions } from "../utils/transactions"
import { Alert } from "react-native"

const resetSubscriptions = async (set: SetState<any>, api: Urbit, oldSubs: number[], newSubs: Promise<number>[]) => {
  await Promise.all(oldSubs.map(os => api.unsubscribe(os)))
  const subscriptions = await Promise.all(newSubs)
  set({ api, subscriptions })
}

interface InitOptions {
  assets?: boolean
  transactions?: boolean
  prompt?: boolean
  failOnError?: boolean
  onReceiveTransaction?: (txn: Transaction) => void
}

export interface WalletStore {
  api: Urbit | null;
  subscriptions: number[];
  loadingText: string | null;
  insetView?: string;
  accounts: HotWallet[];
  importedAccounts: HardwareWallet[];
  selectedAccount?: HotWallet | HardwareWallet;
  metadata: TokenMetadataStore;
  assets: Assets;
  selectedTown: number;
  transactions: Transaction[];
  unsignedTransactions: Transactions;
  mostRecentTransaction?: Transaction;
  walletTitleBase: string;
  promptInstall: boolean;
  appInstalled: boolean;
  clearSubscriptions: () => Promise<void>;
  initWallet: (api: Urbit, options: InitOptions) => Promise<void>;
  setLoading: (loadingText: string | null) => void;
  setPromptInstall: (promptInstall: boolean) => void;
  setInsetView: (insetView?: string) => void;
  getAccounts: (api?: Urbit) => Promise<void>;
  setSelectedAccount: (selectedAccount: HotWallet | HardwareWallet) => void;
  getTransactions: () => Promise<void>;
  createAccount: (password: string, nick: string) => Promise<void>;
  deriveNewAddress: (hdpath: string, nick: string, type?: HardwareWalletType) => Promise<void>;
  trackAddress: (address: string, nick: string) => Promise<void>;
  editNickname: (address: string, nick: string) => Promise<void>;
  restoreAccount: (mnemonic: string, password: string, nick: string) => Promise<void>;
  importAccount: (type: HardwareWalletType, nick: string) => Promise<void>;
  deleteAccount: (address: string) => Promise<void>;
  getSeed: () => Promise<Seed>;
  setNode: (town: number, ship: string) => Promise<void>;
  setIndexer: (ship: string) => Promise<void>;
  sendTokens: (payload: SendTokenPayload) => Promise<void>;
  sendNft: (payload: SendNftPayload) => Promise<void>;
  sendCustomTransaction: (payload: SendCustomTransactionPayload) => Promise<void>;
  getPendingHash: () => Promise<{ hash: string; txn: any; }>;
  deleteUnsignedTransaction: (address: string, hash: string) => Promise<void>;
  getUnsignedTransactions: () => Promise<{ [hash: string]: Transaction }>;
  submitSignedHash: (from: string, hash: string, rate: number, bud: number, ethHash?: string, sig?: { v: number; r: string; s: string; }) => Promise<void>;
  setMostRecentTransaction: (mostRecentTransaction?: Transaction) => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
    api: null,
    subscriptions: [],
    loadingText: 'Loading...',
    accounts: [],
    importedAccounts: [],
    metadata: {},
    assets: {},
    selectedTown: 0,
    transactions: [],
    unsignedTransactions: {},
    walletTitleBase: 'Wallet:',
    promptInstall: false,
    appInstalled: true,
    initWallet: async (api: Urbit, { assets = true, transactions = true, prompt = false, failOnError = false, onReceiveTransaction }: InitOptions) => {
      const { getAccounts, getTransactions, getUnsignedTransactions } = get()
      set({ loadingText: 'Loading...' })

      if (api) {
        if (prompt) {
          try {
            await api.scry({ app: 'wallet', path: '/accounts' })
          } catch (err) {
            // TODO: change the install logic here
            return set({ promptInstall: true, appInstalled: false, loadingText: null })
          }
        }

        const newSubs = []
  
        try {
          if (assets) {
            newSubs.push(api.subscribe(createSubscription('wallet', '/book-updates', handleBookUpdate(get, set)))) // get asset list
            newSubs.push(api.subscribe(createSubscription('wallet', '/metadata-updates', handleMetadataUpdate(get, set))))
          }
          if (transactions) {
            getTransactions()
            getUnsignedTransactions()
            newSubs.push(api.subscribe(createSubscription('wallet', '/tx-updates', handleTxnUpdate(get, set, onReceiveTransaction))))
          }
          await getAccounts(api)
        } catch (error) {
          console.warn('INIT ERROR:', error)
          if (failOnError) {
            throw new Error('init error')
          }
        }

        resetSubscriptions(set, api, get().subscriptions, newSubs)
      }

      set({ loadingText: null })
    },
    clearSubscriptions: async () => {
      const { api, subscriptions } = get()
      if (api && subscriptions.length) {
        resetSubscriptions(set, api, subscriptions, [])
      }
    },
    setPromptInstall: (promptInstall: boolean) => set({ promptInstall }),
    setSelectedAccount: (selectedAccount?: HotWallet | HardwareWallet) => set({ selectedAccount }),
    setLoading: (loadingText: string | null) => set({ loadingText }),
    setInsetView: (insetView?: string) => set({ insetView }),
    getAccounts: async (api?: Urbit) => {
      const apiToUse = api || get().api
      if (apiToUse) {
        const accountData = await apiToUse.scry<{[key: string]: RawAccount}>({ app: 'wallet', path: '/accounts' }) || {}
        const allAccounts = Object.values(accountData).map(processAccount).sort((a, b) => a.nick.localeCompare(b.nick))
  
        const { accounts, importedAccounts } = allAccounts.reduce(({ accounts, importedAccounts }, cur) => {
          if (cur.imported) {
            const [nick, type] = cur.nick.split('//')
            importedAccounts.push({ ...cur, type: type as HardwareWalletType, nick })
          } else {
            accounts.push(cur)
          }
          return { accounts, importedAccounts }
        }, { accounts: [] as HotWallet[], importedAccounts: [] as HardwareWallet[] })
  
        set({ accounts, importedAccounts, loadingText: null })
  
        if (!get().selectedAccount) set({ selectedAccount: (accounts as any[]).concat(importedAccounts)[0] })
      }
    },
    getTransactions: async () => {
      const result = await api.scry<any>({ app: 'wallet', path: `/transactions` })
      const rawTransactions = processTransactions(result)
      const transactions = rawTransactions.sort((a, b) => b.nonce - a.nonce)
      set({ transactions })
    },
    createAccount: async (password: string, nick: string) => {
      await get().api?.poke({ app: 'wallet', mark: 'wallet-poke', json: { 'generate-hot-wallet': { password, nick } } })
      get().getAccounts()
    },
    deriveNewAddress: async (hdpath: string, nick: string, type?: HardwareWalletType) => {
      set({ loadingText: 'Deriving address, this could take up to 60 seconds...' })
      try {
        if (type) {
          return 
          // let deriveAddress: ((path: string) => Promise<string>) | undefined
          // if (type === 'ledger') {
          //   deriveAddress = deriveLedgerAddress
          // }
          // else if (type === 'trezor') {
          //   deriveAddress = deriveTrezorAddress
          // }

          // if (deriveAddress !== undefined) {
          //   const importedAddress = await deriveAddress(hdpath)
          //   if (importedAddress) {
          //     const { importedAccounts } = get()
          //     if (!importedAccounts.find(({ address }) => importedAddress === address)) {
          //       await get().api?.poke({
          //         app: 'wallet',
          //         mark: 'wallet-poke',
          //         json: {
          //           'add-tracked-address': { address: addHexDots(importedAddress), nick: `${nick}//${type}` }
          //         }
          //       })
          //     } else {
          //       alert('You have already imported this address.')
          //     }
          //   }
          // }
        } else {
          await get().api?.poke({ app: 'wallet', mark: 'wallet-poke', json: { 'derive-new-address': { hdpath, nick } } })
        }
        get().getAccounts()
      } catch (error) {
        console.warn('ERROR DERIVING ADDRESS:', error)
        window.alert('There was an error deriving the address, please check the HD path and try again.')
      }
      set({ loadingText: null })
    },
    trackAddress: async (address: string, nick: string) => {
      await get().api?.poke({ app: 'wallet', mark: 'wallet-poke', json: { 'add-tracked-address': { address, nick } } })
      get().getAccounts()
    },
    editNickname: async (address: string, nick: string) => {
      await get().api?.poke({ app: 'wallet', mark: 'wallet-poke', json: { 'edit-nickname': { address, nick } } })
      get().getAccounts()
    },
    restoreAccount: async (mnemonic: string, password: string, nick: string) => {
      await get().api?.poke({ app: 'wallet', mark: 'wallet-poke', json: { 'import-seed': { mnemonic, password, nick } } })
      get().getAccounts()
    },
    importAccount: async (type: HardwareWalletType, nick: string) => {
      set({ loadingText: 'Importing...' })

      let importedAddress: string | undefined = ''

      // if (type === 'ledger'){
      //   importedAddress = await getLedgerAddress()
      // } else if (type === 'trezor') {
      //   importedAddress = await getTrezorAddress()
      // }

      // if (importedAddress) {
      //   // TODO: get nonce info
      //   const { importedAccounts } = get()

      //   if (!importedAccounts.find(({ address }) => importedAddress === address)) {
      //     await get().api?.poke({
      //       app: 'wallet',
      //       mark: 'wallet-poke',
      //       json: {
      //         'add-tracked-address': { address: addHexDots(importedAddress), nick: `${nick}//${type}` }
      //       }
      //     })
      //     get().getAccounts()
      //   } else {
      //     set({ loadingText: null })
      //     alert('You have already imported this address.')
      //   }
      // }
      set({ loadingText: null })
    },
    deleteAccount: async (address: string) => {
      Alert.prompt(
        'Remove Address',
        `Are you sure you want to remove this address?\n\n${addHexDots(address)}`,
        [
          {
            text: 'Yes',
            onPress: async () => {
              await get().api?.poke({ app: 'wallet', mark: 'wallet-poke', json: { 'delete-address': { address } } })
              get().getAccounts()
            },
            style: 'default',
          },
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
        ]
      )
    },
    getSeed: async () => {
      const seedData = await api.scry<Seed>({ app: 'wallet', path: '/seed' })
      return seedData
    },
    setNode: async (town: number, ship: string) => {
      const json = { 'set-node': { town, ship } }
      await get().api?.poke({ app: 'wallet', mark: 'wallet-poke', json  })
      set({ selectedTown: town })
    },
    setIndexer: async (ship: string) => {
      const json = { 'set-indexer': { ship } }
      await get().api?.poke({ app: 'wallet', mark: 'wallet-poke', json })
    },
    sendTokens: async (payload: SendTokenPayload) => {
      const json = generateSendTokenPayload(payload)
      await get().api?.poke({ app: 'wallet', mark: 'wallet-poke', json })
    },
    sendNft: async (payload: SendNftPayload) => {
      const json = generateSendTokenPayload(payload)
      await get().api?.poke({ app: 'wallet', mark: 'wallet-poke', json })
    },
    sendCustomTransaction: async ({ from, contract, town, action }: SendCustomTransactionPayload) => {
      const json = { 'transaction': { from, contract, town, action: { text: action } } }
      await get().api?.poke({ app: 'wallet', mark: 'wallet-poke', json })
    },
    getPendingHash: async () => {
      const { hash, txn } = await api.scry<{ hash: string; txn: any }>({ app: 'wallet', path: '/pending' }) || {}
      return { hash, txn }
    },
    deleteUnsignedTransaction: async (address: string, hash: string) => {
      const json = { 'delete-pending': { from: address, hash } }
      await get().api?.poke({ app: 'wallet', mark: 'wallet-poke', json })
      get().getUnsignedTransactions()
    },
    getUnsignedTransactions: async () => {
      const { accounts, importedAccounts } = get()
      const unsigned: any = await Promise.all(
        accounts
          .map(({ rawAddress }) => rawAddress)
          .concat(importedAccounts.map(({ rawAddress }) => rawAddress))
          .map(address => api.scry<Transactions>({ app: 'wallet', path: `/pending/${address}` }))
      )
      const unsignedMap = unsigned.reduce((acc: Transactions, cur: Transactions) => ({ ...acc, ...cur }), {})
      const unsignedTransactions = Object.keys(unsignedMap).reduce((acc, hash) => {
        acc[hash] = parseRawTransaction(unsignedMap[hash])
        return acc
      }, {} as Transactions)
      
      set({ unsignedTransactions })
      return unsignedTransactions
    },
    submitSignedHash: async (from: string, hash: string, rate: number, bud: number, ethHash?: string, sig?: { v: number; r: string; s: string; }) => {
      console.log('ETH HASH & SIG:', ethHash, sig)
      const json = ethHash && sig ?
        { 'submit-signed': { from, hash, gas: { rate, bud }, 'eth-hash': ethHash, sig } } :
        { 'submit': { from, hash, gas: { rate, bud } } }
      await get().api?.poke({ app: 'wallet', mark: 'wallet-poke', json })
      get().getUnsignedTransactions()
    },
    setMostRecentTransaction: (mostRecentTransaction?: Transaction) => set({ mostRecentTransaction })
  })
)
