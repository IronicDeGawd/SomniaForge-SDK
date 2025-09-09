import React from 'react'
import { SomniaColors, SomniaTheme } from './styles'

/**
 * Props for the GameStats component
 */
export interface GameStatsProps {
  /** Total number of games */
  totalGames: number
  /** Number of currently active games */
  activeGames: number
  /** Total number of players */
  totalPlayers: number
  /** Total prize pool amount */
  totalPrizePool: string
  /** Average game duration */
  averageGameTime: string
  /** Visual style variant */
  variant?: 'dashboard' | 'compact' | 'card'
  /** Additional CSS classes */
  className?: string
}

/**
 * A component for displaying game statistics and metrics
 * 
 * @param props - The game stats props
 * @returns A styled statistics display component
 */
export const GameStats: React.FC<GameStatsProps> = ({
  totalGames,
  activeGames,
  totalPlayers,
  totalPrizePool,
  averageGameTime,
  variant = 'dashboard',
  className = '',
}) => {
  const getContainerStyles = () => {
    const baseStyles = {
      fontFamily: 'inherit',
    }

    const variantStyles = {
      dashboard: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: SomniaTheme.spacing.lg,
      },
      compact: {
        display: 'flex',
        gap: SomniaTheme.spacing.md,
        flexWrap: 'wrap' as const,
      },
      card: {
        background: SomniaColors.white,
        borderRadius: SomniaTheme.borderRadius.xl,
        padding: SomniaTheme.spacing.lg,
        boxShadow: SomniaTheme.shadow.md,
        border: `1px solid ${SomniaColors.gray[200]}`,
      },
    }

    return {
      ...baseStyles,
      ...variantStyles[variant],
    }
  }

  const getStatCardStyles = (isHighlight: boolean = false) => {
    return {
      background: isHighlight 
        ? `linear-gradient(135deg, ${SomniaColors.white} 0%, #F8F4FF 100%)`
        : SomniaColors.white,
      borderRadius: SomniaTheme.borderRadius.lg,
      padding: variant === 'compact' ? SomniaTheme.spacing.md : SomniaTheme.spacing.lg,
      boxShadow: SomniaTheme.shadow.sm,
      border: isHighlight 
        ? `2px solid ${SomniaColors.somniaViolet}` 
        : `1px solid ${SomniaColors.gray[200]}`,
      transition: 'all 0.2s ease-in-out',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: SomniaTheme.shadow.md,
      },
      ...(isHighlight && {
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: SomniaColors.primaryGradientHorizontal,
        },
      }),
    }
  }

  const stats = [
    {
      label: 'Total Games',
      value: totalGames.toLocaleString(),
      icon: <GameIcon />,
      highlight: false,
      color: SomniaColors.info,
    },
    {
      label: 'Active Games',
      value: activeGames.toLocaleString(),
      icon: <ActiveIcon />,
      highlight: true,
      color: SomniaColors.success,
    },
    {
      label: 'Total Players',
      value: totalPlayers.toLocaleString(),
      icon: <PlayersIcon />,
      highlight: false,
      color: SomniaColors.somniaViolet,
    },
    {
      label: 'Prize Pool',
      value: `${totalPrizePool} STT`,
      icon: <PrizeIcon />,
      highlight: false,
      color: SomniaColors.warning,
    },
    {
      label: 'Avg Game Time',
      value: averageGameTime,
      icon: <TimeIcon />,
      highlight: false,
      color: SomniaColors.gray[600],
    },
  ]

  const renderStatCard = (stat: typeof stats[0], index: number) => (
    <div key={index} style={getStatCardStyles(stat.highlight)}>
      {/* Icon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: SomniaTheme.spacing.md,
      }}>
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: SomniaTheme.borderRadius.lg,
          background: `${stat.color}15`,
          color: stat.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SomniaTheme.spacing.sm,
        }}>
          {stat.icon}
        </div>
        
        {variant !== 'compact' && (
          <div style={{
            fontSize: SomniaTheme.fontSize.sm,
            color: SomniaColors.gray[600],
            fontWeight: SomniaTheme.fontWeight.medium,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
          }}>
            {stat.label}
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{
        fontSize: variant === 'compact' ? SomniaTheme.fontSize.lg : SomniaTheme.fontSize['2xl'],
        fontWeight: SomniaTheme.fontWeight.bold,
        color: SomniaColors.gray[900],
        marginBottom: variant === 'compact' ? SomniaTheme.spacing.xs : SomniaTheme.spacing.sm,
        lineHeight: '1.2',
      }}>
        {stat.value}
      </div>

      {/* Label for compact variant */}
      {variant === 'compact' && (
        <div style={{
          fontSize: SomniaTheme.fontSize.sm,
          color: SomniaColors.gray[600],
          fontWeight: SomniaTheme.fontWeight.medium,
        }}>
          {stat.label}
        </div>
      )}

      {/* Growth indicator (placeholder) */}
      {stat.highlight && variant !== 'compact' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SomniaTheme.spacing.xs,
          fontSize: SomniaTheme.fontSize.sm,
          color: SomniaColors.success,
          fontWeight: SomniaTheme.fontWeight.medium,
        }}>
          <TrendUpIcon />
          <span>+12% from last week</span>
        </div>
      )}
    </div>
  )

  return (
    <div style={getContainerStyles()} className={className}>
      {stats.map((stat, index) => renderStatCard(stat, index))}
    </div>
  )
}

// Icon components
const GameIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
)

const ActiveIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
)

const PlayersIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const PrizeIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
)

const TimeIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
)

const TrendUpIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)