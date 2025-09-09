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
import { GameTimer } from './components/GameTimer'
import { PlayerStatus } from './components/PlayerStatus'

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
  const ErrorDisplay = () => {
    if (!error && !rpsGame.error) return null
    
    const displayError = error || rpsGame.error
    
    return (
      <div style={{
        background: '#FEE2E2',
        border: '1px solid #FECACA',
        color: '#DC2626',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '14px'
      }}>
        ⚠️ {displayError}
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
                    <SomniaButton onClick={() => rpsGame.actions.createGame()}>
                      🆕 Create New Game
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
                        disabled={!sessionToJoin.trim()}
                        variant="secondary"
                      >
                        🚪 Join Game
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
                  
                  {rpsGame.revealDeadline > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <GameTimer 
                        deadline={rpsGame.revealDeadline} 
                        onExpired={handleForceResolve}
                      />
                    </div>
                  )}
                  
                  <SomniaButton onClick={handleRevealMove}>
                    🎭 Reveal Move
                  </SomniaButton>
                  
                  {rpsGame.revealDeadline > 0 && Date.now() > rpsGame.revealDeadline && (
                    <div style={{ marginTop: '20px' }}>
                      <SomniaButton onClick={handleForceResolve} variant="secondary">
                        ⚡ Force Resolve
                      </SomniaButton>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {rpsGame.gameState === 'finished' && rpsGame.gameResult && (
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
                      <div>
                        <div style={{ fontSize: '0.9rem', color: SomniaColors.gray[600] }}>You</div>
                        <div style={{ fontSize: '3rem' }}>{getMoveEmoji(rpsGame.gameResult.moves[0])}</div>
                      </div>
                      <div style={{ fontSize: '2rem', alignSelf: 'center' }}>VS</div>
                      <div>
                        <div style={{ fontSize: '0.9rem', color: SomniaColors.gray[600] }}>Opponent</div>
                        <div style={{ fontSize: '3rem' }}>{getMoveEmoji(rpsGame.gameResult.moves[1])}</div>
                      </div>
                    </div>
                    
                    <p style={{ color: SomniaColors.gray[600] }}>
                      Prize: {Number(rpsGame.gameResult.prizeAmount) / 1e18} STT
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <SomniaButton onClick={handleNewGame}>
                      🔄 Play Again
                    </SomniaButton>
                    <SomniaButton onClick={rpsGame.actions.withdraw} variant="secondary">
                      💰 Withdraw Winnings
                    </SomniaButton>
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