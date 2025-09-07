import { Address, Hash } from 'viem'

export interface GameSession {
  sessionId: bigint
  playerCount: number
  maxPlayers: number
  moveTimeLimit: number
  createdAt: bigint
  startedAt: bigint
  isActive: boolean
  isComplete: boolean
  entryFee: bigint
  prizePool: bigint
  creator: Address
}

export interface Player {
  wallet: Address
  moveHash: Hash
  joinedAt: number
  moveSubmittedAt: number
  hasSubmittedMove: boolean
  isActive: boolean
}

export interface SessionCreatedEvent {
  sessionId: bigint
  creator: Address
  maxPlayers: number
  entryFee: bigint
  moveTimeLimit: number
}

export interface PlayerJoinedEvent {
  sessionId: bigint
  player: Address
  playerCount: number
}

export interface SessionStartedEvent {
  sessionId: bigint
  startedAt: bigint
}

export interface MoveSubmittedEvent {
  sessionId: bigint
  player: Address
  moveHash: Hash
  submittedAt: number
}

export interface SessionCompletedEvent {
  sessionId: bigint
  winners: Address[]
  prizes: bigint[]
  completedAt: bigint
}

export interface PrizeDistributedEvent {
  sessionId: bigint
  player: Address
  amount: bigint
}

export interface CreateSessionOptions {
  maxPlayers: number
  entryFee: bigint
  moveTimeLimit: number
}

export interface GameEventCallbacks {
  onSessionCreated?: (event: SessionCreatedEvent) => void
  onPlayerJoined?: (event: PlayerJoinedEvent) => void
  onSessionStarted?: (event: SessionStartedEvent) => void
  onMoveSubmitted?: (event: MoveSubmittedEvent) => void
  onSessionCompleted?: (event: SessionCompletedEvent) => void
  onPrizeDistributed?: (event: PrizeDistributedEvent) => void
}

export interface SDKConfig {
  rpcUrl?: string
  wsUrl?: string
  chainId?: number
  contractAddresses?: {
    gameSession?: Address
    playerRegistry?: Address
    gameEconomy?: Address
    leaderboard?: Address
    multiplayerGame?: Address
  }
}

// PlayerRegistry Types
export interface PlayerProfile {
  username: string
  registrationTime: bigint
  totalGames: number
  gamesWon: number
  gamesLost: number
  currentWinStreak: number
  bestWinStreak: number
  totalEarnings: bigint
  totalSpent: bigint
  isActive: boolean
  level: number
  experience: bigint
}

export interface PlayerStats {
  fastestWin: bigint
  averageGameTime: bigint
  rockPaperScissorsWins: number
  tournamentWins: number
  achievementsUnlocked: number
}

export interface Achievement {
  name: string
  description: string
  reward: bigint
  isActive: boolean
}

export interface PlayerRegisteredEvent {
  player: Address
  username: string
  registrationTime: bigint
}

export interface StatsUpdatedEvent {
  player: Address
  totalGames: number
  gamesWon: number
  totalEarnings: bigint
}

export interface AchievementUnlockedEvent {
  player: Address
  achievementName: string
  reward: bigint
}

export interface LevelUpEvent {
  player: Address
  newLevel: number
  experience: bigint
}

export interface LeaderboardEntry {
  playerAddress: Address
  username: string
  totalWins: number
  totalEarnings: bigint
}