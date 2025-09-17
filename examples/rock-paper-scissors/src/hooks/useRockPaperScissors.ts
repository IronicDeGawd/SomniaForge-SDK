import { useState, useEffect, useCallback, useRef } from 'react'
import { SomniaGameSDK } from '@somniaforge/sdk'
import { parseEther } from 'viem'
import { RockPaperScissorsManager } from '../managers/RockPaperScissorsManager'
import { RPSMove } from '../types/rockPaperScissors'
import type { RPSGameResult, GameState } from '../types/rockPaperScissors'
import { parseGameError } from '../utils/errorHandler'
import type { GameError } from '../utils/errorHandler'
import { ROCK_PAPER_SCISSORS_ABI, ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS } from '../constants/rockPaperScissorsAbi'

export function useRockPaperScissors(sdk: SomniaGameSDK | null) {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [gameResult, setGameResult] = useState<RPSGameResult | null>(null)
  const [error, setError] = useState<GameError | null>(null)
  const [revealDeadline, setRevealDeadline] = useState<number>(0)
  const [playerMoves, setPlayerMoves] = useState<Map<string, { committed: boolean, revealed: boolean }>>(new Map())
  const [isTransactionPending, setIsTransactionPending] = useState<boolean>(false)
  const [hasRevealed, setHasRevealed] = useState<boolean>(false)
  const [userBalance, setUserBalance] = useState<bigint>(0n)
  
  const [rpsManager] = useState(() => new RockPaperScissorsManager())
  const wsSubscriptionId = useRef<string | null>(null)

  useEffect(() => {
    const connectRPSManager = async () => {
      if (sdk && sdk.wallet.isConnected()) {
        const walletClient = sdk.wallet.getWalletClient()
        if (walletClient) {
          try {
            await rpsManager.connectWallet(walletClient)
          } catch {
            // RPS Manager wallet connection failed, not critical
          }
        }
      }
    }
    connectRPSManager()
  }, [sdk, rpsManager])

  useEffect(() => {
    return () => {
      if (wsSubscriptionId.current && sdk) {
        sdk.webSocket.unsubscribe(wsSubscriptionId.current)
      }
    }
  }, [sdk])

  const createGame = useCallback(async (entryFeeETH: string = '0.01') => {
    if (!sdk) {
      setError(parseGameError('SDK not available'))
      return
    }
    
    if (!sdk.wallet.isConnected()) {
      setError(parseGameError('Wallet not connected'))
      return
    }

    if (isTransactionPending) {
      return
    }
    
    try {
      setIsTransactionPending(true)
      setGameState('creating')
      setError(null)
      
      const walletClient = sdk.wallet.getWalletClient()
      if (walletClient) {
        await rpsManager.connectWallet(walletClient)
      }
      
      const entryFee = parseEther(entryFeeETH)
      const sessionId = await rpsManager.createRPSGame(entryFee)
      setCurrentSession(sessionId.toString())
      setGameState('waiting')
    } catch (err) {
      setError(parseGameError(err))
      setGameState('idle')
    } finally {
      setIsTransactionPending(false)
    }
  }, [sdk, rpsManager, isTransactionPending])

  const joinGame = useCallback(async (sessionId: string, entryFeeETH: string = '0.01') => {
    if (!sdk) return
    
    if (!sdk.wallet.isConnected()) {
      setError(parseGameError('Wallet not connected'))
      return
    }

    if (isTransactionPending) {
      return
    }
    
    try {
      setIsTransactionPending(true)
      setGameState('joining')
      setError(null)
      
      const walletClient = sdk.wallet.getWalletClient()
      if (walletClient) {
        await rpsManager.connectWallet(walletClient)
      }
      
      const entryFee = parseEther(entryFeeETH)
      await rpsManager.joinRPSGame(BigInt(sessionId), entryFee)
      setCurrentSession(sessionId)
      setGameState('waiting')
    } catch (err) {
      setError(parseGameError(err))
      setGameState('idle')
    } finally {
      setIsTransactionPending(false)
    }
  }, [sdk, rpsManager, isTransactionPending])

  const updateUserBalance = useCallback(async () => {
    if (!sdk) return
    
    try {
      const account = sdk.wallet.getCurrentAccount()
      if (account) {
        const balance = await rpsManager.getUserBalance(account)
        setUserBalance(balance)
      }
    } catch {
      // Balance check failed, default to 0
      setUserBalance(0n)
    }
  }, [sdk, rpsManager])

  const checkGameResult = useCallback(async () => {
    if (!sdk || !currentSession) return
    
    try {
      const result = await rpsManager.getGameResult(BigInt(currentSession))
      
      if (result && result.players.length > 0 && result.completedAt > 0n) {
        setGameResult(result)
        setGameState('finished')
        
        setTimeout(() => {
          updateUserBalance()
        }, 1000)
      }
    } catch {
      // Game result not available yet
    }
  }, [sdk, currentSession, rpsManager]) // eslint-disable-line react-hooks/exhaustive-deps

  const commitMove = useCallback(async (move: 'rock' | 'paper' | 'scissors', nonce?: bigint) => {
    if (!sdk || !currentSession) return

    if (isTransactionPending) {
      return
    }
    
    try {
      setIsTransactionPending(true)
      setError(null)
      setGameState('committing')
      
      const account = sdk.wallet.getCurrentAccount()
      if (!account) throw new Error('No account connected')
      
      const rpsMove = move === 'rock' ? RPSMove.Rock : 
                     move === 'paper' ? RPSMove.Paper : RPSMove.Scissors
      
      const moveNonce = nonce || BigInt(Math.floor(Math.random() * 1000000))
      const moveHash = RockPaperScissorsManager.createMoveHash(account, rpsMove, moveNonce)
      
      await rpsManager.commitMove(BigInt(currentSession), moveHash)
      
      ;(window as unknown as { gameNonce: bigint }).gameNonce = moveNonce
      ;(window as unknown as { gameMove: RPSMove }).gameMove = rpsMove
      
      
      setGameState('revealing')
      
      setTimeout(() => {
        updateUserBalance()
      }, 1000)
    } catch (err) {
      setError(parseGameError(err))
      setGameState('waiting')
    } finally {
      setIsTransactionPending(false)
    }
  }, [sdk, currentSession, isTransactionPending, rpsManager]) // eslint-disable-line react-hooks/exhaustive-deps

  const revealMove = useCallback(async () => {
    if (!sdk || !currentSession) return

    if (hasRevealed || isTransactionPending) {
      console.log('❌ Reveal blocked:', { hasRevealed, isTransactionPending })
      return
    }
    
    try {
      setIsTransactionPending(true)
      setError(null)
      
      const storedMove = (window as unknown as { gameMove: RPSMove }).gameMove
      const storedNonce = (window as unknown as { gameNonce: bigint }).gameNonce
      
      if (!storedMove || !storedNonce) {
        throw new Error('Move data not found. Please commit a move first.')
      }
      
      await rpsManager.revealMove(BigInt(currentSession), storedMove, storedNonce)
      setHasRevealed(true)

      setTimeout(() => {
        checkGameResult()
      }, 2000)

    } catch (err) {
      console.error('❌ Reveal transaction failed:', err);
      setHasRevealed(false) // Reset reveal state on failure
      setError(parseGameError(err))
    } finally {
      setIsTransactionPending(false)
    }
  }, [sdk, currentSession, checkGameResult, hasRevealed, isTransactionPending, rpsManager])

  const forceResolveGame = useCallback(async () => {
    if (!sdk || !currentSession) return

    if (isTransactionPending) {
      return
    }
    
    try {
      setIsTransactionPending(true)
      setError(null)
      await rpsManager.forceResolveGame(BigInt(currentSession))
      setTimeout(() => {
        checkGameResult()
      }, 2000)
    } catch (err) {
      setError(parseGameError(err))
    } finally {
      setIsTransactionPending(false)
    }
  }, [sdk, currentSession, checkGameResult, isTransactionPending, rpsManager])

  const withdraw = useCallback(async () => {
    if (!sdk) return

    if (isTransactionPending) {
      return
    }
    
    if (userBalance === 0n) {
      setError(parseGameError('No balance available to withdraw'))
      return
    }
    
    try {
      setIsTransactionPending(true)
      setError(null)
      await rpsManager.withdraw()
      
      setTimeout(() => {
        updateUserBalance()
      }, 2000)
    } catch (err) {
      setError(parseGameError(err))
    } finally {
      setIsTransactionPending(false)
    }
  }, [sdk, rpsManager, isTransactionPending, userBalance]) // eslint-disable-line react-hooks/exhaustive-deps

  const resetGame = useCallback(() => {
    if (wsSubscriptionId.current && sdk) {
      sdk.webSocket.unsubscribe(wsSubscriptionId.current)
      wsSubscriptionId.current = null
    }


    setGameState('idle')
    setCurrentSession(null)
    setGameResult(null)
    setError(null)
    setRevealDeadline(0)
    setPlayerMoves(new Map())
    setIsTransactionPending(false)
    setHasRevealed(false)
    setUserBalance(0n)
    
    delete (window as unknown as { gameNonce?: bigint }).gameNonce
    delete (window as unknown as { gameMove?: RPSMove }).gameMove
  }, [sdk])

  const resetRevealState = useCallback(() => {
    setHasRevealed(false)
    console.log('🔄 Reveal state reset')
    // Check for game results in case the game was resolved externally
    setTimeout(() => {
      checkGameResult()
    }, 500)
  }, [checkGameResult])

  useEffect(() => {
    if (!sdk || !currentSession || gameState === 'idle') return

    if (wsSubscriptionId.current) {
      return
    }

    const setupEventListeners = async () => {
      try {
        try {
          const isActive = await rpsManager.isSessionActive(BigInt(currentSession))
          if (isActive && gameState === 'waiting') {
            setGameState('committing')
          }
        } catch {
          // Session status check failed, continue
        }
        
        const subId = await sdk.webSocket.subscribeToRockPaperScissorsEvents(
          ROCK_PAPER_SCISSORS_CONTRACT_ADDRESS,
          ROCK_PAPER_SCISSORS_ABI,
          { sessionId: BigInt(currentSession) },
          (event) => {            
            switch (event.eventName) {
              case 'PlayerJoined': {
                const playerCount = event.args.playerCount as number
                if (playerCount === 2) {
                  setGameState('committing')
                }
                break
              }
              
              case 'SessionStarted':
                setGameState('committing')
                break
                
              case 'MoveCommitted': {
                const commitPlayer = event.args.player as string
                setPlayerMoves(prev => {
                  const updated = new Map(prev)
                  updated.set(commitPlayer.toLowerCase(), { committed: true, revealed: false })
                  return updated
                })
                break
              }
                
              case 'MoveRevealed': {
                const revealPlayer = event.args.player as string
                setPlayerMoves(prev => {
                  const updated = new Map(prev)
                  const existing = updated.get(revealPlayer.toLowerCase()) || { committed: false, revealed: false }
                  updated.set(revealPlayer.toLowerCase(), { ...existing, revealed: true })
                  return updated
                })
                break
              }
                
              case 'RevealPhaseStarted': {
                const deadline = event.args.deadline as bigint
                setRevealDeadline(Number(deadline))
                setGameState('revealing')
                break
              }
                
              case 'GameResultDetermined':
                checkGameResult()
                break
            }
          }
        )
        
        wsSubscriptionId.current = subId
        
      } catch (err) {
        console.error('Failed to set up WebSocket listeners:', err)
      }
    }

    setupEventListeners()

    return () => {
      if (wsSubscriptionId.current && sdk) {
        sdk.webSocket.unsubscribe(wsSubscriptionId.current)
        wsSubscriptionId.current = null
      }
    }
  }, [sdk, currentSession, gameState, checkGameResult, rpsManager])


  return {
    gameState,
    currentSession,
    gameResult,
    error,
    revealDeadline,
    playerMoves,
    isTransactionPending,
    hasRevealed,
    userBalance,
    actions: {
      createGame,
      joinGame,
      commitMove,
      revealMove,
      forceResolveGame,
      checkGameResult,
      withdraw,
      resetGame,
      resetRevealState,
      updateUserBalance,
    }
  }
}