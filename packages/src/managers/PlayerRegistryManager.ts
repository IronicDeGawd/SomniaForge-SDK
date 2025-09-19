import {
  createPublicClient,
  createWalletClient,
  http,
  webSocket,
  Address,
  Hash,
  WalletClient,
  PublicClient,
} from 'viem'
import { somniaNetwork, SOMNIA_RPC_URL, SOMNIA_WS_URL } from '../constants/network'
import { CONTRACT_ADDRESSES } from '../constants/contracts'
import { PLAYER_REGISTRY_ABI } from '../constants/abis'
import {
  PlayerProfile,
  PlayerStats,
  Achievement,
  PlayerRegisteredEvent,
  StatsUpdatedEvent,
  AchievementUnlockedEvent,
  LevelUpEvent,
  LeaderboardEntry
} from '../types'

export interface PlayerEventCallbacks {
  onPlayerRegistered?: (event: PlayerRegisteredEvent) => void
  onStatsUpdated?: (event: StatsUpdatedEvent) => void
  onAchievementUnlocked?: (event: AchievementUnlockedEvent) => void
  onLevelUp?: (event: LevelUpEvent) => void
}

export class PlayerRegistryManager {
  private publicClient: PublicClient
  private walletClient: WalletClient | null = null
  private wsClient: PublicClient | null = null
  private eventCallbacks: PlayerEventCallbacks = {}

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
   * Register a new player with username
   */
  async registerPlayer(username: string): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected')
    }

    // Validate username
    if (!this.validateUsername(username)) {
      throw new Error('Invalid username. Must be 3-20 characters, alphanumeric and underscore only')
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
        abi: PLAYER_REGISTRY_ABI,
        functionName: 'registerPlayer',
        args: [username],
        account: this.walletClient.account!,
        chain: somniaNetwork,
      })

      return hash
    } catch (error) {
      throw new Error(`Failed to register player: ${error}`)
    }
  }

  /**
   * Get player profile
   */
  async getPlayerProfile(playerAddress: Address): Promise<PlayerProfile> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
        abi: PLAYER_REGISTRY_ABI,
        functionName: 'getPlayerProfile',
        args: [playerAddress],
      }) as any
      
      return {
        username: result.username,
        registrationTime: result.registrationTime,
        totalGames: result.totalGames,
        gamesWon: result.gamesWon,
        gamesLost: result.gamesLost,
        currentWinStreak: result.currentWinStreak,
        bestWinStreak: result.bestWinStreak,
        totalEarnings: result.totalEarnings,
        totalSpent: result.totalSpent,
        isActive: result.isActive,
        level: result.level,
        experience: result.experience,
      }
    } catch (error) {
      throw new Error(`Failed to get player profile: ${error}`)
    }
  }

  /**
   * Get player statistics
   */
  async getPlayerStats(playerAddress: Address): Promise<PlayerStats> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
        abi: PLAYER_REGISTRY_ABI,
        functionName: 'getPlayerStats',
        args: [playerAddress],
      }) as any
      
      return {
        fastestWin: result[0],
        averageGameTime: result[1],
        rockPaperScissorsWins: result[2],
        tournamentWins: result[3],
        achievementsUnlocked: result[4],
      }
    } catch (error) {
      throw new Error(`Failed to get player stats: ${error}`)
    }
  }

  /**
   * Get player username
   */
  async getUsername(playerAddress: Address): Promise<string> {
    try {
      return await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
        abi: PLAYER_REGISTRY_ABI,
        functionName: 'getUsername',
        args: [playerAddress],
      }) as string
    } catch (error) {
      throw new Error(`Failed to get username: ${error}`)
    }
  }

  /**
   * Check if player is registered
   */
  async isPlayerRegistered(playerAddress: Address): Promise<boolean> {
    try {
      return await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
        abi: PLAYER_REGISTRY_ABI,
        functionName: 'isRegistered',
        args: [playerAddress],
      }) as boolean
    } catch (error) {
      throw new Error(`Failed to check registration status: ${error}`)
    }
  }

  /**
   * Get player win rate (in basis points)
   */
  async getWinRate(playerAddress: Address): Promise<number> {
    try {
      const winRateBP = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
        abi: PLAYER_REGISTRY_ABI,
        functionName: 'getWinRate',
        args: [playerAddress],
      }) as bigint
      return Number(winRateBP)
    } catch (error) {
      throw new Error(`Failed to get win rate: ${error}`)
    }
  }

  /**
   * Get player win rate as percentage
   */
  async getWinRatePercentage(playerAddress: Address): Promise<number> {
    const winRateBP = await this.getWinRate(playerAddress)
    return winRateBP / 100 // Convert basis points to percentage
  }

  /**
   * Check if player has specific achievement
   */
  async hasAchievement(playerAddress: Address, achievementKey: string): Promise<boolean> {
    try {
      return await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
        abi: PLAYER_REGISTRY_ABI,
        functionName: 'hasAchievement',
        args: [playerAddress, achievementKey],
      }) as boolean
    } catch (error) {
      throw new Error(`Failed to check achievement: ${error}`)
    }
  }

  /**
   * Get achievement details
   */
  async getAchievement(achievementKey: string): Promise<Achievement> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
        abi: PLAYER_REGISTRY_ABI,
        functionName: 'achievements',
        args: [achievementKey],
      }) as any
      
      return {
        name: result[0],
        description: result[1],
        reward: result[2],
        isActive: result[3],
      }
    } catch (error) {
      throw new Error(`Failed to get achievement: ${error}`)
    }
  }

  /**
   * Get all available achievements
   */
  async getAllAchievements(): Promise<{ key: string; achievement: Achievement }[]> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
        abi: PLAYER_REGISTRY_ABI,
        functionName: 'getAllAchievements',
      }) as any
      
      const keys = result[0]
      const names = result[1]
      const descriptions = result[2]
      
      const achievements: { key: string; achievement: Achievement }[] = []
      
      for (let i = 0; i < keys.length; i++) {
        const achievement = await this.getAchievement(keys[i])
        achievements.push({ key: keys[i], achievement })
      }
      
      return achievements
    } catch (error) {
      throw new Error(`Failed to get all achievements: ${error}`)
    }
  }

  /**
   * Get leaderboard data with pagination
   */
  async getLeaderboardData(offset: number = 0, limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      const result = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
        abi: PLAYER_REGISTRY_ABI,
        functionName: 'getLeaderboardData',
        args: [BigInt(offset), BigInt(limit)],
      }) as any
      
      const playerAddresses = result[0]
      const usernames = result[1]
      const totalWins = result[2]
      const totalEarnings = result[3]
      
      const leaderboard: LeaderboardEntry[] = []
      
      for (let i = 0; i < playerAddresses.length; i++) {
        leaderboard.push({
          playerAddress: playerAddresses[i],
          username: usernames[i],
          totalWins: totalWins[i],
          totalEarnings: totalEarnings[i],
        })
      }
      
      return leaderboard
    } catch (error) {
      throw new Error(`Failed to get leaderboard data: ${error}`)
    }
  }

  /**
   * Get total number of registered players
   */
  async getTotalPlayers(): Promise<bigint> {
    try {
      return await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
        abi: PLAYER_REGISTRY_ABI,
        functionName: 'totalPlayers',
      }) as bigint
    } catch (error) {
      throw new Error(`Failed to get total players: ${error}`)
    }
  }

  /**
   * Validate username format
   */
  validateUsername(username: string): boolean {
    if (username.length < 3 || username.length > 20) {
      return false
    }
    
    // Only alphanumeric and underscore allowed
    const validPattern = /^[a-zA-Z0-9_]+$/
    return validPattern.test(username)
  }

  /**
   * Set event callbacks for real-time updates
   */
  setEventCallbacks(callbacks: PlayerEventCallbacks): void {
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

    // Listen to PlayerRegistered events
    this.wsClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
      abi: PLAYER_REGISTRY_ABI,
      eventName: 'PlayerRegistered',
      onLogs: (logs) => {
        logs.forEach((log) => {
          if (this.eventCallbacks.onPlayerRegistered && log.args) {
            const args = log.args as any
            this.eventCallbacks.onPlayerRegistered({
              player: args.player,
              username: args.username,
              registrationTime: args.registrationTime,
            })
          }
        })
      },
    })

    // Listen to StatsUpdated events
    this.wsClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
      abi: PLAYER_REGISTRY_ABI,
      eventName: 'StatsUpdated',
      onLogs: (logs) => {
        logs.forEach((log) => {
          if (this.eventCallbacks.onStatsUpdated && log.args) {
            const args = log.args as any
            this.eventCallbacks.onStatsUpdated({
              player: args.player,
              totalGames: args.totalGames,
              gamesWon: args.gamesWon,
              totalEarnings: args.totalEarnings,
            })
          }
        })
      },
    })

    // Listen to AchievementUnlocked events
    this.wsClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
      abi: PLAYER_REGISTRY_ABI,
      eventName: 'AchievementUnlocked',
      onLogs: (logs) => {
        logs.forEach((log) => {
          if (this.eventCallbacks.onAchievementUnlocked && log.args) {
            const args = log.args as any
            this.eventCallbacks.onAchievementUnlocked({
              player: args.player,
              achievementName: args.achievementName,
              reward: args.reward,
            })
          }
        })
      },
    })

    // Listen to LevelUp events
    this.wsClient.watchContractEvent({
      address: CONTRACT_ADDRESSES.PLAYER_REGISTRY,
      abi: PLAYER_REGISTRY_ABI,
      eventName: 'LevelUp',
      onLogs: (logs) => {
        logs.forEach((log) => {
          if (this.eventCallbacks.onLevelUp && log.args) {
            const args = log.args as any
            this.eventCallbacks.onLevelUp({
              player: args.player,
              newLevel: args.newLevel,
              experience: args.experience,
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
      console.log('Player registry event listeners stopped')
    }
  }
}