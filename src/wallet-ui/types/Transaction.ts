export interface TransactionArgs {
  [key: string]: {
    [key: string]: string | number
  }
}

export interface RawTransaction {
  status: string,
  contract: string,
  budget: string,
  from: string,
  rate: string,
  action: TransactionArgs | string,
  nonce: string,
  town: string,
  hash: string
  output: {
    errorcode: "0",
    gas: "79.760"
  }
}

export interface RawTransactionWithOutput {
  transaction: RawTransaction
  output: {
    errorcode: string
    gas: string
  }
}

export interface Transaction {
  output?: {
    errorcode: string
    gas: string
  }
  hash: string
  town: string
  nonce: number
  rate: number
  budget: number
  contract: string
  from: string
  status: number
  created?: Date
  modified?: Date
  action: TransactionArgs | string
}

export interface Transactions {
  [hash: string]: Transaction
}
