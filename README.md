# SomniaForge SDK Monorepo ⚡

<div align="center">

[![npm version](https://badge.fury.io/js/%40somniaforge%2Fsdk.svg)](https://badge.fury.io/js/%40somniaforge%2Fsdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Beta](https://img.shields.io/badge/Status-Beta-orange.svg)](#beta-disclaimer)

**A comprehensive monorepo for SomniaForge SDK - Zero-config TypeScript toolkit for building real-time games on Somnia Network**

*Sub-second transactions • Real-time WebSocket events • Complete gaming ecosystem*

[📖 Documentation](#) • [🎮 Live Demo](#) • [📦 NPM Package](https://www.npmjs.com/package/@somniaforge/sdk)

</div>

---

## 🚧 Beta Disclaimer

**⚠️ This project is currently in beta development phase.**

- **Not production-ready**: Expect breaking changes between versions
- **Active development**: APIs and interfaces may change without notice
- **Testing recommended**: Thoroughly test in development environments
- **Community feedback welcome**: Please report issues and suggestions
- **Somnia Network testnet**: Currently optimized for Somnia testnet environment

---

## 📁 Repository Structure

This monorepo contains all components of the SomniaForge ecosystem:

```
├── packages/           # 📦 Core SomniaForge SDK
├── apps/              # 🎮 Example applications
├── contracts/         # 📜 Smart contracts
├── docs-site/         # 📖 Documentation website
├── urls.md           # 🔗 URL configuration (for deployment)
└── somniaforge-design-system.html  # 🎨 Design system reference
```

### 📦 Core Package: SomniaForge SDK

**NPM Package**: `@somniaforge/sdk` (v1.2.0-beta.1)

The heart of this monorepo - a TypeScript SDK that provides:

- 🚀 **Zero Configuration** - Works out of the box with Somnia Network
- ⚡ **Sub-second Transactions** - Leverage Somnia's 1M+ TPS capability
- 🔄 **Real-time Events** - WebSocket integration for instant game state updates
- 🔗 **Viem Integration** - Modern Ethereum client with full TypeScript support
- 🎮 **Game Session Management** - Create, join, and manage multiplayer sessions
- 👤 **Player Profiles** - Registration, stats, and achievements system
- 💰 **Game Economy** - Built-in token management and betting pools
- 🏆 **Leaderboards** - Global rankings and tournament management
- 🎨 **React Components** - Pre-built UI components for rapid development

#### Quick Installation

```bash
npm install @somniaforge/sdk
# or
yarn add @somniaforge/sdk
# or
pnpm add @somniaforge/sdk
```

#### Basic Usage

```typescript
import { SomniaForgeSDK } from '@somniaforge/sdk'

// Initialize the SDK
const sdk = new SomniaForgeSDK()

// Connect wallet and initialize
const connection = await sdk.initialize()

// Create a game session
const sessionId = await sdk.gameSession.createSession({
  maxPlayers: 4,
  entryFee: parseEther('0.01'),
  moveTimeLimit: 300
})
```

### 🎮 Example Applications (`/apps`)

Real-world implementations showcasing the SDK capabilities:

- **Rock Paper Scissors** - Turn-based multiplayer game with betting mechanics
  - Modern responsive UI with SomniaForge design system
  - Real-time game state updates via WebSocket
  - Wallet integration and session management
  - Mobile-optimized gaming experience

### 📜 Smart Contracts (`/contracts`)

Hardhat-based smart contract development environment:

- Game session management contracts
- Player profile and statistics contracts
- Token and betting pool contracts
- Leaderboard and tournament contracts
- Deployment scripts for Somnia Network
- Comprehensive test suites

### 📖 Documentation Site (`/docs-site`)

Vite + React documentation website featuring:

- Interactive API documentation
- Component showcase and examples
- Getting started guides
- Live code examples
- Design system documentation

---

## 🌐 Somnia Network Integration

Pre-configured for Somnia Network testnet:

| Property | Value |
|----------|-------|
| **Network** | Somnia Testnet |
| **Chain ID** | 50312 (0xc488) |
| **RPC URL** | https://dream-rpc.somnia.network |
| **WebSocket** | wss://dream-rpc.somnia.network/ws |
| **Explorer** | https://shannon-explorer.somnia.network |
| **Currency** | STT (Somnia Test Token) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd SomniaDefi
   ```

2. **Install dependencies**
   ```bash
   # Install SDK dependencies
   cd packages && npm install
   
   # Install contract dependencies
   cd ../contracts && npm install
   
   # Install docs site dependencies
   cd ../docs-site && npm install
   
   # Install example app dependencies
   cd ../apps/rock-paper-scissors && npm install
   ```

3. **Build the SDK**
   ```bash
   cd packages
   npm run build
   ```

4. **Run example application**
   ```bash
   cd ../apps/rock-paper-scissors
   npm run dev
   ```

5. **Start documentation site**
   ```bash
   cd ../../docs-site
   npm run dev
   ```

### Package Development

The SDK is built with modern tooling:

- **Vite** - Fast build tool and dev server
- **TypeScript** - Full type safety
- **Vitest** - Unit testing framework
- **ESM/CJS** - Dual package format support

#### Available Scripts

```bash
cd packages

npm run dev          # Development build with watch mode
npm run build        # Production build
npm run test         # Run test suite
npm run test:coverage # Run tests with coverage
npm run type-check   # TypeScript type checking
```

---

## 📊 Package Information

### Bundle Size & Performance

| Format | Size | Gzipped | Performance |
|--------|------|---------|-------------|
| **ESM** | ~74KB | 9.4KB | Optimized |
| **CJS** | ~40KB | 7.1KB | Legacy Support |
| **Target** | <100KB | <15KB | ✅ Achieved |

### Key Features

- **Tree-shakable**: Import only what you need
- **Zero dependencies**: Core functionality with minimal external deps
- **TypeScript native**: Full type safety and IntelliSense support
- **React integration**: Pre-built components for rapid development
- **Cross-platform**: Works on web, mobile, and desktop

### Dependencies

- **viem**: Modern Ethereum client (^2.21.0)
- **ws**: WebSocket client for real-time events (^8.18.0)
- **React**: Peer dependency for UI components (^18.0.0 || ^19.0.0)

---

## 🛠️ Development Workflow

### Monorepo Structure

This project uses a monorepo structure to manage:

1. **Core SDK development** in `/packages`
2. **Example applications** in `/apps`
3. **Smart contracts** in `/contracts`
4. **Documentation** in `/docs-site`

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Testing

Each package includes comprehensive test suites:

```bash
# Test SDK
cd packages && npm test

# Test contracts
cd contracts && npm test

# Test documentation site
cd docs-site && npm test
```

---

## 📄 License

MIT License - see [LICENSE](./packages/LICENSE) file for details.

---

## 🆘 Support & Community

- **📖 Documentation**: [SomniaForge Docs](#)
- **🎮 Live Demo**: [Interactive Demo](#)
- **💬 Discord**: [Developer Community](#)
- **📧 Email**: developers@somniaforge.dev
- **🐛 GitHub Issues**: [Report Issues](#)
- **🐦 Twitter**: [Follow Updates](#)

---

## 🔗 Quick Links

- **NPM Package**: [@somniaforge/sdk](https://www.npmjs.com/package/@somniaforge/sdk)
- **Somnia Network**: [Official Website](https://somnia.network)
- **Somnia Docs**: [Developer Documentation](https://docs.somnia.network)
- **Viem Documentation**: [Modern Ethereum Client](https://viem.sh)

---

<div align="center">

**Built with ❤️ for the Somnia Network gaming ecosystem**

[🌟 Star us on GitHub](#) • [🍴 Fork the project](#) • [📖 Read the docs](#)

*Empowering developers to build the next generation of real-time, fully on-chain games*

</div>
