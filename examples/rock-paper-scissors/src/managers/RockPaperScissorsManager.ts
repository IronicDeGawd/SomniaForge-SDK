import {
  createPublicClient,
  http,
  keccak256,
  encodePacked,
  parseEther,
  decodeEventLog
} from 'viem'
import type { Address, Hash, WalletClient, PublicClient } from 'viem'
import { somniaNetwork, SOMNIA_RPC_URL } from '@somniaforge/sdk'
import { ROCK_PAPER_SCISSORS_ABI, ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS } from '../constants/rockPaperScissorsAbi'
import { RPSMove } from '../types/rockPaperScissors'
import type { RPSGameResult, RPSGameMove } from '../types/rockPaperScissors'

export class RockPaperScissorsManager {
  private publicClient: PublicClient
  private walletClient: WalletClient | null = null

  constructor(rpcUrl: string = SOMNIA_RPC_URL) {
    this.publicClient = createPublicClient({
      chain: somniaNetwork,
      transport: http(rpcUrl),
    })
  }

  async connectWallet(walletClient: WalletClient): Promise<void> {
    this.walletClient = walletClient
  }

  static createMoveHash(player: Address, move: RPSMove, nonce: bigint): Hash {
    return keccak256(
      encodePacked(
        ['address', 'uint256', 'uint256'],
        [player, BigInt(move), nonce]
      )
    )
  }

  async createRPSGame(entryFee: bigint = parseEther('0.01')): Promise<bigint> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    const hash = await this.walletClient.writeContract({
      address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
      abi: ROCK_PAPER_SCISSORS_ABI,
      functionName: 'createRPSGame',
      args: [entryFee],
      value: entryFee,
      chain: somniaNetwork,
      account: this.walletClient.account!,
    })

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
    
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: ROCK_PAPER_SCISSORS_ABI,
          data: log.data,
          topics: log.topics,
        })
        
        if (decoded.eventName === 'SessionCreated') {
          return (decoded.args as { sessionId: bigint }).sessionId
        }
      } catch {
        continue
      }
    }

    throw new Error('Session ID not found in transaction logs')
  }

  async joinRPSGame(sessionId: bigint, entryFee: bigint = parseEther('0.01')): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    return await this.walletClient.writeContract({
      address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
      abi: ROCK_PAPER_SCISSORS_ABI,
      functionName: 'joinRPSGame',
      args: [sessionId],
      value: entryFee,
      chain: somniaNetwork,
      account: this.walletClient.account!,
    })
  }

  async commitMove(sessionId: bigint, moveHash: Hash): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    try {
      return await this.walletClient.writeContract({
        address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'commitMove',
        args: [sessionId, moveHash],
        chain: somniaNetwork,
        account: this.walletClient.account!,
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
        address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'revealMove',
        args: [sessionId, move, nonce],
        chain: somniaNetwork,
        account: this.walletClient.account!,
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
        address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'forceResolveGame',
        args: [sessionId],
        chain: somniaNetwork,
        account: this.walletClient.account!,
      })
    } catch (error) {
      throw new Error(`Failed to force resolve game: ${error}`)
    }
  }

  async getGameResult(sessionId: bigint): Promise<RPSGameResult> {
    try {
      const result = await this.publicClient.readContract({
        address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'getGameResult',
        args: [sessionId],
      }) as {
        winner: Address
        players: Address[]
        moves: RPSMove[]
        prizeAmount: bigint
        isDraw: boolean
        completedAt: bigint
      }

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
        address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'getPlayerGameMove',
        args: [sessionId, player],
      }) as {
        move: RPSMove
        nonce: bigint
        revealed: boolean
      }

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
        address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
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
        address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
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
        address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'getRevealsCount',
        args: [sessionId],
      }) as bigint

      return result
    } catch (error) {
      throw new Error(`Failed to get reveals count: ${error}`)
    }
  }

  async isSessionActive(sessionId: bigint): Promise<boolean> {
    try {
      const result = await this.publicClient.readContract({
        address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'isSessionActive',
        args: [sessionId],
      }) as boolean

      return result
    } catch (error) {
      throw new Error(`Failed to check session status: ${error}`)
    }
  }

  async getSessionData(sessionId: bigint): Promise<unknown> {
    try {
      const result = await this.publicClient.readContract({
        address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'sessions',
        args: [sessionId],
      })

      return result
    } catch (error) {
      throw new Error(`Failed to get session data: ${error}`)
    }
  }

  async withdrawToWallet(): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    return await this.walletClient.writeContract({
      address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
      abi: ROCK_PAPER_SCISSORS_ABI,
      functionName: 'withdraw',
      args: [],
      chain: somniaNetwork,
      account: this.walletClient.account!,
    })
  }

  async getUserBalance(userAddress: Address): Promise<bigint> {
    try {
      const balance = await this.publicClient.readContract({
        address: ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
        abi: ROCK_PAPER_SCISSORS_ABI,
        functionName: 'playerBalances',
        args: [userAddress],
      }) as bigint

      return balance
    } catch (error) {
      throw new Error(`Failed to get user balance: ${error}`)
    }
  }
}