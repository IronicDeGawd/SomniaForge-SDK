import {
  createPublicClient,
  webSocket,
  decodeEventLog,
  Address,
  Hash,
  Log,
} from 'viem'
import { somniaNetwork, SOMNIA_WS_URL } from '../constants/network'
import { CONTRACT_ADDRESSES } from '../constants/contracts'
import { GAME_SESSION_ABI } from '../constants/abis'

export interface WebSocketEventFilter {
  contractAddress?: Address
  sessionId?: bigint
  playerAddress?: Address
  eventNames?: string[]
  abi?: any[]
}

export interface WebSocketEventCallback {
  (event: {
    eventName: string
    args: Record<string, any>
    transactionHash: Hash
    blockNumber: bigint
    logIndex: number
    removed: boolean
  }): void
}

export interface ReconnectOptions {
  maxRetries: number
  retryDelay: number // milliseconds
  backoffMultiplier: number
}

export class WebSocketManager {
  private wsClient: ReturnType<typeof createPublicClient> | null = null
  private wsUrl: string
  private isConnected: boolean = false
  private reconnectOptions: ReconnectOptions
  private reconnectAttempts: number = 0
  private reconnectTimeout: NodeJS.Timeout | null = null
  private eventCallbacks: Map<string, WebSocketEventCallback> = new Map()
  private activeWatchers: Map<string, () => void> = new Map()

  constructor(
    wsUrl: string = SOMNIA_WS_URL,
    reconnectOptions: ReconnectOptions = {
      maxRetries: 5,
      retryDelay: 1000,
      backoffMultiplier: 2,
    }
  ) {
    this.wsUrl = wsUrl
    this.reconnectOptions = reconnectOptions
  }

  /**
   * Connect to WebSocket
   */
  async connect(): Promise<void> {
    try {
      this.wsClient = createPublicClient({
        chain: somniaNetwork,
        transport: webSocket(this.wsUrl, {
          reconnect: {
            attempts: this.reconnectOptions.maxRetries,
            delay: this.reconnectOptions.retryDelay,
          },
        }),
      })

      this.isConnected = true
      this.reconnectAttempts = 0
      
      console.log('WebSocket connected to Somnia Network')
      
      // Set up connection monitoring
      this.setupConnectionMonitoring()
      
    } catch (error) {
      this.isConnected = false
      throw new Error(`Failed to connect to WebSocket: ${error}`)
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    // Stop all watchers
    for (const [id, unwatch] of this.activeWatchers) {
      try {
        unwatch()
      } catch (error) {
        console.warn(`Error stopping watcher ${id}:`, error)
      }
    }
    this.activeWatchers.clear()

    this.wsClient = null
    this.isConnected = false
    this.reconnectAttempts = 0
    
    console.log('WebSocket disconnected')
  }

  /**
   * Check if connected
   */
  isWebSocketConnected(): boolean {
    return this.isConnected && this.wsClient !== null
  }

  /**
   * Subscribe to GameSession events
   */
  async subscribeToGameSessionEvents(
    filter: WebSocketEventFilter = {},
    callback: WebSocketEventCallback
  ): Promise<string> {
    if (!this.isWebSocketConnected()) {
      throw new Error('WebSocket not connected')
    }

    const callbackId = `gamesession_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.eventCallbacks.set(callbackId, callback)

    try {
      // Subscribe to contract events (use specified address or default to GameSession)
      const contractAddress = filter.contractAddress || CONTRACT_ADDRESSES.GAME_SESSION
      const contractAbi = filter.abi || GAME_SESSION_ABI
      
      const unwatch = this.wsClient!.watchContractEvent({
        address: contractAddress,
        abi: contractAbi,
        onLogs: (logs) => {
          logs.forEach((log) => {
            try {
              const decoded = decodeEventLog({
                abi: contractAbi,
                data: log.data,
                topics: log.topics,
              })

              // Apply filters
              if (this.shouldProcessEvent(decoded, log, filter)) {
                callback({
                  eventName: (decoded as any).eventName,
                  args: (decoded as any).args || {},
                  transactionHash: log.transactionHash,
                  blockNumber: log.blockNumber!,
                  logIndex: log.logIndex!,
                  removed: log.removed!,
                })
              }
            } catch (error) {
              console.warn('Error decoding log:', error)
            }
          })
        },
        onError: (error) => {
          console.error('WebSocket event error:', error)
          this.handleConnectionError()
        },
      })

      this.activeWatchers.set(callbackId, unwatch)
      return callbackId
    } catch (error) {
      this.eventCallbacks.delete(callbackId)
      throw new Error(`Failed to subscribe to events: ${error}`)
    }
  }

  /**
   * Subscribe to specific session events
   */
  async subscribeToSessionEvents(
    sessionId: bigint,
    callback: WebSocketEventCallback
  ): Promise<string> {
    return this.subscribeToGameSessionEvents(
      { sessionId },
      callback
    )
  }

  /**
   * Subscribe to player-specific events
   */
  async subscribeToPlayerEvents(
    playerAddress: Address,
    callback: WebSocketEventCallback
  ): Promise<string> {
    return this.subscribeToGameSessionEvents(
      { playerAddress },
      callback
    )
  }

  /**
   * Subscribe to RockPaperScissors contract events
   */
  async subscribeToRockPaperScissorsEvents(
    contractAddress: Address,
    contractAbi: any[],
    filter: WebSocketEventFilter = {},
    callback: WebSocketEventCallback
  ): Promise<string> {
    if (!this.isWebSocketConnected()) {
      throw new Error('WebSocket not connected')
    }

    const callbackId = `rps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.eventCallbacks.set(callbackId, callback)

    try {
      const unwatch = this.wsClient!.watchContractEvent({
        address: contractAddress,
        abi: contractAbi,
        onLogs: (logs) => {
          logs.forEach((log) => {
            try {
              const decoded = decodeEventLog({
                abi: contractAbi,
                data: log.data,
                topics: log.topics,
              })

              // Apply filters
              if (this.shouldProcessEvent(decoded as any, log, filter)) {
                callback({
                  eventName: (decoded as any).eventName,
                  args: (decoded as any).args || {},
                  transactionHash: log.transactionHash,
                  blockNumber: log.blockNumber!,
                  logIndex: log.logIndex!,
                  removed: log.removed!,
                })
              }
            } catch (error) {
              console.warn('Error decoding RPS log:', error)
            }
          })
        },
        onError: (error) => {
          console.error('WebSocket RPS event error:', error)
          this.handleConnectionError()
        },
      })

      this.activeWatchers.set(callbackId, unwatch)
      return callbackId
    } catch (error) {
      this.eventCallbacks.delete(callbackId)
      throw new Error(`Failed to subscribe to RPS events: ${error}`)
    }
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    const unwatch = this.activeWatchers.get(subscriptionId)
    if (unwatch) {
      try {
        unwatch()
        this.activeWatchers.delete(subscriptionId)
        this.eventCallbacks.delete(subscriptionId)
        console.log(`Unsubscribed from ${subscriptionId}`)
      } catch (error) {
        console.warn(`Error unsubscribing from ${subscriptionId}:`, error)
      }
    }
  }

  /**
   * Get latest block number
   */
  async getLatestBlockNumber(): Promise<bigint> {
    if (!this.isWebSocketConnected()) {
      throw new Error('WebSocket not connected')
    }

    try {
      return await this.wsClient!.getBlockNumber()
    } catch (error) {
      throw new Error(`Failed to get latest block: ${error}`)
    }
  }

  /**
   * Watch for new blocks
   */
  async watchBlocks(callback: (blockNumber: bigint) => void): Promise<string> {
    if (!this.isWebSocketConnected()) {
      throw new Error('WebSocket not connected')
    }

    const callbackId = `blocks_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const unwatch = this.wsClient!.watchBlockNumber({
        onBlockNumber: callback,
        onError: (error) => {
          console.error('Block watching error:', error)
          this.handleConnectionError()
        },
      })

      this.activeWatchers.set(callbackId, unwatch)
      return callbackId
    } catch (error) {
      throw new Error(`Failed to watch blocks: ${error}`)
    }
  }

  /**
   * Get transaction receipt with real-time updates
   */
  async waitForTransaction(
    hash: Hash,
    callback?: (receipt: any) => void
  ): Promise<any> {
    if (!this.isWebSocketConnected()) {
      throw new Error('WebSocket not connected')
    }

    try {
      const receipt = await this.wsClient!.waitForTransactionReceipt({
        hash,
        onReplaced: (replacement) => {
          console.log('Transaction replaced:', replacement)
        },
      })

      callback?.(receipt)
      return receipt
    } catch (error) {
      throw new Error(`Failed to wait for transaction: ${error}`)
    }
  }

  /**
   * Handle connection errors and reconnection
   */
  private handleConnectionError(): void {
    if (!this.isConnected) return

    this.isConnected = false
    console.log('WebSocket connection lost, attempting to reconnect...')

    if (this.reconnectAttempts >= this.reconnectOptions.maxRetries) {
      console.error('Max reconnection attempts reached')
      return
    }

    const delay = this.reconnectOptions.retryDelay * 
      Math.pow(this.reconnectOptions.backoffMultiplier, this.reconnectAttempts)

    this.reconnectTimeout = setTimeout(async () => {
      try {
        this.reconnectAttempts++
        await this.connect()
        console.log('WebSocket reconnected successfully')
        
        // Resubscribe to all events
        await this.resubscribeToEvents()
      } catch (error) {
        console.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error)
        this.handleConnectionError() // Try again
      }
    }, delay)
  }

  /**
   * Setup connection monitoring
   */
  private setupConnectionMonitoring(): void {
    // Ping the connection every 30 seconds
    const pingInterval = setInterval(async () => {
      if (!this.isConnected) {
        clearInterval(pingInterval)
        return
      }

      try {
        await this.getLatestBlockNumber()
      } catch (error) {
        console.warn('Connection health check failed:', error)
        this.handleConnectionError()
        clearInterval(pingInterval)
      }
    }, 30000)
  }

  /**
   * Resubscribe to all events after reconnection
   */
  private async resubscribeToEvents(): Promise<void> {
    // Store current watchers
    const currentWatchers = new Map(this.activeWatchers)
    this.activeWatchers.clear()

    // Resubscribe to all events
    for (const [id, callback] of this.eventCallbacks) {
      try {
        if (id.startsWith('gamesession_')) {
          await this.subscribeToGameSessionEvents({}, callback)
        } else if (id.startsWith('rps_')) {
          // For RPS subscriptions, we'd need to store more context
          // For now, just log that we couldn't resubscribe
          console.warn(`Cannot auto-resubscribe to RPS subscription ${id} - manual resubscription needed`)
        }
        // Add other subscription types as needed
      } catch (error) {
        console.error(`Failed to resubscribe to ${id}:`, error)
      }
    }
  }

  /**
   * Check if event should be processed based on filters
   */
  private shouldProcessEvent(
    decoded: any,
    log: Log,
    filter: WebSocketEventFilter
  ): boolean {
    // Check contract address filter
    if (filter.contractAddress && 
        log.address.toLowerCase() !== filter.contractAddress.toLowerCase()) {
      return false
    }

    // Check event name filter
    if (filter.eventNames && 
        filter.eventNames.length > 0 && 
        !filter.eventNames.includes(decoded.eventName)) {
      return false
    }

    // Check session ID filter
    if (filter.sessionId && decoded.args) {
      const sessionId = decoded.args.sessionId
      if (sessionId && sessionId !== filter.sessionId) {
        return false
      }
    }

    // Check player address filter
    if (filter.playerAddress && decoded.args) {
      const player = decoded.args.player || decoded.args.creator
      if (player && player.toLowerCase() !== filter.playerAddress.toLowerCase()) {
        return false
      }
    }

    return true
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    connected: boolean
    reconnectAttempts: number
    activeWatchers: number
    eventCallbacks: number
  } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      activeWatchers: this.activeWatchers.size,
      eventCallbacks: this.eventCallbacks.size,
    }
  }
}