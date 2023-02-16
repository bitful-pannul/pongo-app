import { GetState, SetState } from "zustand";
import { Assets } from "../types/Assets";
import { Transaction, RawTransaction, RawTransactionWithOutput } from "../types/Transaction";
import { showNotification } from "../utils/notification";
import { WalletStore } from "./walletStore";
import { TokenMetadataStore } from "../types/TokenMetadata";
import { Token } from "../types/Token";
import { SUCCESSFUL_STATUS, UNSIGNED_STATUS } from "../utils/constants";
import { parseRawTransaction } from "../utils/transactions";

export interface Subscriptions {
  [project: string]: Promise<number>[]
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

export const handleBookUpdate = (get: GetState<WalletStore>, set: SetState<WalletStore>) => (balanceData: Assets) => {
  console.log('ASSETS:', balanceData)
  const assets: Assets = {}

  Object.keys(balanceData).forEach(holder => {
    assets[holder] = Object.keys(balanceData[holder]).reduce((acc, cur) => {
      acc[cur] = { ...balanceData[holder][cur], holder }
      return acc
    }, {} as { [key: string]: Token })
  })

  set({ assets })
}

export const handleMetadataUpdate = (get: GetState<WalletStore>, set: SetState<WalletStore>) => (metadata: TokenMetadataStore) => {
  console.log('METADATA', metadata)
  set({ metadata })
}

export const handleTxnUpdate = (get: GetState<WalletStore>, set: SetState<WalletStore>, onReceiveTransaction?: (txn: Transaction) => void) =>
async (rawTxn: { [key: string]: RawTransaction | RawTransactionWithOutput }) => {
  console.log('RAW TXN:', rawTxn)
  const txnHash = Object.keys(rawTxn)[0]
  const txn = parseRawTransaction('transaction' in rawTxn[txnHash] ? (rawTxn[txnHash] as any).transaction : rawTxn[txnHash])
  console.log('PARSED TXN UPDATE:', txn)

  if (onReceiveTransaction) onReceiveTransaction(txn)

  const { transactions } = get()

  const exists = transactions.find(({ hash }) => txn.hash === hash)

  if (exists) {
    if (exists.status !== SUCCESSFUL_STATUS && txn.status === SUCCESSFUL_STATUS) {
      showNotification(`Transaction confirmed!`)
    }

    const newTransactions = transactions.map(t => ({ ...t, modified: t.hash === txn.hash ? new Date() : t.modified, status: Number(t.hash === txn.hash ? txn.status : t.status) }))
    set({ transactions: newTransactions, mostRecentTransaction: { ...exists, ...txn } })
  } else if (txn.hash && txn.status !== UNSIGNED_STATUS) {
    // TODO: make sure sent-to-us will show up in getTransactions
    set({ transactions: [{ ...txn, created: new Date(), modified: new Date() } as Transaction].concat(transactions), mostRecentTransaction: txn })
  } else if (txn.hash && txn.status === UNSIGNED_STATUS) {
    const newUnsigned = { ...get().unsignedTransactions }
    newUnsigned[txn.hash] = txn
    set({ unsignedTransactions: newUnsigned, mostRecentTransaction: txn })
  }
}
