import {
  createPublicClient,
  http,
  webSocket,
  parseEther,
  formatEther,
  getContract,
  decodeEventLog,
  Address,
  Hash,
  WalletClient,
  PublicClient,
  keccak256,
  encodePacked
} from 'viem'
import { somniaNetwork, SOMNIA_RPC_URL, SOMNIA_WS_URL } from '../constants/network'
import { CONTRACT_ADDRESSES } from '../constants/contracts'
import { ROCK_PAPER_SCISSORS_ABI } from '../constants/abis'

// Rock Paper Scissors specific types
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

export class RockPaperScissorsManager {
  private publicClient: PublicClient
  private walletClient: WalletClient | null = null
  private wsClient: PublicClient | null = null

  constructor(rpcUrl: string = SOMNIA_RPC_URL, wsUrl: string = SOMNIA_WS_URL) {
    this.publicClient = createPublicClient({
      chain: somniaNetwork,
      transport: http(rpcUrl),
    })

    this.wsClient = createPublicClient({
      chain: somniaNetwork,
      transport: webSocket(wsUrl),
    })
  }

  async connectWallet(walletClient: WalletClient): Promise<void> {
    this.walletClient = walletClient
  }

  // Create proper move hash matching contract expectation
  static createMoveHash(player: Address, move: RPSMove, nonce: bigint): Hash {
    return keccak256(
      encodePacked(
        ['address', 'uint256', 'uint256'],
        [player, BigInt(move), nonce]
      )
    )
  }

  async createRPSGame(entryFee: bigint): Promise<bigint> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.ROCK_PAPER_SCISSORS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'createRPSGame',
        args: [entryFee],
        value: entryFee,
        account: this.walletClient.account!,
        chain: somniaNetwork,
      })

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      // Parse session ID from logs
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: ROCK_PAPER_SCISSORS_ABI,
            data: log.data,
            topics: log.topics,
          })
          
          if (decoded.eventName === 'SessionCreated') {
            return (decoded.args as any).sessionId as bigint
          }
        } catch (error) {
          continue
        }
      }

      throw new Error('Session ID not found in transaction logs')
    } catch (error) {
      throw new Error(`Failed to create RPS game: ${error}`)
    }
  }

  async joinRPSGame(sessionId: bigint, entryFee: bigint): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    try {
      return await this.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.ROCK_PAPER_SCISSORS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'joinRPSGame',
        args: [sessionId],
        value: entryFee,
        account: this.walletClient.account!,
        chain: somniaNetwork,
      })
    } catch (error) {
      throw new Error(`Failed to join RPS game: ${error}`)
    }
  }

  async commitMove(sessionId: bigint, moveHash: Hash): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    try {
      return await this.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.ROCK_PAPER_SCISSORS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'commitMove',
        args: [sessionId, moveHash],
        account: this.walletClient.account!,
        chain: somniaNetwork,
      })
    } catch (error) {
      throw new Error(`Failed to commit move: ${error}`)
    }
  }

  async revealMove(sessionId: bigint, move: RPSMove, nonce: bigint): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    try {
      return await this.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.ROCK_PAPER_SCISSORS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'revealMove',
        args: [sessionId, move, nonce],
        account: this.walletClient.account!,
        chain: somniaNetwork,
      })
    } catch (error) {
      throw new Error(`Failed to reveal move: ${error}`)
    }
  }

  async forceResolveGame(sessionId: bigint): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    try {
      return await this.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.ROCK_PAPER_SCISSORS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'forceResolveGame',
        args: [sessionId],
        account: this.walletClient.account!,
        chain: somniaNetwork,
      })
    } catch (error) {
      throw new Error(`Failed to force resolve game: ${error}`)
    }
  }

  async getGameResult(sessionId: bigint): Promise<RPSGameResult> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.ROCK_PAPER_SCISSORS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'getGameResult',
        args: [sessionId],
      }) as any

      return {
        winner: result.winner,
        players: result.players,
        moves: result.moves,
        prizeAmount: result.prizeAmount,
        isDraw: result.isDraw,
        completedAt: result.completedAt,
      }
    } catch (error) {
      throw new Error(`Failed to get game result: ${error}`)
    }
  }

  async getPlayerGameMove(sessionId: bigint, player: Address): Promise<RPSGameMove> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.ROCK_PAPER_SCISSORS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'getPlayerGameMove',
        args: [sessionId, player],
      }) as any

      return {
        move: result.move,
        nonce: result.nonce,
        revealed: result.revealed,
      }
    } catch (error) {
      throw new Error(`Failed to get player game move: ${error}`)
    }
  }

  async getMoveHash(player: Address, move: RPSMove, nonce: bigint): Promise<Hash> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.ROCK_PAPER_SCISSORS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'getMoveHash',
        args: [player, move, nonce],
      }) as Hash

      return result
    } catch (error) {
      throw new Error(`Failed to get move hash: ${error}`)
    }
  }

  async getRevealDeadline(sessionId: bigint): Promise<bigint> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.ROCK_PAPER_SCISSORS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'getRevealDeadline',
        args: [sessionId],
      }) as bigint

      return result
    } catch (error) {
      throw new Error(`Failed to get reveal deadline: ${error}`)
    }
  }

  async getRevealsCount(sessionId: bigint): Promise<bigint> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.ROCK_PAPER_SCISSORS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'getRevealsCount',
        args: [sessionId],
      }) as bigint

      return result
    } catch (error) {
      throw new Error(`Failed to get reveals count: ${error}`)
    }
  }

  async withdraw(): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    try {
      return await this.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.ROCK_PAPER_SCISSORS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'withdraw',
        args: [],
        account: this.walletClient.account!,
        chain: somniaNetwork,
      })
    } catch (error) {
      throw new Error(`Failed to withdraw: ${error}`)
    }
  }
}