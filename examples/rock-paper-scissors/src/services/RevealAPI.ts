import { RPSMove } from '../types/rockPaperScissors'
import type { Address } from 'viem'

interface RevealRequest {
  sessionId: string
  playerAddress: Address
  move: RPSMove
  nonce: string
}

/**
 * API client for automatic reveal service
 * This would communicate with your backend that uses AutoRevealService
 */
export class RevealAPI {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  /**
   * Submit move data to backend for automatic reveal
   * Backend will use service wallet to reveal without user signature
   */
  async submitForAutoReveal(request: RevealRequest): Promise<{ transactionHash: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Failed to submit reveal: ${error}`)
    }
  }

  /**
   * Check if a reveal has been processed
   */
  async getRevealStatus(sessionId: string, playerAddress: Address): Promise<{
    revealed: boolean
    transactionHash?: string
    error?: string
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reveal/status?sessionId=${sessionId}&playerAddress=${playerAddress}`
      )

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Failed to check reveal status: ${error}`)
    }
  }
}

// Usage in your React hook:
/*
const revealAPI = new RevealAPI()

const revealMove = useCallback(async () => {
  try {
    setError(null)
    
    const storedMove = (window as any).gameMove
    const storedNonce = (window as any).gameNonce
    const playerAddress = sdk.wallet.getCurrentAccount()
    
    if (!storedMove || !storedNonce || !playerAddress) {
      throw new Error('Move data not found')
    }
    
    // Submit to backend for automatic reveal
    const result = await revealAPI.submitForAutoReveal({
      sessionId: currentSession!,
      playerAddress,
      move: storedMove,
      nonce: storedNonce.toString()
    })
    
    console.log('Reveal submitted:', result.transactionHash)
    
    // Check game result after a short delay
    setTimeout(() => {
      checkGameResult()
    }, 3000)
    
  } catch (err) {
    setError(parseGameError(err))
  }
}, [sdk, currentSession, checkGameResult])
*/