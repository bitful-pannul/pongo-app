export interface CreateTokenized {
  metadata: string
  amount: number
  'bond-id': string
  symbol: string
}

export interface Tokenized {
  metadata: string
  amount: string
  bond_id: string
  symbol: string
}

export interface CreateTableValues {
  'min-players': number
  'max-players': number
  'game-type': GameType
  host: string
  'custom-host': string
  tokenized: CreateTokenized
  public: boolean
  'spectators-allowed': boolean
  'turn-time-limit': string // in seconds
  'starting-stack': number
  'round-duration'?: string // in minutes
  'starting-blinds'?: string
  'small-blind'?: number
  'big-blind'?: number
  'buy-ins': null,
  'min-buy': number,
  'max-buy': number,
  'chips-per-token': number,
  // 'current-round': number
  // 'round-is-over': boolean
}

export interface Table {
  id: string
  leader: string
  players: string[]
  min_players: string
  max_players: string
  game_type: CashGame | TournamentGame
  tokenized: Tokenized | null
  bond_id: string | null
  spectators_allowed: boolean
  turn_time_limit: string
  public: boolean
}

export interface Pot {
  amount: string
  players_in: string[]
}

export interface Player {
  ship: string
  stack: string
  committed: string
  acted: boolean
  folded: boolean
  left: boolean
}

export interface Message {
  from: string
  msg: string
}

export interface Lobby {
  [tableId: string]: Table
}

export type GameType = 'cash' | 'sng'

export type Denomination = '$' | 'BB'

interface GameTypeInfo {
  type: GameType
  starting_stack: string
}

export interface CashGame extends GameTypeInfo {
  small_blind: string
  big_blind: string
}

export interface TournamentGame extends GameTypeInfo {
  round_duration: string
  blinds_schedule: string[][]
  current_round: string
  round_is_over: boolean
}

export interface Game {
  id: string
  game_is_over: boolean
  game_type: CashGame | TournamentGame
  turn_time_limit: string
  players: Player[]
  pots: Pot[]
  current_bet: string
  last_bet: string
  min_bet: string
  board: Card[]
  hand: Card[]
  current_turn: string
  dealer: string
  small_blind: string
  big_blind: string
  spectators_allowed: boolean
  spectators: string[]
  hands_played: string
  update_message: string
  revealed_hands: { [ship: string /*includes sig*/]: Card[] }
  hand_rank: string
  turn_start: string // hoon date
  last_action: null | 'fold' | 'check' | 'call' | 'raise'
  hide_actions: boolean
  winner?: string
  winning_hand?: string
  // update_message: {
  //   text: string
  //   winning_hand: Card[]
  // }
}

export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds'
export type CardValue = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  val: string
  suit: Suit
}
