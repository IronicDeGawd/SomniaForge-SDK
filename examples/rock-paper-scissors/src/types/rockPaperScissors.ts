import { Address } from 'viem'

export enum RPSMove {
  None = 0,
  Rock = 1,
  Paper = 2,
  Scissors = 3
}

export interface RPSGameResult {
  winner: Address
  players: Address[]
  moves: RPSMove[]
  prizeAmount: bigint
  isDraw: boolean
  completedAt: bigint
}

export interface RPSGameMove {
  move: RPSMove
  nonce: bigint
  revealed: boolean
}

export type GameState = 'idle' | 'creating' | 'joining' | 'waiting' | 'committing' | 'revealing' | 'finished'