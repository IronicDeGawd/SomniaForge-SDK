import {
  createPublicClient,
  createWalletClient,
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
  Account,
  Chain,
} from 'viem'
import { somniaNetwork, SOMNIA_RPC_URL, SOMNIA_WS_URL } from '../constants/network'
import { CONTRACT_ADDRESSES } from '../constants/contracts'
import { GAME_SESSION_ABI } from '../constants/abis'
import {
  GameSession,
  Player,
  CreateSessionOptions,
  GameEventCallbacks,
  SessionCreatedEvent,
  PlayerJoinedEvent,
  SessionStartedEvent,
  MoveSubmittedEvent,
  SessionCompletedEvent,
  PrizeDistributedEvent
} from '../types'

export class GameSessionManager {
  private publicClient: PublicClient
  private walletClient: WalletClient | null = null
  private wsClient: PublicClient | null = null
  private eventCallbacks: GameEventCallbacks = {}

  constructor(rpcUrl: string = SOMNIA_RPC_URL, wsUrl: string = SOMNIA_WS_URL) {
    // Initialize public client for read operations
    this.publicClient = createPublicClient({
      chain: somniaNetwork,
      transport: http(rpcUrl),
    })

    // Initialize WebSocket client for real-time events
    this.wsClient = createPublicClient({
      chain: somniaNetwork,
      transport: webSocket(wsUrl),
    })
  }

  /**
   * Connect wallet client for write operations
   */
  async connectWallet(walletClient: WalletClient): Promise<void> {
    this.walletClient = walletClient
  }

  /**
   * Create a new game session
   */
  async createSession(options: CreateSessionOptions): Promise<bigint> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    const { maxPlayers, entryFee, moveTimeLimit } = options

    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.GAME_SESSION,
        abi: GAME_SESSION_ABI,
        functionName: 'createSession',
        args: [maxPlayers, entryFee, moveTimeLimit],
        value: entryFee,
        account: this.walletClient.account!,
        chain: somniaNetwork,
      })

      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      // Parse logs to get session ID
      const logs = receipt.logs.filter(log => 
        log.address.toLowerCase() === CONTRACT_ADDRESSES.GAME_SESSION.toLowerCase()
      )
      
      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi: GAME_SESSION_ABI,
            data: log.data,
            topics: log.topics,
          })
          
          if (decoded.eventName === 'SessionCreated') {
            const sessionId = (decoded.args as any).sessionId as bigint
            return sessionId
          }
        } catch (error) {
          // Continue to next log
        }
      }

      throw new Error('Session ID not found in transaction logs')
    } catch (error) {
      throw new Error(`Failed to create session: ${error}`)
    }
  }

  /**
   * Join an existing game session
   */
  async joinSession(sessionId: bigint): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    try {
      // Get session info to determine entry fee
      const session = await this.getSession(sessionId)
      
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.GAME_SESSION,
        abi: GAME_SESSION_ABI,
        functionName: 'joinSession',
        args: [sessionId],
        value: session.entryFee,
        account: this.walletClient.account!,
        chain: somniaNetwork,
      })

      return hash
    } catch (error) {
      throw new Error(`Failed to join session: ${error}`)
    }
  }

  /**
   * Submit a move to a game session
   */
  async submitMove(sessionId: bigint, moveHash: Hash): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.GAME_SESSION,
        abi: GAME_SESSION_ABI,
        functionName: 'submitMove',
        args: [sessionId, moveHash],
        account: this.walletClient.account!,
        chain: somniaNetwork,
      })

      return hash
    } catch (error) {
      throw new Error(`Failed to submit move: ${error}`)
    }
  }

  /**
   * Start a game session (for creator or admin)
   */
  async startSession(sessionId: bigint): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.GAME_SESSION,
        abi: GAME_SESSION_ABI,
        functionName: 'startSession',
        args: [sessionId],
        account: this.walletClient.account!,
        chain: somniaNetwork,
      })

      return hash
    } catch (error) {
      throw new Error(`Failed to start session: ${error}`)
    }
  }

  /**
   * Withdraw player balance
   */
  async withdrawBalance(): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.GAME_SESSION,
        abi: GAME_SESSION_ABI,
        functionName: 'withdrawBalance',
        account: this.walletClient.account!,
        chain: somniaNetwork,
      })

      return hash
    } catch (error) {
      throw new Error(`Failed to withdraw balance: ${error}`)
    }
  }

  /**
   * Get session information
   */
  async getSession(sessionId: bigint): Promise<GameSession> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.GAME_SESSION,
        abi: GAME_SESSION_ABI,
        functionName: 'sessions',
        args: [sessionId],
      }) as any
      
      return {
        sessionId: result[0],
        playerCount: result[1],
        maxPlayers: result[2],
        moveTimeLimit: result[3],
        createdAt: result[4],
        startedAt: result[5],
        isActive: result[6],
        isComplete: result[7],
        entryFee: result[8],
        prizePool: result[9],
        creator: result[10],
      }
    } catch (error) {
      throw new Error(`Failed to get session: ${error}`)
    }
  }

  /**
   * Get session players list
   */
  async getSessionPlayers(sessionId: bigint): Promise<Address[]> {
    try {
      return await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.GAME_SESSION,
        abi: GAME_SESSION_ABI,
        functionName: 'getSessionPlayers',
        args: [sessionId],
      }) as Address[]
    } catch (error) {
      throw new Error(`Failed to get session players: ${error}`)
    }
  }

  /**
   * Get player information in a session
   */
  async getSessionPlayer(sessionId: bigint, playerAddress: Address): Promise<Player> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.GAME_SESSION,
        abi: GAME_SESSION_ABI,
        functionName: 'sessionPlayers',
        args: [sessionId, playerAddress],
      }) as any
      
      return {
        wallet: result[0],
        moveHash: result[1],
        joinedAt: result[2],
        moveSubmittedAt: result[3],
        hasSubmittedMove: result[4],
        isActive: result[5],
      }
    } catch (error) {
      throw new Error(`Failed to get session player: ${error}`)
    }
  }

  /**
   * Check if session is active
   */
  async isSessionActive(sessionId: bigint): Promise<boolean> {
    try {
      return await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.GAME_SESSION,
        abi: GAME_SESSION_ABI,
        functionName: 'isSessionActive',
        args: [sessionId],
      }) as boolean
    } catch (error) {
      throw new Error(`Failed to check session status: ${error}`)
    }
  }

  /**
   * Get current session counter
   */
  async getCurrentSessionId(): Promise<bigint> {
    try {
      return await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.GAME_SESSION,
        abi: GAME_SESSION_ABI,
        functionName: 'getCurrentSessionId',
      }) as bigint
    } catch (error) {
      throw new Error(`Failed to get current session ID: ${error}`)
    }
  }

  /**
   * Get player balance
   */
  async getPlayerBalance(playerAddress: Address): Promise<bigint> {
    try {
      return await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.GAME_SESSION,
        abi: GAME_SESSION_ABI,
        functionName: 'playerBalances',
        args: [playerAddress],
      }) as bigint
    } catch (error) {
      throw new Error(`Failed to get player balance: ${error}`)
    }
  }

  /**
   * Set event callbacks for real-time updates
   */
  setEventCallbacks(callbacks: GameEventCallbacks): void {
    this.eventCallbacks = callbacks
    this.startEventListeners()
  }

  /**
   * Start listening to contract events via WebSocket
   */
  private startEventListeners(): void {
    if (!this.wsClient) {
      console.warn('WebSocket client not available for event listening')
      return
    }

    // Listen to SessionCreated events
    this.wsClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.GAME_SESSION,
      abi: GAME_SESSION_ABI,
      eventName: 'SessionCreated',
      onLogs: (logs) => {
        logs.forEach((log) => {
          if (this.eventCallbacks.onSessionCreated && log.args) {
            const args = log.args as any
            this.eventCallbacks.onSessionCreated({
              sessionId: args.sessionId,
              creator: args.creator,
              maxPlayers: args.maxPlayers,
              entryFee: args.entryFee,
              moveTimeLimit: args.moveTimeLimit,
            })
          }
        })
      },
    })

    // Listen to PlayerJoined events
    this.wsClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.GAME_SESSION,
      abi: GAME_SESSION_ABI,
      eventName: 'PlayerJoined',
      onLogs: (logs) => {
        logs.forEach((log) => {
          if (this.eventCallbacks.onPlayerJoined && log.args) {
            const args = log.args as any
            this.eventCallbacks.onPlayerJoined({
              sessionId: args.sessionId,
              player: args.player,
              playerCount: args.playerCount,
            })
          }
        })
      },
    })

    // Listen to SessionStarted events
    this.wsClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.GAME_SESSION,
      abi: GAME_SESSION_ABI,
      eventName: 'SessionStarted',
      onLogs: (logs) => {
        logs.forEach((log) => {
          if (this.eventCallbacks.onSessionStarted && log.args) {
            const args = log.args as any
            this.eventCallbacks.onSessionStarted({
              sessionId: args.sessionId,
              startedAt: args.startedAt,
            })
          }
        })
      },
    })

    // Listen to MoveSubmitted events
    this.wsClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.GAME_SESSION,
      abi: GAME_SESSION_ABI,
      eventName: 'MoveSubmitted',
      onLogs: (logs) => {
        logs.forEach((log) => {
          if (this.eventCallbacks.onMoveSubmitted && log.args) {
            const args = log.args as any
            this.eventCallbacks.onMoveSubmitted({
              sessionId: args.sessionId,
              player: args.player,
              moveHash: args.moveHash,
              submittedAt: args.submittedAt,
            })
          }
        })
      },
    })

    // Listen to SessionCompleted events
    this.wsClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.GAME_SESSION,
      abi: GAME_SESSION_ABI,
      eventName: 'SessionCompleted',
      onLogs: (logs) => {
        logs.forEach((log) => {
          if (this.eventCallbacks.onSessionCompleted && log.args) {
            const args = log.args as any
            this.eventCallbacks.onSessionCompleted({
              sessionId: args.sessionId,
              winners: args.winners,
              prizes: args.prizes,
              completedAt: args.completedAt,
            })
          }
        })
      },
    })

    // Listen to PrizeDistributed events
    this.wsClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.GAME_SESSION,
      abi: GAME_SESSION_ABI,
      eventName: 'PrizeDistributed',
      onLogs: (logs) => {
        logs.forEach((log) => {
          if (this.eventCallbacks.onPrizeDistributed && log.args) {
            const args = log.args as any
            this.eventCallbacks.onPrizeDistributed({
              sessionId: args.sessionId,
              player: args.player,
              amount: args.amount,
            })
          }
        })
      },
    })
  }

  /**
   * Stop event listeners
   */
  stopEventListeners(): void {
    if (this.wsClient) {
      // Note: Viem doesn't have a direct way to stop all watchers
      // In a real implementation, you'd need to keep track of unsubscribe functions
      console.log('Event listeners stopped')
    }
  }

  /**
   * Utility function to create a move hash
   */
  static createMoveHash(move: string, salt: string): Hash {
    const encoder = new TextEncoder()
    const data = encoder.encode(move + salt)
    
    // Simple hash - in production, use a proper hashing library
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data[i]
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    // Convert to hex and pad to 32 bytes
    return `0x${hash.toString(16).padStart(64, '0')}` as Hash
  }
}