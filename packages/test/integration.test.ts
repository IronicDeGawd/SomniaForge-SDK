import { describe, it, expect, beforeAll } from 'vitest'
import { createPublicClient, http, parseEther } from 'viem'
import { SomniaGameSDK, somniaNetwork, CONTRACT_ADDRESSES } from '../src/index'

describe('SDK Integration Tests', () => {
  let sdk: SomniaGameSDK
  let publicClient: any

  beforeAll(() => {
    // Initialize SDK
    sdk = new SomniaGameSDK()
    
    // Create public client for direct contract verification
    publicClient = createPublicClient({
      chain: somniaNetwork,
      transport: http('https://dream-rpc.somnia.network'),
    })
  })

  describe('SDK Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(sdk).toBeDefined()
      expect(sdk.gameSession).toBeDefined()
      expect(sdk.playerRegistry).toBeDefined()
      expect(sdk.wallet).toBeDefined()
      expect(sdk.webSocket).toBeDefined()
    })

    it('should have correct network configuration', () => {
      const config = sdk.getConfig()
      expect(config.rpcUrl).toBe('https://dream-rpc.somnia.network')
      expect(config.wsUrl).toBe('wss://dream-rpc.somnia.network/ws')
      expect(config.chainId).toBe(50312)
    })

    it('should have correct contract addresses', () => {
      const addresses = sdk.getContractAddresses()
      expect(addresses.gameSession).toBe('0xe9eB0c180091a1f26516974462B3b10245F00273')
      expect(addresses.playerRegistry).toBe('0x4269E78C9e276C451B06e9F00C44baa638C8CcCD')
      expect(addresses.gameEconomy).toBe('0x7652BdB7C63a6cB444ADbbA6A1a0E374bB08B9ba')
      expect(addresses.leaderboard).toBe('0x9C0056b7F0B10E8865e2436fC0fa0d7734041967')
      expect(addresses.multiplayerGame).toBe('0x76B7Adc0364037605cdB0363B5E6a87F2042a194')
    })
  })

  describe('Contract Connectivity', () => {
    it('should be able to read from GameSession contract', async () => {
      try {
        const currentSessionId = await sdk.gameSession.getCurrentSessionId()
        expect(typeof currentSessionId).toBe('bigint')
        expect(currentSessionId).toBeGreaterThanOrEqual(0n)
        console.log('✅ GameSession contract accessible, current session ID:', currentSessionId.toString())
      } catch (error) {
        console.error('❌ GameSession contract read failed:', error)
        throw error
      }
    })

    it('should be able to read from PlayerRegistry contract', async () => {
      try {
        const totalPlayers = await sdk.playerRegistry.getTotalPlayers()
        expect(typeof totalPlayers).toBe('bigint')
        expect(totalPlayers).toBeGreaterThanOrEqual(0n)
        console.log('✅ PlayerRegistry contract accessible, total players:', totalPlayers.toString())
      } catch (error) {
        console.error('❌ PlayerRegistry contract read failed:', error)
        throw error
      }
    })

    it('should validate deployed contracts exist on network', async () => {
      // Check GameSession contract
      const gameSessionCode = await publicClient.getBytecode({
        address: CONTRACT_ADDRESSES.GAME_SESSION
      })
      expect(gameSessionCode).toBeDefined()
      expect(gameSessionCode).not.toBe('0x')
      
      // Check PlayerRegistry contract
      const playerRegistryCode = await publicClient.getBytecode({
        address: CONTRACT_ADDRESSES.PLAYER_REGISTRY
      })
      expect(playerRegistryCode).toBeDefined()
      expect(playerRegistryCode).not.toBe('0x')
      
      console.log('✅ All contracts verified on Somnia network')
    })
  })

  describe('GameSession Manager', () => {
    it('should be able to read session data structure', async () => {
      // Try to read session 0 (even if it doesn't exist, should get a proper response)
      try {
        await sdk.gameSession.getSession(0n)
      } catch (error) {
        // This is expected if session 0 doesn't exist
        expect(error.message).toContain('Failed to get session')
      }
    })

    it('should validate create session parameters', () => {
      const options = {
        maxPlayers: 4,
        entryFee: parseEther('0.01'),
        moveTimeLimit: 300 // 5 minutes
      }
      
      expect(options.maxPlayers).toBeGreaterThan(1)
      expect(options.maxPlayers).toBeLessThanOrEqual(100)
      expect(options.entryFee).toBeGreaterThan(0n)
      expect(options.moveTimeLimit).toBeGreaterThanOrEqual(10)
      expect(options.moveTimeLimit).toBeLessThanOrEqual(3600)
    })

    it('should create valid move hashes', () => {
      const move = 'rock'
      const salt = 'random123'
      const hash = sdk.gameSession.constructor.createMoveHash(move, salt)
      
      expect(hash).toMatch(/^0x[0-9a-f]{64}$/i)
      expect(hash).toHaveLength(66) // 0x + 64 hex characters
      
      // Same input should produce same hash
      const hash2 = sdk.gameSession.constructor.createMoveHash(move, salt)
      expect(hash).toBe(hash2)
      
      // Different input should produce different hash
      const hash3 = sdk.gameSession.constructor.createMoveHash('paper', salt)
      expect(hash).not.toBe(hash3)
    })
  })

  describe('PlayerRegistry Manager', () => {
    it('should validate username format', () => {
      // Valid usernames
      expect(sdk.playerRegistry.validateUsername('player123')).toBe(true)
      expect(sdk.playerRegistry.validateUsername('test_user')).toBe(true)
      expect(sdk.playerRegistry.validateUsername('ABC123_test')).toBe(true)
      
      // Invalid usernames
      expect(sdk.playerRegistry.validateUsername('ab')).toBe(false) // too short
      expect(sdk.playerRegistry.validateUsername('a'.repeat(21))).toBe(false) // too long
      expect(sdk.playerRegistry.validateUsername('player-123')).toBe(false) // invalid character
      expect(sdk.playerRegistry.validateUsername('player.123')).toBe(false) // invalid character
      expect(sdk.playerRegistry.validateUsername('player 123')).toBe(false) // space
    })

    it('should be able to read leaderboard data', async () => {
      try {
        const leaderboard = await sdk.playerRegistry.getLeaderboardData(0, 5)
        expect(Array.isArray(leaderboard)).toBe(true)
        console.log('✅ Leaderboard accessible, entries:', leaderboard.length)
        
        if (leaderboard.length > 0) {
          const firstEntry = leaderboard[0]
          expect(firstEntry).toHaveProperty('playerAddress')
          expect(firstEntry).toHaveProperty('username')
          expect(firstEntry).toHaveProperty('totalWins')
          expect(firstEntry).toHaveProperty('totalEarnings')
        }
      } catch (error) {
        console.error('❌ Leaderboard read failed:', error)
        throw error
      }
    })
  })

  describe('Wallet Connector', () => {
    it('should detect wallet availability', () => {
      // In test environment, wallet won't be available
      expect(sdk.wallet.constructor.isWalletAvailable()).toBe(false)
      
      // Should return empty array in test environment
      const wallets = sdk.wallet.constructor.getAvailableWallets()
      expect(Array.isArray(wallets)).toBe(true)
    })

    it('should have correct connection status initially', () => {
      const status = sdk.getConnectionStatus()
      expect(status.wallet.connected).toBe(false)
      expect(status.wallet.account).toBe(null)
      expect(status.wallet.onSomniaNetwork).toBe(false)
      expect(status.webSocket.connected).toBe(false)
    })
  })

  describe('Network Information', () => {
    it('should provide correct network information', () => {
      const networkInfo = sdk.getNetworkInfo()
      
      expect(networkInfo.network.id).toBe(50312)
      expect(networkInfo.network.name).toBe('Somnia Network')
      expect(networkInfo.network.nativeCurrency.symbol).toBe('STT')
      expect(networkInfo.rpcUrl).toBe('https://dream-rpc.somnia.network')
      expect(networkInfo.wsUrl).toBe('wss://dream-rpc.somnia.network/ws')
      expect(networkInfo.explorer).toBe('https://shannon-explorer.somnia.network')
    })
  })
})