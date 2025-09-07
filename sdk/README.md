# Somnia Game SDK

A TypeScript SDK for building real-time, fully on-chain games on Somnia Network.

## Features

- 🚀 **Zero Configuration** - Works out of the box with Somnia Network
- ⚡ **Real-time Events** - WebSocket integration for sub-second event notifications
- 🔗 **Viem Integration** - Modern Ethereum client with full TypeScript support
- 🎮 **Game Session Management** - Create, join, and manage multiplayer game sessions
- 👤 **Player Profiles** - Player registration, stats, and achievements system
- 💰 **Game Economy** - Built-in token management and betting pools
- 🏆 **Leaderboards** - Global rankings and tournament management
- 🔄 **Automatic Network Switching** - Seamless Somnia network connection

## Installation

```bash
npm install @somnia/game-sdk
```

## Quick Start

```typescript
import { SomniaGameSDK } from '@somnia/game-sdk'

// Initialize the SDK
const sdk = new SomniaGameSDK()

// Connect wallet and initialize
const connection = await sdk.initialize()
console.log('Connected to Somnia Network:', connection)

// Register a new player
await sdk.playerRegistry.registerPlayer('myusername')

// Create a game session
const sessionId = await sdk.gameSession.createSession({
  maxPlayers: 4,
  entryFee: parseEther('0.01'),
  moveTimeLimit: 300 // 5 minutes
})

// Set up real-time event listeners
sdk.gameSession.setEventCallbacks({
  onPlayerJoined: (event) => {
    console.log('Player joined:', event.player)
  },
  onSessionStarted: (event) => {
    console.log('Game started:', event.sessionId)
  }
})
```

## Network Configuration

The SDK is pre-configured for Somnia Network:

- **Network**: Somnia Testnet
- **Chain ID**: 50312
- **RPC URL**: https://dream-rpc.somnia.network
- **WebSocket**: wss://dream-rpc.somnia.network/ws
- **Explorer**: https://shannon-explorer.somnia.network

## API Reference

### SomniaGameSDK

Main SDK class that provides access to all managers.

#### Methods

- `initialize()` - Connect wallet and initialize SDK
- `disconnect()` - Disconnect wallet and WebSocket
- `isInitialized()` - Check if SDK is fully initialized
- `getConnectionStatus()` - Get current connection status

#### Properties

- `gameSession` - GameSessionManager instance
- `playerRegistry` - PlayerRegistryManager instance
- `wallet` - WalletConnector instance
- `webSocket` - WebSocketManager instance

### GameSessionManager

Manages multiplayer game sessions.

#### Key Methods

- `createSession(options)` - Create a new game session
- `joinSession(sessionId)` - Join an existing session
- `submitMove(sessionId, moveHash)` - Submit a move
- `getSession(sessionId)` - Get session information
- `setEventCallbacks(callbacks)` - Set up event listeners

### PlayerRegistryManager

Manages player profiles and achievements.

#### Key Methods

- `registerPlayer(username)` - Register a new player
- `getPlayerProfile(address)` - Get player profile
- `getPlayerStats(address)` - Get player statistics
- `getLeaderboardData(offset, limit)` - Get leaderboard
- `hasAchievement(address, key)` - Check achievement

### WalletConnector

Handles wallet connection and network management.

#### Key Methods

- `connect()` - Connect to wallet
- `switchToSomniaNetwork()` - Switch to Somnia network
- `getBalance()` - Get account balance
- `signMessage(message)` - Sign a message

### WebSocketManager

Manages real-time WebSocket connections.

#### Key Methods

- `connect()` - Connect to WebSocket
- `subscribeToGameSessionEvents(filter, callback)` - Subscribe to events
- `waitForTransaction(hash)` - Wait for transaction confirmation

## Examples

### Creating and Joining a Game

```typescript
// Player 1: Create a game
const sessionId = await sdk.gameSession.createSession({
  maxPlayers: 2,
  entryFee: parseEther('0.001'),
  moveTimeLimit: 60
})

// Player 2: Join the game
await sdk.gameSession.joinSession(sessionId)

// Submit moves (Rock Paper Scissors example)
const moveHash = sdk.gameSession.createMoveHash('rock', 'mysecret')
await sdk.gameSession.submitMove(sessionId, moveHash)
```

### Player Registration and Stats

```typescript
// Register a new player
await sdk.playerRegistry.registerPlayer('player123')

// Get player information
const profile = await sdk.playerRegistry.getPlayerProfile(playerAddress)
const stats = await sdk.playerRegistry.getPlayerStats(playerAddress)

// Check achievements
const hasFirstWin = await sdk.playerRegistry.hasAchievement(
  playerAddress, 
  'first_victory'
)
```

### Real-time Event Handling

```typescript
// Set up comprehensive event listeners
sdk.gameSession.setEventCallbacks({
  onSessionCreated: (event) => {
    console.log(`New session ${event.sessionId} created by ${event.creator}`)
  },
  onPlayerJoined: (event) => {
    console.log(`Player ${event.player} joined session ${event.sessionId}`)
  },
  onMoveSubmitted: (event) => {
    console.log(`Move submitted in session ${event.sessionId}`)
  },
  onSessionCompleted: (event) => {
    console.log(`Session ${event.sessionId} completed!`)
    console.log('Winners:', event.winners)
  }
})

// Player-specific events
sdk.playerRegistry.setEventCallbacks({
  onPlayerRegistered: (event) => {
    console.log(`Welcome ${event.username}!`)
  },
  onAchievementUnlocked: (event) => {
    console.log(`Achievement unlocked: ${event.achievementName}`)
  },
  onLevelUp: (event) => {
    console.log(`Level up! New level: ${event.newLevel}`)
  }
})
```

## Bundle Size

- **ESM**: ~74KB (9.4KB gzipped)
- **CJS**: ~40KB (7.1KB gzipped)
- Well under the 100KB target for optimal performance

## License

MIT

## Support

For support and questions:
- Discord: https://discord.com/invite/somnia (#dev-chat)
- Email: developers@somnia.network
- GitHub Issues: Create an issue in the repository