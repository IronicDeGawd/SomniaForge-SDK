import React from 'react'
import { SomniaColors, SomniaTheme } from './styles'

/**
 * Props for the GameCard component
 */
export interface GameCardProps {
  /** Game title */
  title: string
  /** Game description */
  description?: string
  /** Current number of players */
  playerCount?: number
  /** Maximum number of players allowed */
  maxPlayers?: number
  /** Entry fee for the game */
  entryFee?: string
  /** Total prize pool */
  prizePool?: string
  /** Current game status */
  status?: 'waiting' | 'active' | 'finished'
  /** Visual style variant */
  variant?: 'default' | 'featured' | 'compact'
  /** Function called when join button is clicked */
  onJoin?: () => void
  /** Function called when view button is clicked */
  onView?: () => void
  /** Whether the card is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
  /** Time remaining for the game */
  timeRemaining?: string
  /** Whether the game can be joined */
  isJoinable?: boolean
  /** Unique game identifier */
  gameId?: string
}

/**
 * A card component for displaying game information and actions
 * 
 * @param props - The game card props
 * @returns A styled game card element
 */
export const GameCard: React.FC<GameCardProps> = ({
  title,
  description,
  playerCount,
  maxPlayers,
  entryFee,
  status,
  onJoin,
  onView,
  isJoinable = true,
  gameId,
  disabled = false,
  timeRemaining,
  variant = 'default',
  className = '',
}) => {
  const getCardStyles = () => {
    const baseStyles = {
      background: SomniaColors.surface,
      borderRadius: SomniaTheme.borderRadius.lg,
      padding: SomniaTheme.spacing.lg,
      boxShadow: SomniaTheme.shadow.md,
      border: '1px solid',
      borderColor: SomniaColors.border,
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      fontFamily: SomniaTheme.fonts.inter,
    }

    const variantStyles = {
      default: {
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: SomniaTheme.shadow.lg,
          borderColor: SomniaColors.brandPrimary,
        },
      },
      featured: {
        background: `linear-gradient(135deg, ${SomniaColors.surface} 0%, ${SomniaColors.backgroundSecondary} 100%)`,
        border: `2px solid ${SomniaColors.brandPrimary}`,
        boxShadow: SomniaTheme.shadow.soft,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: SomniaColors.primaryGradient,
        },
      },
      compact: {
        padding: SomniaTheme.spacing.md,
      },
    }

    return {
      ...baseStyles,
      ...variantStyles[variant],
    }
  }

  const getStatusStyles = (status: string) => {
    const statusColors = {
      waiting: {
        background: `${SomniaColors.warning}20`,
        color: SomniaColors.warning,
        border: `1px solid ${SomniaColors.warning}40`,
      },
      active: {
        background: `${SomniaColors.success}20`,
        color: SomniaColors.success,
        border: `1px solid ${SomniaColors.success}40`,
      },
      finished: {
        background: `${SomniaColors.foregroundTertiary}20`,
        color: SomniaColors.foregroundTertiary,
        border: `1px solid ${SomniaColors.foregroundTertiary}40`,
      },
    }

    return {
      padding: `${SomniaTheme.spacing.xs} ${SomniaTheme.spacing.sm}`,
      borderRadius: SomniaTheme.borderRadius.full,
      fontSize: SomniaTheme.fontSize.xs,
      fontWeight: SomniaTheme.fontWeight.medium,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      fontFamily: SomniaTheme.fonts.inter,
      ...statusColors[status as keyof typeof statusColors],
    }
  }

  const getButtonStyles = (isPrimary: boolean = false) => {
    return {
      padding: `${SomniaTheme.spacing.sm} ${SomniaTheme.spacing.md}`,
      borderRadius: SomniaTheme.borderRadius.md,
      border: 'none',
      fontSize: SomniaTheme.fontSize.sm,
      fontWeight: SomniaTheme.fontWeight.medium,
      fontFamily: SomniaTheme.fonts.inter,
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      background: isPrimary ? SomniaColors.primaryGradient : 'transparent',
      color: isPrimary ? SomniaColors.white : SomniaColors.brandPrimary,
      ...(isPrimary ? {} : { border: `1px solid ${SomniaColors.border}` }),
      '&:hover': {
        transform: 'translateY(-1px)',
        ...(isPrimary
          ? {
              background: `linear-gradient(135deg, ${SomniaColors.brandPrimary}E6 0%, ${SomniaColors.brandSecondary}E6 100%)`,
              boxShadow: SomniaTheme.shadow.soft,
            }
          : {
              background: SomniaColors.backgroundHover,
              borderColor: SomniaColors.brandPrimary,
            }
        ),
      },
    }
  }

  /**
   * Calculates the progress percentage based on current and max players
   */
  const getProgressPercentage = () => {
    if (!playerCount || !maxPlayers) return 0
    return Math.min((playerCount / maxPlayers) * 100, 100)
  }

  /**
   * Formats time remaining string for display
   */
  const formatTimeRemaining = (time: string) => {
    return time
  }

  return (
    <div style={getCardStyles()} className={className}>
      {/* Status Badge */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: SomniaTheme.spacing.md,
      }}>
        <div style={getStatusStyles(status || 'waiting')}>
          {status}
        </div>
        {gameId && (
          <div style={{
            fontSize: SomniaTheme.fontSize.xs,
            color: SomniaColors.foregroundTertiary,
            fontFamily: SomniaTheme.fonts.mono,
          }}>
            #{gameId}
          </div>
        )}
      </div>

      {/* Title and Description */}
      <div style={{ marginBottom: SomniaTheme.spacing.md }}>
        <h3 style={{
          margin: 0,
          fontSize: variant === 'compact' ? SomniaTheme.fontSize.base : SomniaTheme.fontSize.lg,
          fontWeight: SomniaTheme.fontWeight.semibold,
          fontFamily: SomniaTheme.fonts.geist,
          color: SomniaColors.foreground,
          lineHeight: SomniaTheme.lineHeight.tight,
          marginBottom: description ? SomniaTheme.spacing.xs : 0,
        }}>
          {title}
        </h3>
        {description && (
          <p style={{
            margin: 0,
            fontSize: SomniaTheme.fontSize.sm,
            fontFamily: SomniaTheme.fonts.inter,
            color: SomniaColors.foregroundSecondary,
            lineHeight: SomniaTheme.lineHeight.normal,
          }}>
            {description}
          </p>
        )}
      </div>

      {/* Player Count and Progress */}
      <div style={{ marginBottom: SomniaTheme.spacing.md }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SomniaTheme.spacing.xs,
        }}>
          <span style={{
            fontSize: SomniaTheme.fontSize.sm,
            color: SomniaColors.foregroundTertiary,
            fontFamily: SomniaTheme.fonts.inter,
          }}>
            Players
          </span>
          <span style={{
            fontSize: SomniaTheme.fontSize.sm,
            fontWeight: SomniaTheme.fontWeight.semibold,
            color: SomniaColors.foreground,
            fontFamily: SomniaTheme.fonts.inter,
          }}>
            {playerCount || 0}/{maxPlayers || 0}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          background: SomniaColors.backgroundTertiary,
          borderRadius: SomniaTheme.borderRadius.full,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${getProgressPercentage()}%`,
            height: '100%',
            background: SomniaColors.primaryGradient,
            transition: 'width 0.3s ease-in-out',
          }} />
        </div>
      </div>

      {/* Entry Fee and Time */}
      {(entryFee || timeRemaining) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: SomniaTheme.spacing.md,
        }}>
          {entryFee && (
            <div>
              <div style={{
                fontSize: SomniaTheme.fontSize.xs,
                color: SomniaColors.foregroundTertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Entry Fee
              </div>
              <div style={{
                fontSize: SomniaTheme.fontSize.sm,
                fontWeight: SomniaTheme.fontWeight.semibold,
                color: SomniaColors.gray[900],
              }}>
                {entryFee} STT
              </div>
            </div>
          )}
          {timeRemaining && (
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: SomniaTheme.fontSize.xs,
                color: SomniaColors.foregroundTertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Time Left
              </div>
              <div style={{
                fontSize: SomniaTheme.fontSize.sm,
                fontWeight: SomniaTheme.fontWeight.semibold,
                color: SomniaColors.brandPrimary,
              }}>
                {timeRemaining ? formatTimeRemaining(timeRemaining) : 'No time limit'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: SomniaTheme.spacing.sm,
        marginTop: 'auto',
      }}>
        {onView && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView()
            }}
            style={getButtonStyles(false)}
          >
            View Details
          </button>
        )}
        {onJoin && isJoinable && status === 'waiting' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onJoin()
            }}
            style={getButtonStyles(true)}
          >
            Join Game
          </button>
        )}
      </div>
    </div>
  )
}