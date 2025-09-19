# SomniaForge SDK ⚡

<div align="center">

[![npm version](https://badge.fury.io/js/%40somniaforge%2Fsdk.svg)](https://badge.fury.io/js/%40somniaforge%2Fsdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Beta](https://img.shields.io/badge/Status-Beta-orange.svg)](#beta-disclaimer)

**A TypeScript SDK for building real-time, fully on-chain games on Somnia Network**

*Zero-config setup • Sub-second transactions • Real-time WebSocket events*

[📖 Documentation](https://somniaforge.com/docs) • [🎮 Live Demo](https://rockpaperscissors.somniaforge.com) • [🛠️ Examples](https://github.com/IronicDeGawd/SomniaForge-SDK/tree/main/apps)

</div>

---

## 🚧 Beta Disclaimer

**⚠️ This SDK is currently in beta development phase.**

- **Not production-ready**: Expect breaking changes between versions
- **Active development**: APIs and interfaces may change without notice
- **Testing recommended**: Thoroughly test in development environments before any production use
- **Community feedback welcome**: Please report issues and suggestions via GitHub Issues
- **Somnia Network testnet**: Currently optimized for Somnia testnet environment

We appreciate early adopters and contributors helping us build the future of real-time Somnia Network gaming!

---

## ✨ Features

- 🚀 **Zero Configuration** - Works out of the box with Somnia Network
- ⚡ **Sub-second Transactions** - Leverage Somnia's 1M+ TPS capability
- 🔄 **Real-time Events** - WebSocket integration for instant game state updates
- 🔗 **Viem Integration** - Modern Ethereum client with full TypeScript support
- 🎮 **Game Session Management** - Create, join, and manage multiplayer sessions
- 👤 **Player Profiles** - Registration, stats, and achievements system
- 💰 **Game Economy** - Built-in token management and betting pools
- 🏆 **Leaderboards** - Global rankings and tournament management
- 🌐 **Network Switching** - Automatic Somnia network connection
- 📱 **Cross-platform** - Works on web, mobile, and desktop
- 🎨 **React Components** - Pre-built UI components for rapid development

## 🚀 Quick Start

### Installation

```bash
npm install @somniaforge/sdk
# or
yarn add @somniaforge/sdk
# or
pnpm add @somniaforge/sdk
```

### Basic Usage

```typescript
import { SomniaForgeSDK } from '@somniaforge/sdk'

// Initialize the SDK
const sdk = new SomniaForgeSDK()

// Connect wallet and initialize
const connection = await sdk.initialize()
console.log('Connected to Somnia Network:', connection)

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

### React Components

```tsx
import {
  SomniaButton,
  GameCard,
  PlayerProfile,
  WalletConnectButton
} from '@somniaforge/sdk'

function GameApp() {
  return (
    <div>
      <WalletConnectButton onConnect={handleConnect} />
      <PlayerProfile address="0x..." />
      <GameCard
        title="Rock Paper Scissors"
        players={2}
        maxPlayers={2}
        status="waiting"
      />
      <SomniaButton variant="primary" onClick={createGame}>
        Create Game
      </SomniaButton>
    </div>
  )
}
```

## 🌐 Somnia Network Configuration

The SDK is pre-configured for Somnia Network testnet:

| Property | Value |
|----------|-------|
| **Network** | Somnia Testnet |
| **Chain ID** | 50312 (0xc488) |
| **RPC URL** | https://dream-rpc.somnia.network |
| **WebSocket** | wss://dream-rpc.somnia.network/ws |
| **Explorer** | https://shannon-explorer.somnia.network |
| **Currency** | STT (Somnia Test Token) |

## 🎮 Example: Rock Paper Scissors Game

```typescript
import { SomniaForgeSDK, parseEther } from '@somniaforge/sdk'

const sdk = new SomniaForgeSDK()
await sdk.initialize()

// Create game session
const sessionId = await sdk.gameSession.createSession({
  maxPlayers: 2,
  entryFee: parseEther('0.001'),
  moveTimeLimit: 60
})

// Player joins and submits move
await sdk.gameSession.joinSession(sessionId)
const moveHash = sdk.gameSession.createMoveHash('rock', 'mysecret')
await sdk.gameSession.submitMove(sessionId, moveHash)

// Reveal phase
await sdk.gameSession.revealMove(sessionId, 'rock', 'mysecret')
```

## 📊 Bundle Size & Performance

| Format | Size | Gzipped | Performance |
|--------|------|---------|-------------|
| **ESM** | ~74KB | 9.4KB | Optimized |
| **CJS** | ~40KB | 7.1KB | Legacy Support |
| **Target** | <100KB | <15KB | ✅ Achieved |

- **Tree-shakable**: Import only what you need
- **Zero dependencies**: Core functionality with minimal external deps
- **TypeScript native**: Full type safety and IntelliSense support

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support & Community

- **📖 Documentation**: [SomniaForge Docs](https://somniaforge.com/docs)
- **🎮 Live Demo**: [Interactive Demo](https://rockpaperscissors.somniaforge.com)
- **💬 Discord**: [Developer Community](#)
- **📧 Email**: [Contact Email](mailto:developers@somniaforge.com)
- **🐛 GitHub Issues**: [Report Issues](https://github.com/IronicDeGawd/SomniaForge-SDK/issues)
- **🐦 Twitter**: [Follow Updates](#)

---

<div align="center">

**Built with ❤️ for the Somnia Network gaming ecosystem**

[🌟 Star us on GitHub](https://github.com/IronicDeGawd/SomniaForge-SDK/stargazers) • [🍴 Fork the project](https://github.com/IronicDeGawd/SomniaForge-SDK/fork) • [📖 Read the docs](https://somniaforge.com/docs)

</div>