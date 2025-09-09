# SomniaGameSDK UI Components

The SomniaGameSDK now includes beautiful, pre-built React components styled with Somnia's brand colors and gradients.

## 🎨 Design System

All components use the official Somnia brand gradient:
```css
background: linear-gradient(to bottom, #AD00FF, #333BFF)
```

## 🚀 Quick Start

```bash
npm install @somnia/game-sdk
```

```tsx
import { WalletConnectButton, GameCard, SomniaColors } from '@somnia/game-sdk'

function App() {
  return (
    <div>
      <WalletConnectButton 
        onConnect={async () => {
          // Handle wallet connection
        }}
        variant="primary"
      />
    </div>
  )
}
```

## 📦 Available Components

### 1. **WalletConnectButton**
Beautiful wallet connection button with built-in states and loading indicators.

```tsx
import { WalletConnectButton } from '@somnia/game-sdk'

<WalletConnectButton
  onConnect={handleConnect}
  onDisconnect={handleDisconnect}
  isConnected={false}
  isConnecting={false}
  account="0x1234..."
  variant="primary" // primary | secondary | outline
  size="md" // sm | md | lg
/>
```

**Props:**
- `onConnect?: () => Promise<void>` - Connect wallet handler
- `onDisconnect?: () => void` - Disconnect handler  
- `isConnected?: boolean` - Connection state
- `isConnecting?: boolean` - Loading state
- `account?: string` - Connected account address
- `variant?: 'primary' | 'secondary' | 'outline'` - Button style
- `size?: 'sm' | 'md' | 'lg'` - Button size

### 2. **GameCard**
Display game sessions with player count, status, and actions.

```tsx
import { GameCard } from '@somnia/game-sdk'

<GameCard
  title="Rock Paper Scissors"
  description="Fast-paced game for 2 players"
  playerCount={1}
  maxPlayers={2}
  entryFee="0.001"
  status="waiting" // waiting | active | completed
  onJoin={() => joinGame()}
  onView={() => viewDetails()}
  gameId="123"
  variant="featured" // default | featured | compact
/>
```

**Props:**
- `title: string` - Game title
- `description?: string` - Game description
- `playerCount: number` - Current players
- `maxPlayers: number` - Maximum players
- `entryFee?: string` - Entry fee in STT
- `status: 'waiting' | 'active' | 'completed'` - Game status
- `onJoin?: () => void` - Join game handler
- `onView?: () => void` - View details handler
- `variant?: 'default' | 'featured' | 'compact'` - Card style

### 3. **PlayerProfile**
Comprehensive player profile with stats, achievements, and experience.

```tsx
import { PlayerProfile } from '@somnia/game-sdk'

<PlayerProfile
  username="Player123"
  address="0x1234..."
  stats={{
    totalGames: 50,
    gamesWon: 32,
    gamesLost: 18,
    winRate: 64,
    currentWinStreak: 5,
    bestWinStreak: 12,
    totalEarnings: "12.5",
    level: 8,
    experience: 2400,
    nextLevelExp: 3000
  }}
  achievements={[
    { name: "First Win", description: "Win your first game", reward: "0.1", isUnlocked: true },
    { name: "Win Streak", description: "Win 10 games in a row", reward: "1.0", isUnlocked: false }
  ]}
  variant="card" // card | inline | detailed
  showAchievements={true}
  onEditProfile={() => editProfile()}
/>
```

**Props:**
- `username: string` - Player username
- `address: string` - Wallet address
- `avatar?: string` - Profile picture URL
- `stats: UIPlayerStats` - Player statistics
- `achievements?: UIAchievement[]` - Achievement list
- `variant?: 'card' | 'inline' | 'detailed'` - Display style
- `showAchievements?: boolean` - Show achievements section

### 4. **SomniaButton**
Versatile button component with Somnia branding.

```tsx
import { SomniaButton } from '@somnia/game-sdk'

<SomniaButton
  variant="primary" // primary | secondary | outline | ghost
  size="md" // sm | md | lg
  loading={false}
  disabled={false}
  icon={<PlayIcon />}
  iconPosition="left" // left | right
  fullWidth={false}
  onClick={() => handleClick()}
>
  Play Game
</SomniaButton>
```

**Props:**
- `children: React.ReactNode` - Button content
- `onClick?: () => void` - Click handler
- `variant?: 'primary' | 'secondary' | 'outline' | 'ghost'` - Button style
- `size?: 'sm' | 'md' | 'lg'` - Button size
- `loading?: boolean` - Loading state
- `disabled?: boolean` - Disabled state
- `icon?: React.ReactNode` - Icon element
- `iconPosition?: 'left' | 'right'` - Icon position

### 5. **GameStats**
Display aggregate game statistics and metrics.

```tsx
import { GameStats } from '@somnia/game-sdk'

<GameStats
  totalGames={1250}
  activeGames={45}
  totalPlayers={892}
  totalPrizePool="125.5"
  averageGameTime="3m 42s"
  variant="dashboard" // dashboard | compact | card
/>
```

**Props:**
- `totalGames: number` - Total games played
- `activeGames: number` - Currently active games
- `totalPlayers: number` - Total registered players
- `totalPrizePool: string` - Total prize pool in STT
- `averageGameTime: string` - Average game duration
- `variant?: 'dashboard' | 'compact' | 'card'` - Display style

## 🎨 Design System Access

Import the design system for custom components:

```tsx
import { SomniaColors, SomniaTheme } from '@somnia/game-sdk'

const customStyle = {
  background: SomniaColors.primaryGradient,
  borderRadius: SomniaTheme.borderRadius.lg,
  padding: SomniaTheme.spacing.md,
  color: SomniaColors.white,
  boxShadow: SomniaTheme.shadow.somnia,
}
```

### Available Colors:
- `SomniaColors.primaryGradient` - Main Somnia gradient
- `SomniaColors.somniaViolet` - #AD00FF
- `SomniaColors.somniaBlue` - #333BFF
- `SomniaColors.hover` - Hover state gradient
- `SomniaColors.success` - Success green
- `SomniaColors.error` - Error red
- `SomniaColors.gray[100-900]` - Gray scale

### Available Theme Values:
- `SomniaTheme.borderRadius` - Border radius values
- `SomniaTheme.spacing` - Consistent spacing
- `SomniaTheme.fontSize` - Typography scale
- `SomniaTheme.shadow` - Drop shadow styles

## 🔧 TypeScript Support

All components are fully typed with TypeScript:

```tsx
import type { 
  WalletConnectButtonProps,
  GameCardProps,
  PlayerProfileProps,
  UIPlayerStats,
  UIAchievement 
} from '@somnia/game-sdk'
```

## 🎮 Integration with SDK

Components work seamlessly with the SomniaGameSDK:

```tsx
import { SomniaGameSDK, WalletConnectButton, GameCard } from '@somnia/game-sdk'

const sdk = new SomniaGameSDK()

function GameInterface() {
  return (
    <div>
      <WalletConnectButton 
        onConnect={async () => {
          await sdk.initialize()
        }}
      />
      
      <GameCard
        title="Rock Paper Scissors"
        playerCount={1}
        maxPlayers={2}
        status="waiting"
        onJoin={async () => {
          await sdk.gameSession.joinSession(BigInt(sessionId))
        }}
      />
    </div>
  )
}
```

## 📱 Responsive Design

All components are mobile-responsive and include:
- Flexible layouts that adapt to screen size
- Touch-friendly interactions
- Accessible keyboard navigation
- Smooth animations and transitions

## 🎯 Best Practices

1. **Consistent Theming**: Always use `SomniaColors` and `SomniaTheme` for custom styles
2. **Accessibility**: Components include ARIA labels and keyboard support
3. **Performance**: Components are optimized with React.memo where appropriate
4. **TypeScript**: Use provided types for better development experience

## 📖 Examples

Check the `examples/` directory for complete implementation examples showing how to use these components in real applications.