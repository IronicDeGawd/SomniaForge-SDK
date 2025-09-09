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
      fontFamily: 'inherit',
      fontWeight: SomniaTheme.fontWeight.semibold,
      border: 'none',
      borderRadius: SomniaTheme.borderRadius.lg,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease-in-out',
      textDecoration: 'none',
      outline: 'none',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      width: fullWidth ? '100%' : 'auto',
    }

    const sizeStyles = {
      sm: {
        padding: `${SomniaTheme.spacing.sm} ${SomniaTheme.spacing.md}`,
        fontSize: SomniaTheme.fontSize.sm,
        minHeight: '2.25rem',
      },
      md: {
        padding: `${SomniaTheme.spacing.md} ${SomniaTheme.spacing.lg}`,
        fontSize: SomniaTheme.fontSize.md,
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
        background: disabled || loading ? SomniaColors.disabled : SomniaColors.primaryGradient,
        color: SomniaColors.white,
        boxShadow: disabled || loading ? 'none' : SomniaTheme.shadow.somnia,
        '&:hover': !disabled && !loading ? {
          background: SomniaColors.hover,
          transform: 'translateY(-1px)',
          boxShadow: '0 12px 30px rgba(173, 0, 255, 0.3), 0 6px 15px rgba(51, 59, 255, 0.2)',
        } : {},
        '&:active': !disabled && !loading ? {
          background: SomniaColors.active,
          transform: 'translateY(0)',
        } : {},
      },
      secondary: {
        background: disabled || loading ? SomniaColors.gray[200] : SomniaColors.gray[100],
        color: disabled || loading ? SomniaColors.gray[400] : SomniaColors.gray[800],
        border: `1px solid ${disabled || loading ? SomniaColors.gray[300] : SomniaColors.gray[300]}`,
        '&:hover': !disabled && !loading ? {
          background: SomniaColors.gray[50],
          borderColor: SomniaColors.somniaViolet,
          color: SomniaColors.somniaViolet,
          transform: 'translateY(-1px)',
        } : {},
      },
      outline: {
        background: 'transparent',
        color: disabled || loading ? SomniaColors.gray[400] : SomniaColors.somniaViolet,
        border: `2px solid ${disabled || loading ? SomniaColors.gray[300] : SomniaColors.somniaViolet}`,
        '&:hover': !disabled && !loading ? {
          background: SomniaColors.primaryGradient,
          color: SomniaColors.white,
          transform: 'translateY(-1px)',
        } : {},
      },
      ghost: {
        background: 'transparent',
        color: disabled || loading ? SomniaColors.gray[400] : SomniaColors.somniaViolet,
        '&:hover': !disabled && !loading ? {
          background: `${SomniaColors.somniaViolet}10`,
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