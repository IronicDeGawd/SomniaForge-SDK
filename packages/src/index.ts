import { WalletClient } from 'viem'
import { GameSessionManager } from './managers/GameSessionManager'
import { PlayerRegistryManager } from './managers/PlayerRegistryManager'
import { WalletConnector } from './managers/WalletConnector'
import { WebSocketManager } from './managers/WebSocketManager'
import { somniaNetwork, SOMNIA_RPC_URL, SOMNIA_WS_URL } from './constants/network'
import { CONTRACT_ADDRESSES } from './constants/contracts'
import { SDKConfig } from './types'

export class SomniaGameSDK {
  public gameSession: GameSessionManager
  public playerRegistry: PlayerRegistryManager
  public wallet: WalletConnector
  public webSocket: WebSocketManager
  
  private config: SDKConfig

  constructor(config: SDKConfig = {}) {
    this.config = {
      rpcUrl: SOMNIA_RPC_URL,
      wsUrl: SOMNIA_WS_URL,
      chainId: 50312,
      contractAddresses: {
        gameSession: CONTRACT_ADDRESSES.GAME_SESSION,
        playerRegistry: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
        gameEconomy: CONTRACT_ADDRESSES.GAME_ECONOMY,
        leaderboard: CONTRACT_ADDRESSES.LEADERBOARD,
        multiplayerGame: CONTRACT_ADDRESSES.MULTIPLAYER_GAME,
      },
      ...config,
    }

    this.gameSession = new GameSessionManager(this.config.rpcUrl, this.config.wsUrl)
    this.playerRegistry = new PlayerRegistryManager(this.config.rpcUrl, this.config.wsUrl)
    this.wallet = new WalletConnector({
      autoSwitchNetwork: true,
      onAccountChanged: this.handleAccountChanged.bind(this),
      onChainChanged: this.handleChainChanged.bind(this),
      onDisconnect: this.handleDisconnect.bind(this),
    })
    this.webSocket = new WebSocketManager(this.config.wsUrl)
  }

  /**
   * Initialize the SDK using an already connected wallet provider
   */
  async initializeWithProvider(provider: any, account: string, chainId: number): Promise<{
    account: `0x${string}`
    chainId: number
    isConnected: boolean
  }> {
    try {
      const walletConnection = await this.wallet.connectWithProvider(provider, account, chainId)

      const walletClient = this.wallet.getWalletClient()
      if (walletClient) {
        await this.gameSession.connectWallet(walletClient)
        await this.playerRegistry.connectWallet(walletClient)
      }

      await this.webSocket.connect()

      return {
        account: walletConnection.account,
        chainId: walletConnection.chainId,
        isConnected: true,
      }
    } catch (error) {
      throw new Error(`Failed to initialize SDK with provider: ${error}`)
    }
  }

  /**
   * Initialize the SDK - connect wallet and WebSocket
   */
  async initialize(): Promise<{
    account: `0x${string}`
    chainId: number
    isConnected: boolean
  }> {
    try {
      const walletConnection = await this.wallet.connect()

      const walletClient = this.wallet.getWalletClient()
      if (walletClient) {
        await this.gameSession.connectWallet(walletClient)
        await this.playerRegistry.connectWallet(walletClient)
      }

      await this.webSocket.connect()

      return {
        account: walletConnection.account,
        chainId: walletConnection.chainId,
        isConnected: true,
      }
    } catch (error) {
      throw new Error(`Failed to initialize SDK: ${error}`)
    }
  }

  /**
   * Disconnect from wallet and WebSocket
   */
  disconnect(): void {
    this.wallet.disconnect()
    this.webSocket.disconnect()
    this.gameSession.stopEventListeners()
    this.playerRegistry.stopEventListeners()
  }

  /**
   * Check if SDK is fully initialized
   */
  isInitialized(): boolean {
    return (
      this.wallet.isConnected() &&
      this.wallet.isOnSomniaNetwork() &&
      this.webSocket.isWebSocketConnected()
    )
  }

  /**
   * Get SDK configuration
   */
  getConfig(): SDKConfig {
    return this.config
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return {
      network: somniaNetwork,
      rpcUrl: this.config.rpcUrl,
      wsUrl: this.config.wsUrl,
      chainId: this.config.chainId,
      explorer: somniaNetwork.blockExplorers.default.url,
    }
  }

  /**
   * Get contract addresses
   */
  getContractAddresses() {
    return this.config.contractAddresses || CONTRACT_ADDRESSES
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      wallet: {
        connected: this.wallet.isConnected(),
        account: this.wallet.getCurrentAccount(),
        chainId: this.wallet.getCurrentChainId(),
        onSomniaNetwork: this.wallet.isOnSomniaNetwork(),
      },
      webSocket: {
        connected: this.webSocket.isWebSocketConnected(),
        stats: this.webSocket.getConnectionStats(),
      },
    }
  }

  /**
   * Switch to Somnia network if not already on it
   */
  async ensureSomniaNetwork(): Promise<void> {
    if (!this.wallet.isOnSomniaNetwork()) {
      await this.wallet.switchToSomniaNetwork()
    }
  }

  /**
   * Handle account changed
   */
  private handleAccountChanged(account: `0x${string}` | null): void {
    if (account) {
      const walletClient = this.wallet.getWalletClient()
      if (walletClient) {
        this.gameSession.connectWallet(walletClient)
        this.playerRegistry.connectWallet(walletClient)
      }
    }
  }

  /**
   * Handle chain changed
   */
  private handleChainChanged(chainId: number): void {

  }

  /**
   * Handle wallet disconnect
   */
  private handleDisconnect(): void {

  }
}

export * from './types'
export * from './constants/network'
export * from './constants/contracts'
export * from './managers/GameSessionManager'
export * from './managers/PlayerRegistryManager'
export * from './managers/WalletConnector'
export * from './managers/WebSocketManager'

export {
  WalletConnectButton,
  GameCard,
  PlayerProfile,
  SomniaButton,
  GameStats,
  SomniaColors,
  SomniaTheme,
  css
} from './components'

export const somniaSDK = new SomniaGameSDK()
export { somniaNetwork, CONTRACT_ADDRESSES }