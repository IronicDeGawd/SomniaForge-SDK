import { useState, useEffect, useCallback } from 'react'
import { SomniaGameSDK } from '@somniaforge/sdk'
import { parseEther } from 'viem'
import { RockPaperScissorsManager } from '../managers/RockPaperScissorsManager'
import { RPSMove } from '../types/rockPaperScissors'
import type { RPSGameResult, GameState } from '../types/rockPaperScissors'

export function useRockPaperScissors(sdk: SomniaGameSDK | null) {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [players, setPlayers] = useState<string[]>([])
  const [gameResult, setGameResult] = useState<RPSGameResult | null>(null)
  const [error, setError] = useState<string>('')
  const [revealDeadline, setRevealDeadline] = useState<number>(0)
  const [playerMoves, setPlayerMoves] = useState<Map<string, { committed: boolean, revealed: boolean }>>(new Map())
  
  const [rpsManager] = useState(() => new RockPaperScissorsManager())

  useEffect(() => {
    if (sdk && sdk.wallet.isConnected()) {
      const walletClient = sdk.wallet.getWalletClient()
      if (walletClient) {
        rpsManager.connectWallet(walletClient)
      }
    }
  }, [sdk, rpsManager])

  const createGame = useCallback(async (entryFeeETH: string = '0.01') => {
    if (!sdk) return
    
    try {
      setGameState('creating')
      setError('')
      
      const entryFee = parseEther(entryFeeETH)
      const sessionId = await rpsManager.createRPSGame(entryFee)
      setCurrentSession(sessionId.toString())
      setGameState('waiting')
    } catch (err) {
      setError(`Failed to create game: ${err}`)
      setGameState('idle')
    }
  }, [sdk, rpsManager])

  const joinGame = useCallback(async (sessionId: string, entryFeeETH: string = '0.01') => {
    if (!sdk) return
    
    try {
      setGameState('joining')
      setError('')
      
      const entryFee = parseEther(entryFeeETH)
      await rpsManager.joinRPSGame(BigInt(sessionId), entryFee)
      setCurrentSession(sessionId)
      setGameState('waiting')
    } catch (err) {
      setError(`Failed to join game: ${err}`)
      setGameState('idle')
    }
  }, [sdk, rpsManager])

  const checkGameResult = useCallback(async () => {
    if (!sdk || !currentSession) return
    
    try {
      const result = await rpsManager.getGameResult(BigInt(currentSession))
      setGameResult(result)
      setGameState('finished')
    } catch (err) {
      // Game might not be finished yet
      console.log('Game not finished yet or error getting result:', err)
    }
  }, [sdk, currentSession, rpsManager])

  const commitMove = useCallback(async (move: 'rock' | 'paper' | 'scissors', nonce?: bigint) => {
    if (!sdk || !currentSession) return
    
    try {
      setError('')
      setGameState('committing')
      
      const account = sdk.wallet.getCurrentAccount()
      if (!account) throw new Error('No account connected')
      
      // Convert string move to RPSMove enum
      const rpsMove = move === 'rock' ? RPSMove.Rock : 
                     move === 'paper' ? RPSMove.Paper : RPSMove.Scissors
      
      // Generate random nonce if not provided
      const moveNonce = nonce || BigInt(Math.floor(Math.random() * 1000000))
      
      // Create move hash using the manager's static method
      const moveHash = RockPaperScissorsManager.createMoveHash(account, rpsMove, moveNonce)
      
      await rpsManager.commitMove(BigInt(currentSession), moveHash)
      
      // Store nonce for reveal phase (in a real app, this should be stored securely)
      ;(window as unknown as { gameNonce: bigint }).gameNonce = moveNonce
      ;(window as unknown as { gameMove: RPSMove }).gameMove = rpsMove
      
      setGameState('revealing')
    } catch (err) {
      setError(`Failed to commit move: ${err}`)
      setGameState('waiting')
    }
  }, [sdk, currentSession])

  const revealMove = useCallback(async () => {
    if (!sdk || !currentSession) return
    
    try {
      setError('')
      
      // Retrieve stored move and nonce
      const storedMove = (window as unknown as { gameMove: RPSMove }).gameMove
      const storedNonce = (window as unknown as { gameNonce: bigint }).gameNonce
      
      if (!storedMove || !storedNonce) {
        throw new Error('Move data not found. Please commit a move first.')
      }
      
      await rpsManager.revealMove(BigInt(currentSession), storedMove, storedNonce)
      
      // Game result will be updated via WebSocket events or polling
      setTimeout(() => {
        checkGameResult()
      }, 2000)
      
    } catch (err) {
      setError(`Failed to reveal move: ${err}`)
    }
  }, [sdk, currentSession, checkGameResult])

  const forceResolveGame = useCallback(async () => {
    if (!sdk || !currentSession) return
    
    try {
      setError('')
      await rpsManager.forceResolveGame(BigInt(currentSession))
      setTimeout(() => {
        checkGameResult()
      }, 2000)
    } catch (err) {
      setError(`Failed to force resolve game: ${err}`)
    }
  }, [sdk, currentSession, checkGameResult])

  const getRevealDeadline = useCallback(async () => {
    if (!sdk || !currentSession) return
    
    try {
      const deadline = await rpsManager.getRevealDeadline(BigInt(currentSession))
      setRevealDeadline(Number(deadline) * 1000) // Convert to milliseconds
    } catch (err) {
      console.log('Could not get reveal deadline:', err)
    }
  }, [sdk, currentSession])

  const withdraw = useCallback(async () => {
    if (!sdk) return
    
    try {
      setError('')
      await rpsManager.withdraw()
    } catch (err) {
      setError(`Failed to withdraw: ${err}`)
    }
  }, [sdk, rpsManager])

  const resetGame = useCallback(() => {
    setGameState('idle')
    setCurrentSession(null)
    setPlayers([])
    setGameResult(null)
    setError('')
    setRevealDeadline(0)
    setPlayerMoves(new Map())
    
    // Clear stored move data
    delete (window as unknown as { gameNonce?: bigint }).gameNonce
    delete (window as unknown as { gameMove?: RPSMove }).gameMove
  }, [])

  // Effect to set up WebSocket event listeners
  useEffect(() => {
    if (!sdk || !currentSession || gameState === 'idle') return

    let subscriptionId: string | null = null

    const setupEventListeners = async () => {
      try {
        const subId = await sdk.webSocket.subscribeToSessionEvents(
          BigInt(currentSession),
          (event) => {
            console.log('🎮 RPS Game Event:', event.eventName, event.args)
            
            switch (event.eventName) {
              case 'PlayerJoined': {
                const playerCount = event.args.playerCount as number
                if (playerCount === 2) {
                  setGameState('committing')
                }
                break
              }
                
              case 'MoveCommitted':
                console.log('Move committed by:', event.args.player)
                // Update player move status
                setPlayerMoves(prev => {
                  const newMap = new Map(prev)
                  newMap.set(event.args.player as string, { 
                    committed: true, 
                    revealed: prev.get(event.args.player as string)?.revealed || false 
                  })
                  return newMap
                })
                break
                
              case 'RevealPhaseStarted': {
                const deadline = Number(event.args.deadline) * 1000
                setRevealDeadline(deadline)
                setGameState('revealing')
                break
              }
                
              case 'MoveRevealed':
                console.log('Move revealed by:', event.args.player)
                setPlayerMoves(prev => {
                  const newMap = new Map(prev)
                  newMap.set(event.args.player as string, { 
                    committed: prev.get(event.args.player as string)?.committed || false,
                    revealed: true 
                  })
                  return newMap
                })
                break
                
              case 'GameResultDetermined':
                console.log('Game finished, winner:', event.args.winner)
                setTimeout(() => {
                  checkGameResult()
                }, 1000)
                break
            }
          }
        )
        subscriptionId = subId
      } catch (error) {
        console.error('Failed to setup RPS event listeners:', error)
      }
    }
    
    setupEventListeners()
    
    return () => {
      if (subscriptionId && sdk) {
        sdk.webSocket.unsubscribe(subscriptionId)
      }
    }
  }, [sdk, currentSession, gameState, checkGameResult])

  // Effect to poll reveal deadline when in revealing state
  useEffect(() => {
    if (gameState === 'revealing' && !revealDeadline) {
      getRevealDeadline()
    }
  }, [gameState, revealDeadline, getRevealDeadline])

  return {
    gameState,
    currentSession,
    players,
    gameResult,
    error,
    revealDeadline,
    playerMoves,
    actions: {
      createGame,
      joinGame,
      commitMove,
      revealMove,
      forceResolveGame,
      checkGameResult,
      withdraw,
      resetGame,
    }
  }
}