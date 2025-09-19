import { useState, useEffect } from 'react'
import {
  SomniaGameSDK,
  SomniaButton,
  SomniaColors,
  SomniaTheme,
  WalletConnectButton,
  PlayerProfile
} from '@somniaforge/sdk'
import {
  Gamepad2,
  Mountain,
  FileText,
  Scissors,
  HelpCircle,
  Clock,
  Plus,
  DoorOpen,
  Handshake,
  Trophy,
  Frown,
  Zap,
  RotateCcw,
  CheckCircle,
  Eye,
  AlertTriangle,
  Siren
} from 'lucide-react'
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

const Card = ({ children, featured = false }: { children: React.ReactNode, featured?: boolean }) => (
  <div style={{
    background: SomniaColors.surface,
    borderRadius: SomniaTheme.borderRadius.lg,
    padding: SomniaTheme.spacing.lg,
    boxShadow: featured ? SomniaTheme.shadow.soft : SomniaTheme.shadow.md,
    border: featured ? `2px solid ${SomniaColors.brandPrimary}` : `1px solid ${SomniaColors.border}`,
    fontFamily: SomniaTheme.fonts.inter,
    ...(featured && {
      background: `linear-gradient(135deg, ${SomniaColors.surface} 0%, ${SomniaColors.backgroundSecondary} 100%)`,
    })
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
    if (!selectedMove || !rpsGame.actions.revealMove) return
    
    try {
      await rpsGame.actions.revealMove()
    } catch (err) {
      setError(`Failed to reveal move: ${err}`)
    }
  }

  const handleForceResolve = async () => {
    if (rpsGame.actions.forceResolveGame) {
      try {
        await rpsGame.actions.forceResolveGame()
      } catch (err) {
        setError(`Failed to force resolve: ${err}`)
      }
    }
  }

  const handleNewGame = () => {
    setSelectedMove(null)
    setSessionToJoin('')
    setError('')
    rpsGame.actions.resetGame()
  }

  const getMoveIcon = (move: Move | RPSMove, size: number = 24) => {
    if (typeof move === 'string') {
      switch (move) {
        case 'rock': return <Mountain size={size} style={{ color: SomniaColors.brandDeep }} />
        case 'paper': return <FileText size={size} style={{ color: SomniaColors.brandSecondary }} />
        case 'scissors': return <Scissors size={size} style={{ color: SomniaColors.brandAccent }} />
        default: return <HelpCircle size={size} style={{ color: SomniaColors.foregroundTertiary }} />
      }
    } else {
      switch (move) {
        case RPSMove.Rock: return <Mountain size={size} style={{ color: SomniaColors.brandDeep }} />
        case RPSMove.Paper: return <FileText size={size} style={{ color: SomniaColors.brandSecondary }} />
        case RPSMove.Scissors: return <Scissors size={size} style={{ color: SomniaColors.brandAccent }} />
        default: return <HelpCircle size={size} style={{ color: SomniaColors.foregroundTertiary }} />
      }
    }

    switch (move) {
      case 'rock': return <Mountain size={size} style={{ color: SomniaColors.brandDeep }} />
      case 'paper': return <FileText size={size} style={{ color: SomniaColors.brandSecondary }} />
      case 'scissors': return <Scissors size={size} style={{ color: SomniaColors.brandAccent }} />
      default: return <HelpCircle size={size} style={{ color: SomniaColors.foregroundTertiary }} />
    }
  }

  const getGameResultText = (): string => {
    if (!rpsGame.gameResult || !rpsGame.gameResult.players.length) return ''

    const currentAccount = account.toLowerCase()
    const winner = rpsGame.gameResult.winner.toLowerCase()
    const isDraw = rpsGame.gameResult.isDraw
    const prizeAmount = Number(rpsGame.gameResult.prizeAmount) / 1e18

    if (isDraw) return `It's a tie! Each player gets ${(prizeAmount/2).toFixed(4)} STT`
    if (winner === currentAccount) return `You win ${prizeAmount.toFixed(4)} STT!`
    if (winner === '0x0000000000000000000000000000000000000000') return 'Game cancelled'
    return 'You lose!'
  }

  const isEligibleForEmergencyWithdraw = (): boolean => {
    if (!account) return false
    const hasBalance = rpsGame.userBalance > 0n
    return hasBalance
  }

  const getEmergencyWithdrawButtonText = (): string => {
    if (rpsGame.isTransactionPending) return 'Withdrawing...'

    const balanceETH = Number(rpsGame.userBalance) / 1e18
    return `Emergency Withdraw (${balanceETH.toFixed(4)} STT)`
  }
  const ErrorDisplay = () => {
    if (!error && !rpsGame.error) return null

    const gameError = rpsGame.error
    const displayError = error || (gameError ? gameError.message : '')
    const actionText = gameError ? getActionText(gameError.action) : 'OK'

    return (
      <div style={{
        background: `${SomniaColors.error}15`,
        border: `1px solid ${SomniaColors.error}40`,
        color: SomniaColors.error,
        padding: SomniaTheme.spacing.md,
        borderRadius: SomniaTheme.borderRadius.lg,
        marginBottom: SomniaTheme.spacing.md,
        fontFamily: SomniaTheme.fonts.inter,
      }}>
        <div style={{
          fontSize: SomniaTheme.fontSize.base,
          fontWeight: SomniaTheme.fontWeight.semibold,
          marginBottom: SomniaTheme.spacing.xs,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SomniaTheme.spacing.xs }}>
            <AlertTriangle size={16} style={{ color: SomniaColors.error }} />
            {gameError?.title || 'Error'}
          </div>
        </div>
        <div style={{
          fontSize: SomniaTheme.fontSize.sm,
          marginBottom: SomniaTheme.spacing.sm,
        }}>
          {displayError}
        </div>
        {gameError && (
          <SomniaButton
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
            variant="outline"
            size="sm"
          >
            {actionText}
          </SomniaButton>
        )}
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${SomniaColors.brandPrimary}08 0%, ${SomniaColors.brandSecondary}05 100%)`,
      padding: SomniaTheme.spacing.lg,
      fontFamily: SomniaTheme.fonts.inter,
    }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: SomniaTheme.spacing['4xl'] }}>
          <h1 style={{
            fontFamily: SomniaTheme.fonts.geist,
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            background: SomniaColors.primaryGradient,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: SomniaTheme.spacing.md,
            fontWeight: SomniaTheme.fontWeight.bold,
            lineHeight: SomniaTheme.lineHeight.tight,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: SomniaTheme.spacing.sm }}>
              <span>Rock Paper Scissors</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SomniaTheme.spacing.sm }}>
                <Mountain size={32} style={{ color: SomniaColors.brandDeep }} />
                <FileText size={32} style={{ color: SomniaColors.brandSecondary }} />
                <Scissors size={32} style={{ color: SomniaColors.brandAccent }} />
              </div>
            </div>
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: SomniaColors.foregroundSecondary,
            lineHeight: SomniaTheme.lineHeight.relaxed,
          }}>
            Powered by <span style={{ color: SomniaColors.brandPrimary, fontWeight: SomniaTheme.fontWeight.semibold }}>SomniaForge SDK</span> • Real-time Web3 Gaming
          </p>
        </div>

        <ErrorDisplay />
        {connectionState === 'disconnected' && (
          <Card featured>
            <div style={{ textAlign: 'center', padding: SomniaTheme.spacing['3xl'] }}>
              <h2 style={{
                fontFamily: SomniaTheme.fonts.geist,
                color: SomniaColors.foreground,
                marginBottom: SomniaTheme.spacing.lg,
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: SomniaTheme.fontWeight.semibold,
              }}>
                Connect Your Wallet
              </h2>
              <p style={{
                color: SomniaColors.foregroundSecondary,
                marginBottom: SomniaTheme.spacing['2xl'],
                fontSize: SomniaTheme.fontSize.base,
                lineHeight: SomniaTheme.lineHeight.relaxed,
                maxWidth: '400px',
                margin: `0 auto ${SomniaTheme.spacing['2xl']} auto`,
              }}>
                Connect your wallet to start playing Rock Paper Scissors on the Somnia Network
              </p>
              <WalletConnectButton
                onConnect={handleWalletConnect}
                isConnecting={isConnecting}
                variant="primary"
                size="lg"
              />
            </div>
          </Card>
        )}

        {connectionState === 'connected' && (
          <>
            <div style={{
              background: SomniaColors.surfaceSecondary,
              borderRadius: SomniaTheme.borderRadius.lg,
              padding: SomniaTheme.spacing.lg,
              marginBottom: SomniaTheme.spacing['2xl'],
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: `1px solid ${SomniaColors.border}`,
            }}>
              <PlayerProfile
                playerName={`${account.slice(0, 6)}...${account.slice(-4)}`}
                playerAddress={account}
                variant="inline"
                showStats={false}
                showAvatar={false}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: SomniaTheme.spacing.xs }}>
                <div style={{
                  fontSize: SomniaTheme.fontSize.sm,
                  color: SomniaColors.foregroundSecondary,
                }}>
                  Balance: <span style={{ fontWeight: SomniaTheme.fontWeight.semibold }}>{balance} STT</span>
                </div>
                <WalletConnectButton
                  onDisconnect={handleDisconnect}
                  isConnected={true}
                  account={account}
                  variant="secondary"
                  size="sm"
                />
              </div>
            </div>
            {rpsGame.gameState === 'idle' && (
              <Card>
                <div style={{ textAlign: 'center', padding: SomniaTheme.spacing['2xl'] }}>
                  <div style={{
                    marginBottom: SomniaTheme.spacing.lg,
                    color: SomniaColors.brandSecondary,
                    display: 'flex',
                    justifyContent: 'center',
                  }}>
                    <Gamepad2 size={48} />
                  </div>
                  <h2 style={{
                    fontFamily: SomniaTheme.fonts.geist,
                    color: SomniaColors.foreground,
                    marginBottom: SomniaTheme.spacing['2xl'],
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    fontWeight: SomniaTheme.fontWeight.semibold,
                  }}>
                    Ready to Play
                  </h2>

                  <div style={{
                    display: 'flex',
                    gap: SomniaTheme.spacing.lg,
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}>
                    <SomniaButton
                      onClick={() => rpsGame.actions.createGame()}
                      disabled={rpsGame.isTransactionPending}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: SomniaTheme.spacing.xs }}>
                        {rpsGame.isTransactionPending ? (
                          <><Clock size={16} style={{ color: SomniaColors.brandAccent }} /> Creating...</>
                        ) : (
                          <><Plus size={16} style={{ color: SomniaColors.success }} /> Create New Game</>
                        )}
                      </div>
                    </SomniaButton>

                    <div style={{
                      display: 'flex',
                      gap: SomniaTheme.spacing.sm,
                      alignItems: 'center',
                    }}>
                      <input
                        type="text"
                        placeholder="Session ID"
                        value={sessionToJoin}
                        onChange={(e) => setSessionToJoin(e.target.value)}
                        style={{
                          padding: `${SomniaTheme.spacing.sm} ${SomniaTheme.spacing.md}`,
                          borderRadius: SomniaTheme.borderRadius.md,
                          border: `1px solid ${SomniaColors.border}`,
                          background: SomniaColors.surface,
                          color: SomniaColors.foreground,
                          fontFamily: SomniaTheme.fonts.inter,
                          fontSize: SomniaTheme.fontSize.sm,
                          minWidth: '140px',
                          maxWidth: '180px',
                          outline: 'none',
                          transition: 'border-color 0.2s ease-in-out',
                        }}
                      />
                      <SomniaButton
                        onClick={() => rpsGame.actions.joinGame(sessionToJoin)}
                        disabled={!sessionToJoin.trim() || rpsGame.isTransactionPending}
                        variant="secondary"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: SomniaTheme.spacing.xs }}>
                          {rpsGame.isTransactionPending ? (
                            <><Clock size={16} style={{ color: SomniaColors.brandAccent }} /> Joining...</>
                          ) : (
                            <><DoorOpen size={16} style={{ color: SomniaColors.brandPrimary }} /> Join Game</>
                          )}
                        </div>
                      </SomniaButton>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {rpsGame.gameState === 'creating' && (
              <Card>
                <div style={{ textAlign: 'center', padding: SomniaTheme.spacing['2xl'] }}>
                  <div style={{ marginBottom: SomniaTheme.spacing.lg, color: SomniaColors.brandAccent, display: 'flex', justifyContent: 'center' }}>
                    <Clock size={48} className="animate-spin" />
                  </div>
                  <h2 style={{
                    fontFamily: SomniaTheme.fonts.geist,
                    color: SomniaColors.foreground,
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    fontWeight: SomniaTheme.fontWeight.semibold,
                  }}>Creating Game...</h2>
                  <p style={{
                    fontFamily: SomniaTheme.fonts.inter,
                    color: SomniaColors.foregroundSecondary,
                    marginTop: SomniaTheme.spacing.sm,
                  }}>Setting up your game session</p>
                </div>
              </Card>
            )}

            {rpsGame.gameState === 'waiting' && (
              <Card featured>
                <div style={{ textAlign: 'center', padding: SomniaTheme.spacing['2xl'] }}>
                  <div style={{ marginBottom: SomniaTheme.spacing.lg, color: SomniaColors.brandAccent, display: 'flex', justifyContent: 'center' }}>
                    <Clock size={48} className="animate-spin" />
                  </div>
                  <h2 style={{
                    fontFamily: SomniaTheme.fonts.geist,
                    color: SomniaColors.foreground,
                    marginBottom: SomniaTheme.spacing.lg,
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    fontWeight: SomniaTheme.fontWeight.semibold,
                  }}>Waiting for Opponent</h2>
                  <div style={{
                    background: SomniaColors.backgroundSecondary,
                    border: `1px solid ${SomniaColors.border}`,
                    borderRadius: SomniaTheme.borderRadius.lg,
                    padding: SomniaTheme.spacing.md,
                    marginBottom: SomniaTheme.spacing.lg,
                  }}>
                    <div style={{
                      fontFamily: SomniaTheme.fonts.inter,
                      color: SomniaColors.foregroundTertiary,
                      fontSize: SomniaTheme.fontSize.xs,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: SomniaTheme.spacing.xs,
                    }}>Session ID</div>
                    <div style={{
                      fontFamily: SomniaTheme.fonts.mono,
                      fontSize: SomniaTheme.fontSize.lg,
                      fontWeight: SomniaTheme.fontWeight.semibold,
                      color: SomniaColors.brandPrimary,
                    }}>{rpsGame.currentSession}</div>
                  </div>
                  <p style={{
                    fontFamily: SomniaTheme.fonts.inter,
                    color: SomniaColors.foregroundSecondary,
                    fontSize: SomniaTheme.fontSize.sm,
                    lineHeight: SomniaTheme.lineHeight.relaxed,
                  }}>Share this ID with your opponent to let them join!</p>
                </div>
              </Card>
            )}

            {rpsGame.gameState === 'committing' && (
              <Card>
                <div style={{ textAlign: 'center', padding: SomniaTheme.spacing['2xl'] }}>
                  <h2 style={{
                    marginBottom: SomniaTheme.spacing['2xl'],
                    fontFamily: SomniaTheme.fonts.geist,
                    color: SomniaColors.foreground,
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    fontWeight: SomniaTheme.fontWeight.semibold,
                  }}>Choose Your Move</h2>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: SomniaTheme.spacing.lg,
                    justifyContent: 'center',
                    maxWidth: '400px',
                    margin: '0 auto',
                  }}>
                    {(['rock', 'paper', 'scissors'] as const).map(move => (
                      <SomniaButton
                        key={move}
                        onClick={() => makeMove(move)}
                        disabled={rpsGame.isTransactionPending}
                        variant="outline"
                        size="lg"
                        className="move-button"
                      >
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: SomniaTheme.spacing.xs,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>{getMoveIcon(move, 32)}</div>
                          <div style={{
                            fontSize: SomniaTheme.fontSize.sm,
                            textTransform: 'capitalize',
                          }}>{move}</div>
                        </div>
                      </SomniaButton>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {rpsGame.gameState === 'revealing' && (
              <Card>
                <div style={{ textAlign: 'center', padding: SomniaTheme.spacing['2xl'] }}>
                  <h2 style={{
                    marginBottom: SomniaTheme.spacing.lg,
                    fontFamily: SomniaTheme.fonts.geist,
                    color: SomniaColors.foreground,
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    fontWeight: SomniaTheme.fontWeight.semibold,
                  }}>Reveal Phase</h2>

                  {selectedMove && (
                    <div style={{
                      marginBottom: SomniaTheme.spacing['2xl'],
                      background: SomniaColors.backgroundSecondary,
                      border: `1px solid ${SomniaColors.border}`,
                      borderRadius: SomniaTheme.borderRadius.lg,
                      padding: SomniaTheme.spacing.lg,
                    }}>
                      <div style={{
                        fontFamily: SomniaTheme.fonts.inter,
                        color: SomniaColors.foregroundTertiary,
                        fontSize: SomniaTheme.fontSize.xs,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: SomniaTheme.spacing.xs,
                      }}>Your Move</div>
                      <div style={{
                        marginBottom: SomniaTheme.spacing.xs,
                        display: 'flex',
                        justifyContent: 'center',
                      }}>{getMoveIcon(selectedMove, 32)}</div>
                      <div style={{
                        fontFamily: SomniaTheme.fonts.geist,
                        fontSize: SomniaTheme.fontSize.lg,
                        fontWeight: SomniaTheme.fontWeight.semibold,
                        color: SomniaColors.brandPrimary,
                        textTransform: 'uppercase',
                      }}>{selectedMove}</div>
                    </div>
                  )}

                  <div style={{ marginBottom: SomniaTheme.spacing.lg }}>
                    <SomniaButton
                      onClick={handleRevealMove}
                      disabled={rpsGame.isTransactionPending || rpsGame.hasRevealed}
                      size="lg"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: SomniaTheme.spacing.xs }}>
                        {rpsGame.hasRevealed ? (
                          <><CheckCircle size={16} style={{ color: SomniaColors.success }} /> Move Revealed</>
                        ) : rpsGame.isTransactionPending ? (
                          <><Clock size={16} style={{ color: SomniaColors.brandAccent }} /> Revealing...</>
                        ) : (
                          <><Eye size={16} style={{ color: SomniaColors.brandPurple }} /> Reveal Move</>
                        )}
                      </div>
                    </SomniaButton>
                  </div>

                  {rpsGame.hasRevealed && (
                    <div style={{ marginBottom: SomniaTheme.spacing.md }}>
                      <SomniaButton
                        onClick={() => rpsGame.actions.resetRevealState()}
                        variant="secondary"
                        size="sm"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: SomniaTheme.spacing.xs }}>
                          <RotateCcw size={16} style={{ color: SomniaColors.warning }} />
                          Reset Reveal State
                        </div>
                      </SomniaButton>
                    </div>
                  )}

                  {rpsGame.revealDeadline > 0 && Date.now() / 1000 > rpsGame.revealDeadline && (
                    <div>
                      <SomniaButton
                        onClick={handleForceResolve}
                        disabled={rpsGame.isTransactionPending}
                        variant="outline"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: SomniaTheme.spacing.xs }}>
                          {rpsGame.isTransactionPending ? (
                            <><Clock size={16} style={{ color: SomniaColors.brandAccent }} /> Resolving...</>
                          ) : (
                            <><Zap size={16} style={{ color: SomniaColors.warning }} /> Force Resolve</>
                          )}
                        </div>
                      </SomniaButton>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {rpsGame.gameState === 'finished' && rpsGame.gameResult && rpsGame.gameResult.players.length > 0 && (
              <Card>
                <div style={{ textAlign: 'center', padding: SomniaTheme.spacing['2xl'] }}>
                  <div style={{ marginBottom: SomniaTheme.spacing.lg, display: 'flex', justifyContent: 'center' }}>
                    {rpsGame.gameResult.isDraw ? (
                      <Handshake size={64} style={{ color: SomniaColors.warning }} />
                    ) : rpsGame.gameResult.winner.toLowerCase() === account.toLowerCase() ? (
                      <Trophy size={64} style={{ color: SomniaColors.success }} />
                    ) : (
                      <Frown size={64} style={{ color: SomniaColors.error }} />
                    )}
                  </div>
                  
                  <h2 style={{
                    fontFamily: SomniaTheme.fonts.geist,
                    marginBottom: SomniaTheme.spacing.lg,
                    color: SomniaColors.foreground,
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    fontWeight: SomniaTheme.fontWeight.semibold,
                  }}>
                    {getGameResultText()}
                  </h2>
                  
                  <div style={{ marginBottom: SomniaTheme.spacing['2xl'] }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: SomniaTheme.spacing['2xl'], marginBottom: SomniaTheme.spacing.lg }}>
                      {(() => {
                        const currentAccountLower = account.toLowerCase()
                        const players = rpsGame.gameResult.players
                        const moves = rpsGame.gameResult.moves
                        
                        const currentPlayerIndex = players.findIndex(p => p.toLowerCase() === currentAccountLower)
                        const opponentIndex = currentPlayerIndex === 0 ? 1 : 0
                        
                        const yourMove = (currentPlayerIndex !== -1 && moves[currentPlayerIndex] !== undefined) 
                          ? moves[currentPlayerIndex] : RPSMove.None
                        const opponentMove = (moves[opponentIndex] !== undefined) 
                          ? moves[opponentIndex] : RPSMove.None
                        
                        return (
                          <>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{
                                fontFamily: SomniaTheme.fonts.inter,
                                fontSize: SomniaTheme.fontSize.xs,
                                color: SomniaColors.foregroundTertiary,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: SomniaTheme.spacing.xs,
                              }}>You</div>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                {yourMove !== RPSMove.None ? getMoveIcon(yourMove, 48) : <HelpCircle size={48} />}
                              </div>
                            </div>
                            <div style={{
                              fontFamily: SomniaTheme.fonts.geist,
                              fontSize: '2rem',
                              alignSelf: 'center',
                              color: SomniaColors.brandAccent,
                              fontWeight: SomniaTheme.fontWeight.semibold,
                            }}>VS</div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{
                                fontFamily: SomniaTheme.fonts.inter,
                                fontSize: SomniaTheme.fontSize.xs,
                                color: SomniaColors.foregroundTertiary,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: SomniaTheme.spacing.xs,
                              }}>Opponent</div>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                {opponentMove !== RPSMove.None ? getMoveIcon(opponentMove, 48) : <HelpCircle size={48} />}
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                    
                    <div style={{
                      background: SomniaColors.backgroundSecondary,
                      border: `1px solid ${SomniaColors.border}`,
                      borderRadius: SomniaTheme.borderRadius.lg,
                      padding: SomniaTheme.spacing.md,
                      display: 'inline-block',
                    }}>
                      <div style={{
                        fontFamily: SomniaTheme.fonts.inter,
                        color: SomniaColors.foregroundTertiary,
                        fontSize: SomniaTheme.fontSize.xs,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: SomniaTheme.spacing.xs,
                      }}>Prize Pool</div>
                      <div style={{
                        fontFamily: SomniaTheme.fonts.geist,
                        fontSize: SomniaTheme.fontSize.lg,
                        fontWeight: SomniaTheme.fontWeight.semibold,
                        color: SomniaColors.success,
                      }}>
                        {Number(rpsGame.gameResult.prizeAmount) / 1e18} STT
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: SomniaTheme.spacing.lg, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <SomniaButton onClick={handleNewGame}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: SomniaTheme.spacing.xs }}>
                        <RotateCcw size={16} style={{ color: SomniaColors.brandPrimary }} />
                        Play Again
                      </div>
                    </SomniaButton>
                    
                    {/* Auto-withdrawal success message */}
                    {rpsGame.gameResult && (
                      rpsGame.gameResult.winner.toLowerCase() === account.toLowerCase() || rpsGame.gameResult.isDraw
                    ) && rpsGame.userBalance === 0n && (
                      <div style={{
                        padding: SomniaTheme.spacing.sm,
                        backgroundColor: `${SomniaColors.success}15`,
                        border: `1px solid ${SomniaColors.success}40`,
                        borderRadius: SomniaTheme.borderRadius.md,
                        color: SomniaColors.success,
                        fontSize: SomniaTheme.fontSize.sm,
                        textAlign: 'center',
                        maxWidth: '300px',
                        fontFamily: SomniaTheme.fonts.inter,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: SomniaTheme.spacing.xs }}>
                          <CheckCircle size={16} style={{ color: SomniaColors.success }} />
                          Prize automatically transferred to your wallet!
                        </div>
                      </div>
                    )}

                    {/* Emergency withdrawal for failed auto-withdrawals */}
                    {isEligibleForEmergencyWithdraw() && (
                      <div style={{ marginTop: SomniaTheme.spacing.md }}>
                        <div style={{
                          padding: SomniaTheme.spacing.xs,
                          backgroundColor: `${SomniaColors.warning}15`,
                          border: `1px solid ${SomniaColors.warning}40`,
                          borderRadius: SomniaTheme.borderRadius.md,
                          color: SomniaColors.warning,
                          fontSize: SomniaTheme.fontSize.xs,
                          textAlign: 'center',
                          marginBottom: SomniaTheme.spacing.xs,
                          fontFamily: SomniaTheme.fonts.inter,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: SomniaTheme.spacing.xs }}>
                            <AlertTriangle size={16} style={{ color: SomniaColors.warning }} />
                            Auto-withdrawal failed. Use emergency withdrawal below.
                          </div>
                        </div>
                        <SomniaButton
                          onClick={rpsGame.actions.withdraw}
                          disabled={rpsGame.isTransactionPending}
                          variant="secondary"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: SomniaTheme.spacing.xs }}>
                            {rpsGame.isTransactionPending ? (
                              <><Clock size={16} style={{ color: SomniaColors.brandAccent }} /> {getEmergencyWithdrawButtonText()}</>
                            ) : (
                              <><Siren size={16} style={{ color: SomniaColors.error }} /> {getEmergencyWithdrawButtonText()}</>
                            )}
                          </div>
                        </SomniaButton>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {rpsGame.gameState !== 'idle' && rpsGame.gameState !== 'creating' && rpsGame.currentSession && (
              <div style={{ marginTop: SomniaTheme.spacing['4xl'] }}>
                <h3 style={{
                  marginBottom: SomniaTheme.spacing.md,
                  color: SomniaColors.foreground,
                  fontFamily: SomniaTheme.fonts.geist,
                  fontSize: SomniaTheme.fontSize.lg,
                  fontWeight: SomniaTheme.fontWeight.semibold,
                }}>
                  Game Status
                </h3>
                <div style={{ display: 'grid', gap: SomniaTheme.spacing.md }}>
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