import { useState, useEffect } from 'react'
import { 
  SomniaGameSDK, 
  SomniaButton,
  SomniaColors,
  SomniaTheme
} from '@somniaforge/sdk'
import { RPSMove } from './types/rockPaperScissors'
import { detectAvailableWallets, switchToSomniaNetwork, addSomniaNetwork } from './utils/walletDetection'
import { useRockPaperScissors } from './hooks/useRockPaperScissors'
import { PlayerStatus } from './components/PlayerStatus'
import { getActionText } from './utils/errorHandler'

type Move = 'rock' | 'paper' | 'scissors' | null
type ConnectionState = 'disconnected' | 'connecting' | 'connected'

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  isMetaMask?: boolean
  isBraveWallet?: boolean
  isPhantom?: boolean
}

interface WalletInfo {
  name: string
  provider: EthereumProvider
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: SomniaColors.white,
    borderRadius: SomniaTheme.borderRadius.xl,
    padding: SomniaTheme.spacing.lg,
    boxShadow: SomniaTheme.shadow.md,
    border: `1px solid ${SomniaColors.gray[200]}`,
  }}>
    {children}
  </div>
)

function App() {
  const [sdk, setSdk] = useState<SomniaGameSDK | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [account, setAccount] = useState<string>('')
  const [balance, setBalance] = useState<string>('0')
  const [selectedMove, setSelectedMove] = useState<Move>(null)
  const [error, setError] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [sessionToJoin, setSessionToJoin] = useState<string>('')
  const rpsGame = useRockPaperScissors(sdk)

  // Update balance when wallet connects
  useEffect(() => {
    if (connectionState === 'connected' && account && rpsGame.actions.updateUserBalance) {
      rpsGame.actions.updateUserBalance()
    }
  }, [connectionState, account, rpsGame.actions])

  useEffect(() => {
    const initSDK = async () => {
      try {
        const gameSDK = new SomniaGameSDK()
        setSdk(gameSDK)
      } catch (err) {
        setError(`Failed to initialize SDK: ${err}`)
      }
    }
    initSDK()
  }, [])
  const handleWalletConnect = async () => {
    if (!sdk) return
    
    setIsConnecting(true)
    setError('')
    
    try {
      const wallets = await detectAvailableWallets() as WalletInfo[]
      
      const bestWallet = wallets.find(w => 
        w.name.toLowerCase().includes('metamask') && !w.provider.isBraveWallet
      ) || wallets.find(w => 
        w.provider.isMetaMask && !w.provider.isBraveWallet && !w.provider.isPhantom
      ) || wallets[0]
      
      if (!bestWallet) {
        throw new Error('No compatible wallet found. Please install MetaMask.')
      }
      
      const provider: EthereumProvider = bestWallet.provider
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      }) as string[]

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const account = accounts[0]
      const chainId = await provider.request({
        method: 'eth_chainId',
      }) as string

      const chainIdNumber = parseInt(chainId, 16)
      
      if (chainIdNumber !== 50312) {
        try {
          await switchToSomniaNetwork(provider as EthereumProvider)
        } catch (switchError: unknown) {
          if ((switchError as { code: number }).code === 4902) {
            await addSomniaNetwork(provider as EthereumProvider)
            await switchToSomniaNetwork(provider as EthereumProvider)
          } else {
            throw switchError
          }
        }
      }
      
      const result = await sdk.initializeWithProvider(provider, account, 50312)
      setAccount(result.account)
      setConnectionState('connected')
      
      const balanceResponse = await provider.request({
        method: 'eth_getBalance',
        params: [account, 'latest'],
      }) as string
      
      const balanceWei = parseInt(balanceResponse, 16)
      const balanceEth = (balanceWei / 1e18).toFixed(4)
      setBalance(balanceEth)
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Connection failed: ${message}`)
      setConnectionState('disconnected')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    if (sdk) {
      sdk.disconnect()
    }
    setAccount('')
    setBalance('0')
    setConnectionState('disconnected')
    setError('')
    rpsGame.actions.resetGame()
  }

  const makeMove = async (move: Move) => {
    if (!move || !sdk) return
    
    setSelectedMove(move)
    setError('')
    
    try {
      await rpsGame.actions.commitMove(move)
    } catch (err) {
      setError(`Failed to commit move: ${err}`)
    }
  }

  const handleRevealMove = async () => {
    try {
      await rpsGame.actions.revealMove()
    } catch (err) {
      setError(`Failed to reveal move: ${err}`)
    }
  }

  const handleForceResolve = async () => {
    try {
      await rpsGame.actions.forceResolveGame()
    } catch (err) {
      setError(`Failed to force resolve: ${err}`)
    }
  }

  const handleNewGame = () => {
    setSelectedMove(null)
    setError('')
    rpsGame.actions.resetGame()
  }

  const getMoveEmoji = (move: Move | RPSMove): string => {
    if (typeof move === 'number') {
      switch (move) {
        case RPSMove.Rock: return '🪨'
        case RPSMove.Paper: return '📄'
        case RPSMove.Scissors: return '✂️'
        default: return '❓'
      }
    }
    
    switch (move) {
      case 'rock': return '🪨'
      case 'paper': return '📄'
      case 'scissors': return '✂️'
      default: return '❓'
    }
  }

  const getGameResultText = (): string => {
    if (!rpsGame.gameResult || !rpsGame.gameResult.players.length) return ''
    
    const currentAccount = account.toLowerCase()
    const winner = rpsGame.gameResult.winner.toLowerCase()
    const isDraw = rpsGame.gameResult.isDraw
    
    if (isDraw) return "It's a tie! 🤝"
    if (winner === currentAccount) return 'You win! 🎉'
    if (winner === '0x0000000000000000000000000000000000000000') return 'Game cancelled ⚠️'
    return 'You lose! 😢'
  }

  const isEligibleForWithdraw = (): boolean => {
    if (!rpsGame.gameResult || !account) return false
    
    const currentAccount = account.toLowerCase()
    const winner = rpsGame.gameResult.winner.toLowerCase()
    const isDraw = rpsGame.gameResult.isDraw
    const hasBalance = rpsGame.userBalance > 0n
    
    // Can withdraw if: (won the game OR it's a draw) AND has balance
    const isWinnerOrDraw = (winner === currentAccount) || isDraw
    return isWinnerOrDraw && hasBalance
  }

  const getWithdrawButtonText = (): string => {
    if (!rpsGame.gameResult) return '💰 Withdraw'
    
    if (rpsGame.isTransactionPending) return '⏳ Withdrawing...'
    
    const isDraw = rpsGame.gameResult.isDraw
    const balanceETH = Number(rpsGame.userBalance) / 1e18
    
    if (isDraw) {
      return `💰 Withdraw Entry Fee (${balanceETH.toFixed(4)} STT)`
    } else {
      return `💰 Withdraw Winnings (${balanceETH.toFixed(4)} STT)`
    }
  }
  const ErrorDisplay = () => {
    if (!error && !rpsGame.error) return null
    
    const gameError = rpsGame.error
    const displayError = error || (gameError ? gameError.message : '')
    const actionText = gameError ? getActionText(gameError.action) : 'OK'
    
    return (
      <div style={{
        background: '#FEE2E2',
        border: '1px solid #FECACA',
        color: '#DC2626',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
      }}>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          marginBottom: '8px' 
        }}>
          ⚠️ {gameError?.title || 'Error'}
        </div>
        <div style={{ 
          fontSize: '14px', 
          marginBottom: '12px' 
        }}>
          {displayError}
        </div>
        {gameError && (
          <button
            onClick={() => {
              if (gameError.action === 'retry') {
                setError('')
                rpsGame.actions.resetGame()
              } else if (gameError.action === 'connect') {
                handleWalletConnect()
              } else {
                setError('')
              }
            }}
            style={{
              background: '#DC2626',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {actionText}
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${SomniaColors.somniaViolet}20, ${SomniaColors.somniaViolet}10)`,
      padding: '20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            color: SomniaColors.somniaViolet,
            margin: '0 0 16px 0',
            fontWeight: 'bold'
          }}>
            🪨📄✂️ Rock Paper Scissors
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: SomniaColors.gray[600],
            margin: 0
          }}>
            Powered by SomniaForge SDK • Real-time Web3 Gaming
          </p>
        </div>

        <ErrorDisplay />
        {connectionState === 'disconnected' && (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔗</div>
              <h2 style={{ color: SomniaColors.gray[800], marginBottom: '20px' }}>
                Connect Your Wallet
              </h2>
              <p style={{ color: SomniaColors.gray[600], marginBottom: '30px' }}>
                Connect your wallet to start playing Rock Paper Scissors on Somnia Network
              </p>
              <SomniaButton 
                onClick={handleWalletConnect}
                disabled={isConnecting}
                size="lg"
              >
                {isConnecting ? '🔄 Connecting...' : '🔗 Connect Wallet'}
              </SomniaButton>
            </div>
          </Card>
        )}

        {connectionState === 'connected' && (
          <>
            <div style={{
              background: SomniaColors.gray[50],
              borderRadius: SomniaTheme.borderRadius.lg,
              padding: SomniaTheme.spacing.lg,
              marginBottom: '30px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ color: SomniaColors.gray[600], fontSize: '0.9rem' }}>
                  Connected Account
                </div>
                <div style={{ 
                  color: SomniaColors.gray[900], 
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
                <div style={{ color: SomniaColors.gray[600], fontSize: '0.8rem' }}>
                  Balance: {balance} STT
                </div>
              </div>
              <SomniaButton onClick={handleDisconnect} variant="secondary">
                Disconnect
              </SomniaButton>
            </div>
            {rpsGame.gameState === 'idle' && (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎮</div>
                  <h2 style={{ color: SomniaColors.gray[800], marginBottom: '30px' }}>
                    Ready to Play
                  </h2>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '20px', 
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <SomniaButton 
                      onClick={() => rpsGame.actions.createGame()}
                      disabled={rpsGame.isTransactionPending}
                    >
                      {rpsGame.isTransactionPending ? '⏳ Creating...' : '🆕 Create New Game'}
                    </SomniaButton>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Session ID"
                        value={sessionToJoin}
                        onChange={(e) => setSessionToJoin(e.target.value)}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          border: `1px solid ${SomniaColors.gray[300]}`,
                          minWidth: '120px'
                        }}
                      />
                      <SomniaButton 
                        onClick={() => rpsGame.actions.joinGame(sessionToJoin)}
                        disabled={!sessionToJoin.trim() || rpsGame.isTransactionPending}
                        variant="secondary"
                      >
                        {rpsGame.isTransactionPending ? '⏳ Joining...' : '🚪 Join Game'}
                      </SomniaButton>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {rpsGame.gameState === 'creating' && (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
                  <h2>Creating Game...</h2>
                </div>
              </Card>
            )}

            {rpsGame.gameState === 'waiting' && (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
                  <h2>Waiting for Opponent</h2>
                  <p>Session ID: {rpsGame.currentSession}</p>
                  <p>Share this ID with your opponent to let them join!</p>
                </div>
              </Card>
            )}

            {rpsGame.gameState === 'committing' && (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <h2 style={{ marginBottom: '30px' }}>Choose Your Move</h2>
                  <div style={{ 
                    display: 'flex', 
                    gap: '20px', 
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    {(['rock', 'paper', 'scissors'] as const).map(move => (
                      <SomniaButton
                        key={move}
                        onClick={() => makeMove(move)}
                        disabled={rpsGame.isTransactionPending}
                        size="lg"
                      >
                        <div style={{ fontSize: '2rem' }}>{getMoveEmoji(move)}</div>
                        <div style={{ fontSize: '1rem', textTransform: 'capitalize' }}>
                          {move}
                        </div>
                      </SomniaButton>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {rpsGame.gameState === 'revealing' && (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <h2 style={{ marginBottom: '20px' }}>Reveal Phase</h2>
                  
                  
                  {selectedMove && (
                    <div style={{ marginBottom: '30px' }}>
                      <p>Your move: {getMoveEmoji(selectedMove)} {selectedMove?.toUpperCase()}</p>
                    </div>
                  )}
                  
                  
                  <SomniaButton 
                    onClick={handleRevealMove}
                    disabled={rpsGame.isTransactionPending || rpsGame.hasRevealed}
                  >
                    {rpsGame.hasRevealed ? '✅ Move Revealed' : 
                     rpsGame.isTransactionPending ? '⏳ Revealing...' : '🎭 Reveal Move'}
                  </SomniaButton>
                  
                  {rpsGame.revealDeadline > 0 && Date.now() / 1000 > rpsGame.revealDeadline && (
                    <div style={{ marginTop: '20px' }}>
                      <SomniaButton 
                        onClick={handleForceResolve} 
                        disabled={rpsGame.isTransactionPending}
                        variant="secondary"
                      >
                        {rpsGame.isTransactionPending ? '⏳ Resolving...' : '⚡ Force Resolve'}
                      </SomniaButton>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {rpsGame.gameState === 'finished' && rpsGame.gameResult && rpsGame.gameResult.players.length > 0 && (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
                    {rpsGame.gameResult.isDraw ? '🤝' : 
                     rpsGame.gameResult.winner.toLowerCase() === account.toLowerCase() ? '🎉' : '😢'}
                  </div>
                  
                  <h2 style={{ marginBottom: '20px' }}>
                    {getGameResultText()}
                  </h2>
                  
                  <div style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '20px' }}>
                      {(() => {
                        const currentAccountLower = account.toLowerCase()
                        const players = rpsGame.gameResult.players
                        const moves = rpsGame.gameResult.moves
                        
                        // Find current player's index
                        const currentPlayerIndex = players.findIndex(p => p.toLowerCase() === currentAccountLower)
                        const opponentIndex = currentPlayerIndex === 0 ? 1 : 0
                        
                        // Get moves, checking for valid indices and non-zero moves
                        const yourMove = (currentPlayerIndex !== -1 && moves[currentPlayerIndex] !== undefined) 
                          ? moves[currentPlayerIndex] : RPSMove.None
                        const opponentMove = (moves[opponentIndex] !== undefined) 
                          ? moves[opponentIndex] : RPSMove.None
                        
                        return (
                          <>
                            <div>
                              <div style={{ fontSize: '0.9rem', color: SomniaColors.gray[600] }}>You</div>
                              <div style={{ fontSize: '3rem' }}>
                                {yourMove !== RPSMove.None ? getMoveEmoji(yourMove) : '❓'}
                              </div>
                            </div>
                            <div style={{ fontSize: '2rem', alignSelf: 'center' }}>VS</div>
                            <div>
                              <div style={{ fontSize: '0.9rem', color: SomniaColors.gray[600] }}>Opponent</div>
                              <div style={{ fontSize: '3rem' }}>
                                {opponentMove !== RPSMove.None ? getMoveEmoji(opponentMove) : '❓'}
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                    
                    <p style={{ color: SomniaColors.gray[600] }}>
                      Prize: {Number(rpsGame.gameResult.prizeAmount) / 1e18} STT
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <SomniaButton onClick={handleNewGame}>
                      🔄 Play Again
                    </SomniaButton>
                    
                    {isEligibleForWithdraw() && (
                      <SomniaButton 
                        onClick={rpsGame.actions.withdraw} 
                        disabled={rpsGame.isTransactionPending}
                        variant="primary"
                      >
                        {getWithdrawButtonText()}
                      </SomniaButton>
                    )}
                    
                    {/* Show helpful message if user expects to withdraw but can't */}
                    {rpsGame.gameResult && !isEligibleForWithdraw() && (
                      rpsGame.gameResult.winner.toLowerCase() === account.toLowerCase() || rpsGame.gameResult.isDraw
                    ) && rpsGame.userBalance === 0n && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        border: '1px solid rgba(255, 193, 7, 0.3)',
                        borderRadius: '8px',
                        color: '#856404',
                        fontSize: '14px',
                        textAlign: 'center',
                        maxWidth: '300px'
                      }}>
                        💡 No balance available to withdraw. Funds may have been withdrawn already.
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {rpsGame.gameState !== 'idle' && rpsGame.gameState !== 'creating' && rpsGame.currentSession && (
              <div style={{ marginTop: '30px' }}>
                <h3 style={{ marginBottom: '15px', color: SomniaColors.gray[800] }}>
                  Game Status
                </h3>
                <div style={{ display: 'grid', gap: '15px' }}>
                  <PlayerStatus
                    playerAddress={account}
                    isConnected={true}
                    hasCommittedMove={rpsGame.gameState === 'revealing' || rpsGame.gameState === 'finished'}
                    hasRevealedMove={rpsGame.gameState === 'finished'}
                    isCurrentPlayer={true}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App