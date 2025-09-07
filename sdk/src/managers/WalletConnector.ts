import {
  createWalletClient,
  custom,
  WalletClient,
  Account,
  Address,
  Chain,
  getAddress,
} from 'viem'
import { somniaNetwork, SOMNIA_CHAIN_ID } from '../constants/network'

export interface WalletConnectorOptions {
  autoSwitchNetwork?: boolean
  onAccountChanged?: (account: Address | null) => void
  onChainChanged?: (chainId: number) => void
  onDisconnect?: () => void
}

export class WalletConnector {
  private walletClient: WalletClient | null = null
  private options: WalletConnectorOptions
  private currentAccount: Address | null = null
  private currentChainId: number | null = null

  constructor(options: WalletConnectorOptions = {}) {
    this.options = {
      autoSwitchNetwork: true,
      ...options,
    }
  }

  /**
   * Connect to wallet (MetaMask, WalletConnect, etc.)
   */
  async connect(): Promise<{ account: Address; chainId: number }> {
    if (typeof window === 'undefined') {
      throw new Error('Wallet connection is only available in browser environment')
    }

    if (!(window as any).ethereum) {
      throw new Error('No wallet detected. Please install MetaMask or another Ethereum wallet.')
    }

    try {
      // Request account access
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const account = getAddress(accounts[0])
      this.currentAccount = account

      // Get current chain ID
      const chainId = await (window as any).ethereum.request({
        method: 'eth_chainId',
      })
      this.currentChainId = parseInt(chainId, 16)

      // Create wallet client
      this.walletClient = createWalletClient({
        account,
        chain: somniaNetwork,
        transport: custom((window as any).ethereum),
      })

      // Auto-switch to Somnia network if needed
      if (this.options.autoSwitchNetwork && this.currentChainId !== SOMNIA_CHAIN_ID) {
        await this.switchToSomniaNetwork()
      }

      // Set up event listeners
      this.setupEventListeners()

      return {
        account: this.currentAccount,
        chainId: this.currentChainId,
      }
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error}`)
    }
  }

  /**
   * Switch to Somnia Network
   */
  async switchToSomniaNetwork(): Promise<void> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('Wallet not available')
    }

    try {
      // Try to switch to Somnia network
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SOMNIA_CHAIN_ID.toString(16)}` }],
      })

      this.currentChainId = SOMNIA_CHAIN_ID
    } catch (switchError: any) {
      // If the network is not added to the wallet, add it
      if (switchError.code === 4902) {
        await this.addSomniaNetwork()
      } else {
        throw new Error(`Failed to switch to Somnia network: ${switchError.message}`)
      }
    }
  }

  /**
   * Add Somnia Network to wallet
   */
  async addSomniaNetwork(): Promise<void> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('Wallet not available')
    }

    try {
      await (window as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${SOMNIA_CHAIN_ID.toString(16)}`,
            chainName: somniaNetwork.name,
            nativeCurrency: somniaNetwork.nativeCurrency,
            rpcUrls: [somniaNetwork.rpcUrls.default.http[0]],
            blockExplorerUrls: [somniaNetwork.blockExplorers.default.url],
          },
        ],
      })

      this.currentChainId = SOMNIA_CHAIN_ID
    } catch (error) {
      throw new Error(`Failed to add Somnia network: ${error}`)
    }
  }

  /**
   * Set up wallet event listeners
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return
    }

    const ethereum = (window as any).ethereum

    // Account changed
    ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect()
      } else {
        const newAccount = getAddress(accounts[0])
        this.currentAccount = newAccount
        
        // Update wallet client with new account
        if (this.walletClient) {
          this.walletClient = createWalletClient({
            account: newAccount,
            chain: somniaNetwork,
            transport: custom(ethereum),
          })
        }

        this.options.onAccountChanged?.(newAccount)
      }
    })

    // Chain changed
    ethereum.on('chainChanged', (chainId: string) => {
      const newChainId = parseInt(chainId, 16)
      this.currentChainId = newChainId
      this.options.onChainChanged?.(newChainId)

      // Auto-switch back to Somnia if enabled and not on Somnia
      if (this.options.autoSwitchNetwork && newChainId !== SOMNIA_CHAIN_ID) {
        setTimeout(() => {
          this.switchToSomniaNetwork().catch(console.error)
        }, 1000) // Small delay to avoid conflicts
      }
    })

    // Disconnect
    ethereum.on('disconnect', () => {
      this.disconnect()
    })
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.walletClient = null
    this.currentAccount = null
    this.currentChainId = null
    this.options.onDisconnect?.()
  }

  /**
   * Get wallet client
   */
  getWalletClient(): WalletClient | null {
    return this.walletClient
  }

  /**
   * Get current account
   */
  getCurrentAccount(): Address | null {
    return this.currentAccount
  }

  /**
   * Get current chain ID
   */
  getCurrentChainId(): number | null {
    return this.currentChainId
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.walletClient !== null && this.currentAccount !== null
  }

  /**
   * Check if on Somnia network
   */
  isOnSomniaNetwork(): boolean {
    return this.currentChainId === SOMNIA_CHAIN_ID
  }

  /**
   * Sign message
   */
  async signMessage(message: string): Promise<`0x${string}`> {
    if (!this.walletClient || !this.currentAccount) {
      throw new Error('Wallet not connected')
    }

    try {
      const signature = await this.walletClient.signMessage({
        account: this.currentAccount,
        message,
      })

      return signature
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`)
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<bigint> {
    if (!this.currentAccount) {
      throw new Error('Wallet not connected')
    }

    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('Wallet not available')
      }

      const balance = await (window as any).ethereum.request({
        method: 'eth_getBalance',
        params: [this.currentAccount, 'latest'],
      })

      return BigInt(balance)
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`)
    }
  }

  /**
   * Request permissions (for advanced wallet features)
   */
  async requestPermissions(): Promise<any> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('Wallet not available')
    }

    try {
      const permissions = await (window as any).ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      })

      return permissions
    } catch (error) {
      throw new Error(`Failed to request permissions: ${error}`)
    }
  }

  /**
   * Check if wallet is installed
   */
  static isWalletAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ethereum
  }

  /**
   * Get installed wallets
   */
  static getAvailableWallets(): string[] {
    if (typeof window === 'undefined') {
      return []
    }

    const wallets: string[] = []
    
    if ((window as any).ethereum) {
      if ((window as any).ethereum.isMetaMask) {
        wallets.push('MetaMask')
      }
      if ((window as any).ethereum.isCoinbaseWallet) {
        wallets.push('Coinbase Wallet')
      }
      if ((window as any).ethereum.isRabby) {
        wallets.push('Rabby')
      }
      if ((window as any).ethereum.isTrust) {
        wallets.push('Trust Wallet')
      }
      
      // Generic wallet if none of the above
      if (wallets.length === 0) {
        wallets.push('Ethereum Wallet')
      }
    }

    return wallets
  }
}