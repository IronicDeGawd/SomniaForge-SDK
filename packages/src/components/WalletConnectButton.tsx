import React, { useState } from 'react'
import { SomniaColors, SomniaTheme } from './styles'

/**
 * Props for the WalletConnectButton component
 */
export interface WalletConnectButtonProps {
  /** Function to handle wallet connection */
  onConnect?: () => Promise<void>
  /** Function to handle wallet disconnection */
  onDisconnect?: () => void
  /** Whether wallet is currently connected */
  isConnected?: boolean
  /** Whether connection is in progress */
  isConnecting?: boolean
  /** Connected wallet account address */
  account?: string
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the button is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
  /** Custom button content */
  children?: React.ReactNode
}

/**
 * A wallet connection button that handles connecting and disconnecting from Web3 wallets
 * 
 * @param props - The wallet connect button props
 * @returns A styled wallet connection button
 */
export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  onConnect,
  onDisconnect,
  isConnected = false,
  isConnecting = false,
  account,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  children
}) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (isConnected && onDisconnect) {
      onDisconnect()
      return
    }

    if (onConnect && !isConnecting && !isLoading) {
      setIsLoading(true)
      try {
        await onConnect()
      } catch (error) {
        console.error('Wallet connection failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const getButtonStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SomniaTheme.spacing.sm,
      fontWeight: SomniaTheme.fontWeight.semibold,
      borderRadius: SomniaTheme.borderRadius.lg,
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease-in-out',
      fontFamily: SomniaTheme.fonts.inter,
    }

    const sizeStyles = {
      sm: {
        padding: `${SomniaTheme.spacing.sm} ${SomniaTheme.spacing.md}`,
        fontSize: SomniaTheme.fontSize.sm,
        minHeight: '2.5rem',
      },
      md: {
        padding: `${SomniaTheme.spacing.md} ${SomniaTheme.spacing.lg}`,
        fontSize: SomniaTheme.fontSize.base,
        minHeight: '3rem',
      },
      lg: {
        padding: `${SomniaTheme.spacing.lg} ${SomniaTheme.spacing.xl}`,
        fontSize: SomniaTheme.fontSize.lg,
        minHeight: '3.5rem',
      },
    }

    const variantStyles = {
      primary: {
        background: disabled ? SomniaColors.gray[300] : SomniaColors.primaryGradient,
        color: SomniaColors.white,
        border: '1px solid transparent',
        boxShadow: disabled ? 'none' : SomniaTheme.shadow.soft,
        '&:hover': !disabled ? {
          background: `linear-gradient(135deg, ${SomniaColors.brandPrimary}E6 0%, ${SomniaColors.brandSecondary}E6 100%)`,
          transform: 'translateY(-1px)',
          boxShadow: SomniaTheme.shadow.glow,
        } : {},
        '&:active': !disabled ? {
          transform: 'translateY(0)',
          boxShadow: SomniaTheme.shadow.soft,
        } : {},
      },
      secondary: {
        background: disabled ? SomniaColors.surfaceTertiary : SomniaColors.backgroundSecondary,
        color: disabled ? SomniaColors.foregroundQuaternary : SomniaColors.foreground,
        border: `1px solid ${disabled ? SomniaColors.border : SomniaColors.border}`,
        '&:hover': !disabled ? {
          background: SomniaColors.backgroundHover,
          borderColor: SomniaColors.borderSecondary,
          transform: 'translateY(-1px)',
        } : {},
      },
      outline: {
        background: 'transparent',
        color: disabled ? SomniaColors.foregroundQuaternary : SomniaColors.brandPrimary,
        border: `1px solid ${disabled ? SomniaColors.border : SomniaColors.brandPrimary}`,
        '&:hover': !disabled ? {
          background: SomniaColors.brandPrimary,
          color: SomniaColors.white,
          transform: 'translateY(-1px)',
          boxShadow: SomniaTheme.shadow.soft,
        } : {},
      },
    }

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant],
    }
  }

  const formatAccount = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getButtonContent = () => {
    if (children) return children

    if (isConnecting || isLoading) {
      return (
        <>
          <LoadingSpinner />
          Connecting...
        </>
      )
    }

    if (isConnected && account) {
      return (
        <>
          <WalletIcon />
          {formatAccount(account)}
        </>
      )
    }

    return (
      <>
        <WalletIcon />
        Connect Wallet
      </>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isConnecting || isLoading}
      style={getButtonStyles()}
      className={className}
      type="button"
    >
      {getButtonContent()}
    </button>
  )
}

// Helper components
const WalletIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
  </svg>
)

const LoadingSpinner: React.FC = () => (
  <svg
    width="20"
    height="20"
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