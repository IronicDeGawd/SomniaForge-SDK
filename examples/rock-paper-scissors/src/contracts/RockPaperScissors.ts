import { keccak256, encodePacked, Address, Hash, createPublicClient, http, getContract } from 'viem'
import { SomniaGameSDK } from '@somniaforge/sdk'

// Rock Paper Scissors contract address on Somnia testnet
export const ROCK_PAPER_SCISSORS_ADDRESS = '0x38e4C113767fC478B17b15Cee015ab8452f28F93' as const

// Move enum matching the contract
export enum RPSMove {
  None = 0,
  Rock = 1,
  Paper = 2,
  Scissors = 3
}

// Game result interface matching contract struct
export interface RPSGameResult {
  winner: Address
  players: Address[]
  moves: RPSMove[]
  prizeAmount: bigint
  isDraw: boolean
  completedAt: bigint
}

// Utility functions for Rock Paper Scissors game
export class RockPaperScissorsUtils {
  /**
   * Create proper move hash matching contract expectation
   * Contract expects: keccak256(abi.encodePacked(msg.sender, uint256(move), nonce))
   */
  static createMoveHash(player: Address, move: RPSMove, nonce: bigint): Hash {
    return keccak256(
      encodePacked(
        ['address', 'uint256', 'uint256'],
        [player, BigInt(move), nonce]
      )
    )
  }

  /**
   * Convert string move to RPSMove enum
   */
  static stringToMove(move: string): RPSMove {
    switch (move.toLowerCase()) {
      case 'rock':
        return RPSMove.Rock
      case 'paper':
        return RPSMove.Paper
      case 'scissors':
        return RPSMove.Scissors
      default:
        return RPSMove.None
    }
  }

  /**
   * Convert RPSMove enum to string
   */
  static moveToString(move: RPSMove): string {
    switch (move) {
      case RPSMove.Rock:
        return 'rock'
      case RPSMove.Paper:
        return 'paper'
      case RPSMove.Scissors:
        return 'scissors'
      default:
        return 'none'
    }
  }

  /**
   * Get move emoji for display
   */
  static getMoveEmoji(move: RPSMove | string): string {
    const moveStr = typeof move === 'string' ? move : RockPaperScissorsUtils.moveToString(move)
    switch (moveStr) {
      case 'rock':
        return '🪨'
      case 'paper':
        return '📄'
      case 'scissors':
        return '✂️'
      default:
        return '❓'
    }
  }

  /**
   * Determine winner between two moves
   * Returns: 1 if move1 wins, -1 if move2 wins, 0 if tie
   */
  static determineWinner(move1: RPSMove, move2: RPSMove): number {
    if (move1 === move2) return 0
    
    if (
      (move1 === RPSMove.Rock && move2 === RPSMove.Scissors) ||
      (move1 === RPSMove.Paper && move2 === RPSMove.Rock) ||
      (move1 === RPSMove.Scissors && move2 === RPSMove.Paper)
    ) {
      return 1
    }
    
    return -1
  }
}

/**
 * Rock Paper Scissors game manager for interacting with the contract
 * This handles the specific RPS contract calls using the base SDK
 */
export class RPSGameManager {
  private sdk: SomniaGameSDK

  constructor(sdk: SomniaGameSDK) {
    this.sdk = sdk
  }

  /**
   * Create a new Rock Paper Scissors game
   */
  async createRPSGame(entryFee: bigint): Promise<bigint> {
    if (!this.sdk.wallet.getWalletClient()) {
      throw new Error('Wallet not connected')
    }

    try {
      // For now, use the GameSession contract to create sessions
      // In a full implementation, this would call the RockPaperScissors contract directly
      const sessionId = await this.sdk.gameSession.createSession(
        2, // maxPlayers for RPS
        600, // moveTimeLimit (10 minutes)
        entryFee
      )

      return sessionId
    } catch (error) {
      throw new Error(`Failed to create RPS game: ${error}`)
    }
  }

  /**
   * Join an existing Rock Paper Scissors game
   */
  async joinRPSGame(sessionId: bigint): Promise<void> {
    try {
      await this.sdk.gameSession.joinSession(sessionId)
    } catch (error) {
      throw new Error(`Failed to join RPS game: ${error}`)
    }
  }

  /**
   * Commit a move using proper hash
   */
  async commitMove(sessionId: bigint, player: Address, move: RPSMove, nonce: bigint): Promise<Hash> {
    try {
      const moveHash = RockPaperScissorsUtils.createMoveHash(player, move, nonce)
      return await this.sdk.gameSession.submitMove(sessionId, moveHash)
    } catch (error) {
      throw new Error(`Failed to commit move: ${error}`)
    }
  }

  /**
   * Get game session details
   */
  async getGameSession(sessionId: bigint) {
    try {
      return await this.sdk.gameSession.getSessionById(sessionId)
    } catch (error) {
      throw new Error(`Failed to get game session: ${error}`)
    }
  }
}