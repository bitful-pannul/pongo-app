export const PUBLIC_URL = '/apps/ziggurat'
export const ZIGS_ACCOUNT_ID = '0x7606.5857.3281.e401.e302.1994.b290.0c32.a17b.cc89.c5d9.d78a.4b5e.4938.ee05.af06'
export const MY_CONTRACT_ID = '0xfafa.fafa'
export const METADATA_GRAIN_ID = '0xdada.dada'
export const DUMMY_METADATA = {
  id: METADATA_GRAIN_ID,
  holder: MY_CONTRACT_ID,
  source: MY_CONTRACT_ID,
  town_id: '0x0',
  label: 'token-metadata',
  salt: '3859435834985',
  data: `['ZOG' 'ZIG' 18 1.000.000 ~ | ~ 0x0 385.9435.834.985]`
}

export const DEFAULT_TOWN_ID = '0x0'
export const DEFAULT_USER_ADDRESS = '0xdead.beef'
export const DEFAULT_RATE = 1
export const DEFAULT_BUDGET = 1000000 // 1 million

export const ZIGGURAT_STORAGE_VERSION = 2
export const INDEXER_STORAGE_VERSION = 2
export const WALLET_STORAGE_VERSION = 2

export const BASENAME = '/apps/ziggurat'
export const WEBTERM_PATH = '/apps/webterm'

export const DEFAULT_TXN_COST = 0.000000000001000000

export const STATUS_CODES : { [key: number] : string } = {
  // 100: 'transaction pending in wallet',
  // 101: 'transaction submitted to sequencer',
  // 102: 'transaction received by sequencer',
  // 103: 'failure: transaction rejected by sequencer',
  100: 'pending in wallet',
  101: 'submitted to sequencer',
  102: 'received by sequencer',
  103: 'failure: rejected by sequencer',

  // ::  200-class refers to codes that come from a completed transaction
  // ::  that sequencer has given us a receipt for,
  // ::  informed by status codes in smart.hoon
  // ::
  // ::  300-class are equivalent, but the transaction has been officially
  // ::  included in a batch.
  200: 'successfully performed',
  201: 'bad signature',
  202: 'incorrect nonce',
  203: 'lack zigs to fulfill budget',
  204: 'couldn\'t find contract',
  205: 'data was under contract ID',
  206: 'crash in contract execution',
  207: 'validation of diff failed',
  208: 'ran out of gas while executing',
  209: 'dedicated burn transaction failed',

  300: 'successfully performed',
  301: 'bad signature',
  302: 'incorrect nonce',
  303: 'lack zigs to fulfill budget',
  304: 'couldn\'t find contract',
  305: 'data was under contract ID',
  306: 'crash in contract execution',
  307: 'validation of diff failed',
  308: 'ran out of gas while executing',
  309: 'dedicated burn transaction failed',
}

export const STATUS_CODES_RAW : { [key: number] : string } = {
  0: 'successfully performed',
  1: 'bad signature',
  2: 'incorrect nonce',
  3: 'lack zigs to fulfill budget',
  4: 'couldn\'t find contract',
  5: 'data was under contract ID',
  6: 'crash in contract execution',
  7: 'validation of diff failed',
  8: 'ran out of gas while executing',
  9: 'dedicated burn transaction failed',
}

export const UNSIGNED_STATUS = 100
export const SUCCESSFUL_STATUS = 200

export const getStatus = (status: number) => STATUS_CODES[status] || 'unknown'

export const getRawStatus = (status: number) => STATUS_CODES_RAW[status] || 'unknown'

export const useMockData = process.env.NODE_ENV === 'development' && Boolean(process.env.REACT_APP_MOCK_DATA)

export const ONE_SECOND = 1000
export const THIRTY_SECONDS = 30 * ONE_SECOND

export const DEFAULT_TOWN_TEST = '0x0'
export const ZIGS_CONTRACT = '0x74.6361.7274.6e6f.632d.7367.697a'

export const ZIG_HOST = '~dister-dozzod-bacdun'
export const ZIG_APP = 'zig'
