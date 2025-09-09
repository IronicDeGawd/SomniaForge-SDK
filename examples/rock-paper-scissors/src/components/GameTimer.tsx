import { useState, useEffect } from 'react'
import { SomniaColors } from '@somniaforge/sdk'

interface GameTimerProps {
  deadline: number // timestamp in ms
  onExpired: () => void
}

export function GameTimer({ deadline, onExpired }: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, deadline - now)
      setTimeLeft(remaining)
      
      if (remaining === 0) {
        onExpired()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [deadline, onExpired])

  const minutes = Math.floor(timeLeft / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)

  return (
    <div style={{
      background: `${SomniaColors.somniaViolet}15`,
      padding: '1rem',
      borderRadius: '12px',
      textAlign: 'center',
      border: `2px solid ${SomniaColors.somniaViolet}30`
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: SomniaColors.somniaViolet }}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
      <div style={{ fontSize: '0.9rem', color: SomniaColors.gray[600] }}>
        Time to reveal moves
      </div>
    </div>
  )
}