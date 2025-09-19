import type { Address } from 'viem'

export const RPSMove = {
  None: 0,
  Rock: 1,
  Paper: 2,
  Scissors: 3,
} as const

export type RPSMove = typeof RPSMove[keyof typeof RPSMove]

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