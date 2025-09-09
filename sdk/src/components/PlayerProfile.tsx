import React from 'react'
import { SomniaColors, SomniaTheme } from './styles'

/**
 * Player statistics interface
 */
export interface PlayerStats {
  /** Total number of games played */
  totalGames: number
  /** Number of games won */
  gamesWon: number
  /** Number of games lost */
  gamesLost: number
  /** Win rate percentage */
  winRate: number
  /** Current winning streak */
  currentWinStreak: number
  /** Best winning streak achieved */
  bestWinStreak: number
  /** Total earnings from games */
  totalEarnings: string
  /** Player level */
  level: number
  /** Experience points */
  experience: number
  /** Experience points required for next level */
  nextLevelExp: number
}

/**
 * Props for the PlayerProfile component
 */
export interface PlayerProfileProps {
  /** Player's wallet address */
  playerAddress?: string
  /** Display name for the player */
  playerName?: string
  /** Avatar image URL */
  avatar?: string
  /** Player statistics */
  stats?: PlayerStats
  /** Visual style variant */
  variant?: 'full' | 'compact' | 'minimal'
  /** Whether to show statistics */
  showStats?: boolean
  /** Whether to show avatar */
  showAvatar?: boolean
  /** Function called when edit button is clicked */
  onEdit?: () => void
  /** Additional CSS classes */
  onEditProfile?: () => void
  className?: string
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
  username,
  address,
  avatar,
  stats,
  achievements = [],
  variant = 'card',
  showAchievements = true,
  onEditProfile,
  className = '',
}) => {
  const getContainerStyles = () => {
    const baseStyles = {
      fontFamily: 'inherit',
    }

    const variantStyles = {
      card: {
        background: SomniaColors.white,
        borderRadius: SomniaTheme.borderRadius.xl,
        padding: SomniaTheme.spacing.lg,
        boxShadow: SomniaTheme.shadow.md,
        border: `1px solid ${SomniaColors.gray[200]}`,
      },
      inline: {
        display: 'flex',
        alignItems: 'center',
        gap: SomniaTheme.spacing.md,
        padding: SomniaTheme.spacing.md,
        background: SomniaColors.gray[50],
        borderRadius: SomniaTheme.borderRadius.lg,
      },
      detailed: {
        background: SomniaColors.white,
        borderRadius: SomniaTheme.borderRadius.xl,
        padding: SomniaTheme.spacing.xl,
        boxShadow: SomniaTheme.shadow.lg,
        border: `1px solid ${SomniaColors.gray[200]}`,
      },
    }

    return {
      ...baseStyles,
      ...variantStyles[variant],
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getExperiencePercentage = () => {
    if (stats.nextLevelExp === 0) return 100
    return Math.min((stats.experience / stats.nextLevelExp) * 100, 100)
  }

  const getLevelColor = (level: number) => {
    if (level >= 20) return SomniaColors.primaryGradient
    if (level >= 10) return SomniaColors.info
    if (level >= 5) return SomniaColors.success
    return SomniaColors.gray[600]
  }

  const renderAvatar = () => (
    <div style={{
      width: variant === 'inline' ? '3rem' : '4rem',
      height: variant === 'inline' ? '3rem' : '4rem',
      borderRadius: SomniaTheme.borderRadius.full,
      background: avatar 
        ? `url(${avatar}) center/cover` 
        : SomniaColors.primaryGradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: SomniaColors.white,
      fontSize: variant === 'inline' ? SomniaTheme.fontSize.lg : SomniaTheme.fontSize.xl,
      fontWeight: SomniaTheme.fontWeight.bold,
      border: `3px solid ${SomniaColors.white}`,
      boxShadow: SomniaTheme.shadow.md,
    }}>
      {!avatar && username.charAt(0).toUpperCase()}
    </div>
  )

  const renderHeader = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: SomniaTheme.spacing.md,
      marginBottom: variant === 'inline' ? 0 : SomniaTheme.spacing.lg,
    }}>
      {renderAvatar()}
      
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SomniaTheme.spacing.sm,
          marginBottom: SomniaTheme.spacing.xs,
        }}>
          <h3 style={{
            margin: 0,
            fontSize: variant === 'inline' ? SomniaTheme.fontSize.md : SomniaTheme.fontSize.xl,
            fontWeight: SomniaTheme.fontWeight.bold,
            color: SomniaColors.gray[900],
          }}>
            {username}
          </h3>
          
          {/* Level Badge */}
          <div style={{
            background: getLevelColor(stats.level),
            color: SomniaColors.white,
            padding: `${SomniaTheme.spacing.xs} ${SomniaTheme.spacing.sm}`,
            borderRadius: SomniaTheme.borderRadius.full,
            fontSize: SomniaTheme.fontSize.xs,
            fontWeight: SomniaTheme.fontWeight.bold,
          }}>
            LVL {stats.level}
          </div>
        </div>
        
        <div style={{
          fontSize: SomniaTheme.fontSize.sm,
          color: SomniaColors.gray[600],
          fontFamily: 'monospace',
        }}>
          {formatAddress(address)}
        </div>

        {variant !== 'inline' && (
          <div style={{ marginTop: SomniaTheme.spacing.sm }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: SomniaTheme.spacing.xs,
            }}>
              <span style={{
                fontSize: SomniaTheme.fontSize.sm,
                color: SomniaColors.gray[600],
              }}>
                Experience
              </span>
              <span style={{
                fontSize: SomniaTheme.fontSize.sm,
                fontWeight: SomniaTheme.fontWeight.semibold,
                color: SomniaColors.gray[900],
              }}>
                {stats.experience} / {stats.nextLevelExp}
              </span>
            </div>
            
            {/* XP Progress Bar */}
            <div style={{
              width: '100%',
              height: '6px',
              background: SomniaColors.gray[200],
              borderRadius: SomniaTheme.borderRadius.full,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${getExperiencePercentage()}%`,
                height: '100%',
                background: getLevelColor(stats.level),
                transition: 'width 0.3s ease-in-out',
              }} />
            </div>
          </div>
        )}
      </div>

      {onEditProfile && variant !== 'inline' && (
        <button
          onClick={onEditProfile}
          style={{
            background: 'transparent',
            border: `1px solid ${SomniaColors.gray[300]}`,
            borderRadius: SomniaTheme.borderRadius.md,
            padding: SomniaTheme.spacing.sm,
            cursor: 'pointer',
            color: SomniaColors.gray[600],
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <EditIcon />
        </button>
      )}
    </div>
  )

  const renderStats = () => {
    if (variant === 'inline') return null

    const statItems = [
      { label: 'Games Played', value: stats.totalGames },
      { label: 'Games Won', value: stats.gamesWon },
      { label: 'Win Rate', value: `${Math.round(stats.winRate)}%` },
      { label: 'Current Streak', value: stats.currentWinStreak },
      { label: 'Best Streak', value: stats.bestWinStreak },
      { label: 'Total Earnings', value: `${stats.totalEarnings} STT` },
    ]

    return (
      <div style={{ marginBottom: SomniaTheme.spacing.lg }}>
        <h4 style={{
          margin: `0 0 ${SomniaTheme.spacing.md} 0`,
          fontSize: SomniaTheme.fontSize.lg,
          fontWeight: SomniaTheme.fontWeight.semibold,
          color: SomniaColors.gray[900],
        }}>
          Statistics
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: variant === 'detailed' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
          gap: SomniaTheme.spacing.md,
        }}>
          {statItems.map(({ label, value }) => (
            <div key={label} style={{
              background: SomniaColors.gray[50],
              padding: SomniaTheme.spacing.md,
              borderRadius: SomniaTheme.borderRadius.lg,
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: variant === 'detailed' ? SomniaTheme.fontSize.xl : SomniaTheme.fontSize.lg,
                fontWeight: SomniaTheme.fontWeight.bold,
                color: SomniaColors.gray[900],
                marginBottom: SomniaTheme.spacing.xs,
              }}>
                {value}
              </div>
              <div style={{
                fontSize: SomniaTheme.fontSize.sm,
                color: SomniaColors.gray[600],
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderAchievements = () => {
    if (!showAchievements || variant === 'inline' || achievements.length === 0) return null

    return (
      <div>
        <h4 style={{
          margin: `0 0 ${SomniaTheme.spacing.md} 0`,
          fontSize: SomniaTheme.fontSize.lg,
          fontWeight: SomniaTheme.fontWeight.semibold,
          color: SomniaColors.gray[900],
        }}>
          Achievements ({achievements.filter(a => a.isUnlocked).length}/{achievements.length})
        </h4>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: SomniaTheme.spacing.sm,
        }}>
          {achievements.map((achievement, index) => (
            <div key={index} style={{
              padding: `${SomniaTheme.spacing.sm} ${SomniaTheme.spacing.md}`,
              borderRadius: SomniaTheme.borderRadius.lg,
              background: achievement.isUnlocked 
                ? SomniaColors.primaryGradient 
                : SomniaColors.gray[200],
              color: achievement.isUnlocked 
                ? SomniaColors.white 
                : SomniaColors.gray[500],
              fontSize: SomniaTheme.fontSize.sm,
              fontWeight: SomniaTheme.fontWeight.medium,
              opacity: achievement.isUnlocked ? 1 : 0.6,
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
            }}>
              {achievement.name}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={getContainerStyles()} className={className}>
      {renderHeader()}
      {renderStats()}
      {renderAchievements()}
    </div>
  )
}

// Helper icon component
const EditIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)