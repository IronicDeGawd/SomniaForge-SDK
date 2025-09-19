import React from 'react'
import { SomniaColors, SomniaTheme } from './styles'

/**
 * Props for the SomniaButton component
 */
export interface SomniaButtonProps {
  /** Button content */
  children: React.ReactNode
  /** Click handler function */
  onClick?: () => void
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the button is disabled */
  disabled?: boolean
  /** Whether the button is in loading state */
  loading?: boolean
  /** Optional icon to display */
  icon?: React.ReactNode
  /** Position of the icon relative to text */
  iconPosition?: 'left' | 'right'
  /** Whether button should take full width of container */
  fullWidth?: boolean
  /** Additional CSS classes */
  className?: string
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset'
}

/**
 * A customizable button component with Somnia branding and multiple variants
 * 
 * @param props - The button props
 * @returns A styled button element
 */
export const SomniaButton: React.FC<SomniaButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
}) => {
  const getButtonStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SomniaTheme.spacing.sm,
      fontFamily: SomniaTheme.fonts.inter,
      fontWeight: SomniaTheme.fontWeight.medium,
      border: 'none',
      borderRadius: SomniaTheme.borderRadius.md,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease-in-out',
      textDecoration: 'none',
      outline: 'none',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      width: fullWidth ? '100%' : 'auto',
      lineHeight: SomniaTheme.lineHeight.normal,
    }

    const sizeStyles = {
      sm: {
        padding: `${SomniaTheme.spacing.sm} ${SomniaTheme.spacing.md}`,
        fontSize: SomniaTheme.fontSize.sm,
        minHeight: '2.25rem',
      },
      md: {
        padding: `${SomniaTheme.spacing.md} ${SomniaTheme.spacing.lg}`,
        fontSize: SomniaTheme.fontSize.base,
        minHeight: '2.75rem',
      },
      lg: {
        padding: `${SomniaTheme.spacing.lg} ${SomniaTheme.spacing.xl}`,
        fontSize: SomniaTheme.fontSize.lg,
        minHeight: '3.25rem',
      },
    }

    const variantStyles = {
      primary: {
        background: disabled || loading
          ? SomniaColors.gray[300]
          : SomniaColors.primaryGradient,
        color: SomniaColors.white,
        border: '1px solid transparent',
        boxShadow: disabled || loading ? 'none' : SomniaTheme.shadow.soft,
        '&:hover': !disabled && !loading ? {
          background: `linear-gradient(135deg, ${SomniaColors.brandPrimary}E6 0%, ${SomniaColors.brandSecondary}E6 100%)`,
          transform: 'translateY(-1px)',
          boxShadow: SomniaTheme.shadow.glow,
        } : {},
        '&:active': !disabled && !loading ? {
          transform: 'translateY(0)',
          boxShadow: SomniaTheme.shadow.soft,
        } : {},
      },
      secondary: {
        background: disabled || loading
          ? SomniaColors.surfaceTertiary
          : SomniaColors.backgroundSecondary,
        color: disabled || loading
          ? SomniaColors.foregroundQuaternary
          : SomniaColors.foreground,
        border: `1px solid ${disabled || loading ? SomniaColors.gray[300] : SomniaColors.border}`,
        '&:hover': !disabled && !loading ? {
          background: SomniaColors.backgroundHover,
          borderColor: SomniaColors.borderSecondary,
          transform: 'translateY(-1px)',
        } : {},
      },
      outline: {
        background: 'transparent',
        color: disabled || loading
          ? SomniaColors.foregroundQuaternary
          : SomniaColors.brandPrimary,
        border: `1px solid ${disabled || loading ? SomniaColors.gray[300] : SomniaColors.brandPrimary}`,
        '&:hover': !disabled && !loading ? {
          background: SomniaColors.brandPrimary,
          color: SomniaColors.white,
          transform: 'translateY(-1px)',
          boxShadow: SomniaTheme.shadow.soft,
        } : {},
      },
      ghost: {
        background: 'transparent',
        color: disabled || loading
          ? SomniaColors.foregroundQuaternary
          : SomniaColors.brandPrimary,
        border: 'none',
        '&:hover': !disabled && !loading ? {
          background: `${SomniaColors.brandPrimary}10`,
          transform: 'translateY(-1px)',
        } : {},
      },
    }

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <LoadingSpinner />
          Loading...
        </>
      )
    }

    const iconElement = icon && (
      <span style={{ 
        display: 'flex', 
        alignItems: 'center',
        fontSize: size === 'sm' ? '1rem' : size === 'lg' ? '1.25rem' : '1.125rem',
      }}>
        {icon}
      </span>
    )

    if (iconPosition === 'right') {
      return (
        <>
          {children}
          {iconElement}
        </>
      )
    }

    return (
      <>
        {iconElement}
        {children}
      </>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={getButtonStyles()}
      className={className}
    >
      {renderContent()}
    </button>
  )
}

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      animation: 'spin 1s linear infinite',
    }}
  >
    <path d="M21 12a9 9 0 11-6.219-8.56" />
    <style>
      {`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}
    </style>
  </svg>
)