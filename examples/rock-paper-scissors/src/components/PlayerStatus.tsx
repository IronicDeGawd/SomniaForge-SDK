import { SomniaColors, SomniaTheme } from '@somniaforge/sdk'

interface PlayerStatusProps {
  playerAddress: string
  isConnected: boolean
  hasCommittedMove: boolean
  hasRevealedMove: boolean
  isCurrentPlayer: boolean
}

export function PlayerStatus({ 
  playerAddress, 
  isConnected, 
  hasCommittedMove, 
  hasRevealedMove,
  isCurrentPlayer 
}: PlayerStatusProps) {
  const getStatusColor = () => {
    if (!isConnected) return SomniaColors.gray[400]
    if (hasRevealedMove) return '#10B981'
    if (hasCommittedMove) return SomniaColors.brandSecondary
    return SomniaColors.warning
  }

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected'
    if (hasRevealedMove) return 'Move Revealed'
    if (hasCommittedMove) return 'Move Committed'
    return 'Waiting for Move'
  }

  return (
    <div style={{
      background: isCurrentPlayer ? `${SomniaColors.brandSecondary}10` : SomniaColors.gray[50],
      border: `2px solid ${isCurrentPlayer ? SomniaColors.brandSecondary : SomniaColors.gray[200]}`,
      borderRadius: SomniaTheme.borderRadius.lg,
      padding: SomniaTheme.spacing.md,
      display: 'flex',
      alignItems: 'center',
      gap: SomniaTheme.spacing.sm,
    }}>
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: getStatusColor(),
      }} />
      <div>
        <div style={{ 
          fontWeight: isCurrentPlayer ? 'bold' : 'normal',
          color: SomniaColors.gray[900]
        }}>
          {isCurrentPlayer ? 'You' : `${playerAddress.slice(0, 6)}...${playerAddress.slice(-4)}`}
        </div>
        <div style={{ 
          fontSize: '0.8rem', 
          color: SomniaColors.gray[600] 
        }}>
          {getStatusText()}
        </div>
      </div>
    </div>
  )
}