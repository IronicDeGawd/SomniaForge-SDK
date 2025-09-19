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
  variant?: 'card' | 'inline' | 'detailed'
  /** Whether to show statistics */
  showStats?: boolean
  /** Whether to show avatar */
  showAvatar?: boolean
  /** Function called when edit button is clicked */
  onEdit?: () => void
  /** Player achievements */
  achievements?: Array<{
    name: string
    description: string
    isUnlocked: boolean
  }>
  /** Whether to show achievements */
  showAchievements?: boolean
  /** Additional CSS classes */
  onEditProfile?: () => void
  className?: string
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
  playerAddress,
  playerName,
  avatar,
  stats,
  variant = 'card',
  showStats = true,
  showAvatar = true,
  achievements = [],
  showAchievements = true,
  onEdit,
  onEditProfile,
  className = '',
}) => {
  const getContainerStyles = () => {
    const baseStyles = {
      fontFamily: SomniaTheme.fonts.inter,
    }

    const variantStyles = {
      card: {
        background: SomniaColors.surface,
        borderRadius: SomniaTheme.borderRadius.lg,
        padding: SomniaTheme.spacing.lg,
        boxShadow: SomniaTheme.shadow.md,
        border: `1px solid ${SomniaColors.border}`,
      },
      inline: {
        display: 'flex',
        alignItems: 'center',
        gap: SomniaTheme.spacing.md,
        padding: SomniaTheme.spacing.md,
        background: SomniaColors.backgroundSecondary,
        borderRadius: SomniaTheme.borderRadius.lg,
      },
      detailed: {
        background: SomniaColors.surface,
        borderRadius: SomniaTheme.borderRadius.lg,
        padding: SomniaTheme.spacing['2xl'],
        boxShadow: SomniaTheme.shadow.lg,
        border: `1px solid ${SomniaColors.border}`,
      },
    }

    return {
      ...baseStyles,
      ...variantStyles[variant],
    }
  }

  const formatAddress = (addr?: string) => {
    if (!addr) return 'No address'
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getExperiencePercentage = () => {
    if (!stats || stats.nextLevelExp === 0) return 100
    return Math.min((stats.experience / stats.nextLevelExp) * 100, 100)
  }

  const getLevelColor = (level: number) => {
    if (level >= 20) return SomniaColors.primaryGradient
    if (level >= 10) return SomniaColors.info
    if (level >= 5) return SomniaColors.success
    return SomniaColors.foregroundSecondary
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
      {!avatar && playerName?.charAt(0).toUpperCase()}
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
            fontSize: variant === 'inline' ? SomniaTheme.fontSize.base : SomniaTheme.fontSize.xl,
            fontWeight: SomniaTheme.fontWeight.bold,
            color: SomniaColors.foreground,
          }}>
            {playerName}
          </h3>
          
          {/* Level Badge */}
          <div style={{
            background: getLevelColor(stats?.level || 1),
            color: SomniaColors.white,
            padding: `${SomniaTheme.spacing.xs} ${SomniaTheme.spacing.sm}`,
            borderRadius: SomniaTheme.borderRadius.full,
            fontSize: SomniaTheme.fontSize.xs,
            fontWeight: SomniaTheme.fontWeight.bold,
          }}>
            LVL {stats?.level || 1}
          </div>
        </div>
        
        <div style={{
          fontSize: SomniaTheme.fontSize.sm,
          color: SomniaColors.foregroundSecondary,
          fontFamily: SomniaTheme.fonts.mono,
        }}>
          {formatAddress(playerAddress)}
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
                color: SomniaColors.foregroundSecondary,
              }}>
                Experience
              </span>
              <span style={{
                fontSize: SomniaTheme.fontSize.sm,
                fontWeight: SomniaTheme.fontWeight.semibold,
                color: SomniaColors.foreground,
              }}>
                {stats?.experience || 0} / {stats?.nextLevelExp || 100}
              </span>
            </div>
            
            {/* XP Progress Bar */}
            <div style={{
              width: '100%',
              height: '6px',
              background: SomniaColors.backgroundTertiary,
              borderRadius: SomniaTheme.borderRadius.full,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${getExperiencePercentage()}%`,
                height: '100%',
                background: getLevelColor(stats?.level || 1),
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
            border: `1px solid ${SomniaColors.border}`,
            borderRadius: SomniaTheme.borderRadius.md,
            padding: SomniaTheme.spacing.sm,
            cursor: 'pointer',
            color: SomniaColors.foregroundSecondary,
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
      { label: 'Games Played', value: stats?.totalGames || 0 },
      { label: 'Games Won', value: stats?.gamesWon || 0 },
      { label: 'Win Rate', value: `${Math.round(stats?.winRate || 0)}%` },
      { label: 'Current Streak', value: stats?.currentWinStreak || 0 },
      { label: 'Best Streak', value: stats?.bestWinStreak || 0 },
      { label: 'Total Earnings', value: `${stats?.totalEarnings || '0'} STT` },
    ]

    return (
      <div style={{ marginBottom: SomniaTheme.spacing.lg }}>
        <h4 style={{
          margin: `0 0 ${SomniaTheme.spacing.md} 0`,
          fontSize: SomniaTheme.fontSize.lg,
          fontWeight: SomniaTheme.fontWeight.semibold,
          color: SomniaColors.foreground,
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
              background: SomniaColors.backgroundSecondary,
              padding: SomniaTheme.spacing.md,
              borderRadius: SomniaTheme.borderRadius.lg,
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: variant === 'detailed' ? SomniaTheme.fontSize.xl : SomniaTheme.fontSize.lg,
                fontWeight: SomniaTheme.fontWeight.bold,
                color: SomniaColors.foreground,
                marginBottom: SomniaTheme.spacing.xs,
              }}>
                {value}
              </div>
              <div style={{
                fontSize: SomniaTheme.fontSize.sm,
                color: SomniaColors.foregroundSecondary,
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
          color: SomniaColors.foreground,
        }}>
          Achievements ({achievements.filter((a: any) => a.isUnlocked).length}/{achievements.length})
        </h4>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: SomniaTheme.spacing.sm,
        }}>
          {achievements.map((achievement: any, index: number) => (
            <div key={index} style={{
              padding: `${SomniaTheme.spacing.sm} ${SomniaTheme.spacing.md}`,
              borderRadius: SomniaTheme.borderRadius.lg,
              background: achievement.isUnlocked 
                ? SomniaColors.primaryGradient 
                : SomniaColors.backgroundTertiary,
              color: achievement.isUnlocked 
                ? SomniaColors.white 
                : SomniaColors.foregroundTertiary,
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